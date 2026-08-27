/* Pricing data layer — the SELECT fragments and side-data fetches the
 * pricing functions need, kept beside them so a consuming app reads the
 * right shape without re-deriving it.
 *
 * Each fragment's `Payload` type IS the pricing functions' input type
 * (`PriceableProduct` → `getSaleUnitPrice`, `PriceListLineRow` → the discount
 * step, …) — defined here, consumed by `pricing/`. Add a field to a fragment
 * and it flows straight into the function that reads it.
 *
 * Two mechanisms, by who owns the fetch:
 *  - SELECT FRAGMENTS (`currencySelect`, `productPriceSelectFields`, …) —
 *    for data that rides on a row the APP already fetches (a product, a
 *    listing) alongside everything else it needs. The app spreads the
 *    fragment into its OWN query; the resulting row IS the matching pricing
 *    input. Fetching the product stays the app's concern.
 *  - FETCH FUNCTIONS (`fetchConversionLines`, `findPartnerFiscalPosition`,
 *    …) — for data that exists ONLY to feed pricing, on rows the app never
 *    otherwise touches (exchange rates, the buyer's fiscal position, the
 *    company-specific-field set, price lists / their lines, unit conversions).
 *    The app just calls these and hands the result to the pricing functions.
 *
 * This is the ONLY file in `core/product` that talks to the ORM client; the
 * compute layer imports only the `Payload` types from here, so it stays
 * unit-testable without a database. */
import type {Client} from '@/goovee/.generated/client';
import type {
  AOSAccountManagement,
  AOSCurrency,
  AOSCurrencyConversionLine,
  AOSFiscalPosition,
  AOSPriceList,
  AOSPriceListLine,
  AOSProduct,
  AOSTax,
  AOSUnitConversion,
} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';

/* ──────────────────────────────────────────────────────────────────────
 * Select fragments — spread into the app's own product/listing query.
 * ────────────────────────────────────────────────────────────────────── */

export const currencySelect = {
  code: true,
  /* Conversion lines are matched on the ISO code (AOS `CurrencyServiceImpl`
   * keys on `codeISO`, not the printing `code`). */
  codeISO: true,
  symbol: true,
  numberOfDecimals: true,
} as const satisfies SelectOptions<AOSCurrency>;

export type Currency = Payload<AOSCurrency, {select: typeof currencySelect}>;

/** One tax with just the fields rate resolution needs: the active line's
 *  value, or the dated lines to window against today. Shared by a product's
 *  account-management set and a fiscal position's target set. */
export const taxSelectFields = {
  id: true,
  /* Line ids matter: AOS collects resolved tax lines into a Set, so a
   * TaxLine shared by two taxes is counted once. */
  activeTaxLine: {id: true, value: true},
  taxLineList: {
    select: {id: true, value: true, startDate: true, endDate: true},
  },
} as const satisfies SelectOptions<AOSTax>;

export type TaxRow = Payload<AOSTax, {select: typeof taxSelectFields}>;

export const accountManagementSelectFields = {
  company: {id: true},
  saleTaxSet: {select: taxSelectFields},
} as const satisfies SelectOptions<AOSAccountManagement>;

/** One row from `accountManagementList` — the minimum for tax resolution.
 *  Defined at the leaf so it can sit on both the product and its family. */
export type AccountManagementRow = Payload<
  AOSAccountManagement,
  {select: typeof accountManagementSelectFields}
>;

/** The price-defining fields of a bare product: the sale price, the
 *  per-company override rows, and the tax configuration (own + family).
 *  Spread this into the app's product query — the row then satisfies the
 *  core's `PricingProduct` structural input for `getSaleUnitPrice`. */
export const productPriceSelectFields = {
  salePrice: true,
  inAti: true,
  saleCurrency: currencySelect,
  /* The sale unit (`salesUnit ?? unit`) the price is expressed in, and the
   * category — both pricing inputs: the unit for an optional unit conversion,
   * the category for price-list lines that target a category rather than the
   * product. */
  unit: {id: true},
  salesUnit: {id: true},
  productCategory: {id: true},
  /* Per-company overrides of `salePrice` / `inAti` / `saleCurrency`. AOS
   * reads these via `ProductCompanyService` before falling back to the
   * base product fields. */
  productCompanyList: {
    select: {
      company: {id: true},
      salePrice: true,
      inAti: true,
      saleCurrency: currencySelect,
    },
  },
  /* Product-level account-management overrides. AOS consults these before
   * falling back to the product family's list. */
  accountManagementList: {select: accountManagementSelectFields},
  productFamily: {
    accountManagementList: {select: accountManagementSelectFields},
  },
} as const satisfies SelectOptions<AOSProduct>;

export type PriceableProduct = Payload<
  AOSProduct,
  {select: typeof productPriceSelectFields}
>;

/** The price-list fields `getDefaultPriceList` needs: the general discount and
 *  the active-window flags. Lives on the buyer's `salePartnerPriceList
 *  .priceListSet` (see `findPartnerSalePriceLists`). */
export const priceListSelectFields = {
  generalDiscount: true,
  isActive: true,
  applicationBeginDate: true,
  applicationEndDate: true,
} as const satisfies SelectOptions<AOSPriceList>;

export type PriceListRow = Payload<
  AOSPriceList,
  {select: typeof priceListSelectFields}
>;

/** One price-list line: the rule (`typeSelect`/`amountTypeSelect`/`amount`),
 *  the quantity threshold, and what it targets (a product or a category).
 *  Fetched per price list by `fetchPriceListLines`; `getPriceListLine`
 *  partitions product- vs category-lines. */
export const priceListLineSelectFields = {
  typeSelect: true,
  amountTypeSelect: true,
  amount: true,
  minQty: true,
  product: {id: true},
  productCategory: {id: true},
} as const satisfies SelectOptions<AOSPriceListLine>;

export type PriceListLineRow = Payload<
  AOSPriceListLine,
  {select: typeof priceListLineSelectFields}
>;

/** One unit-conversion line — the COEFF coefficient between two units (the
 *  pricing core honours only `typeSelect === TYPE_COEFF`). Fetched globally by
 *  `fetchUnitConversions`. */
export const unitConversionSelectFields = {
  startUnit: {id: true},
  endUnit: {id: true},
  coef: true,
  typeSelect: true,
} as const satisfies SelectOptions<AOSUnitConversion>;

export type UnitConversionRow = Payload<
  AOSUnitConversion,
  {select: typeof unitConversionSelectFields}
>;

/* ──────────────────────────────────────────────────────────────────────
 * Fetch functions — pricing-only side data the app never otherwise reads.
 * ────────────────────────────────────────────────────────────────────── */

/** Select for one exchange-rate row. Spread it into a
 *  `currencyConversionLineList: {where, select: …}`, or just call
 *  `fetchConversionLines`, which does that filtering for you. */
export const conversionLineSelectFields = {
  startCurrency: {codeISO: true},
  endCurrency: {codeISO: true},
  exchangeRate: true,
  fromDate: true,
  toDate: true,
} as const satisfies SelectOptions<AOSCurrencyConversionLine>;

export type ConversionLine = Payload<
  AOSCurrencyConversionLine,
  {select: typeof conversionLineSelectFields}
>;

/** Fetches the conversion lines needed to convert between the given source
 *  currencies and any of the target currencies. Filters to just the
 *  relevant (from, to) pairs (both directions) so the whole table isn't
 *  pulled. Returns empty when there is nothing to convert. */
export async function fetchConversionLines({
  client,
  fromCodes,
  toCodes,
}: {
  client: Client;
  fromCodes: Array<string | null | undefined>;
  toCodes: Array<string | null | undefined>;
}) {
  const tos = Array.from(
    new Set(
      toCodes.filter((c): c is string => typeof c === 'string' && c.length > 0),
    ),
  );
  if (tos.length === 0) return [];
  const froms = Array.from(
    new Set(
      fromCodes.filter(
        (c): c is string => typeof c === 'string' && c.length > 0,
      ),
    ),
  );
  if (froms.length === 0) return [];

  const appBase = await client.aOSAppBase.findOne({
    where: {OR: [{archived: false}, {archived: null}]},
    select: {
      currencyConversionLineList: {
        where: {
          OR: [
            {
              startCurrency: {codeISO: {in: froms}},
              endCurrency: {codeISO: {in: tos}},
            },
            {
              startCurrency: {codeISO: {in: tos}},
              endCurrency: {codeISO: {in: froms}},
            },
          ],
        },
        select: conversionLineSelectFields,
      },
    },
  });
  return appBase?.currencyConversionLineList ?? [];
}

/** Names of the product fields an admin flagged company-specific
 *  (`appBase.companySpecificProductFieldsSet`). AOS consults a product's
 *  per-company override row only for fields in this set
 *  (`ProductCompanyServiceImpl.isCompanySpecificProductFields`); feed it to
 *  `getSaleUnitPrice`. */
export async function findCompanySpecificProductFields(client: Client) {
  const appBase = await client.aOSAppBase.findOne({
    where: {OR: [{archived: false}, {archived: null}]},
    select: {
      companySpecificProductFieldsSet: {select: {name: true}},
    },
  });
  return (appBase?.companySpecificProductFieldsSet ?? [])
    .map(field => field.name)
    .filter((name): name is string => !!name);
}

/** Select for a buyer's fiscal position with its tax equivalences — the
 *  shape the pricing functions consume for per-buyer tax remapping. */
export const fiscalPositionSelectFields = {
  taxEquivList: {
    select: {
      fromTaxSet: {select: {id: true}},
      toTaxSet: {select: taxSelectFields},
    },
  },
} as const satisfies SelectOptions<AOSFiscalPosition>;

export type FiscalPositionInput = Payload<
  AOSFiscalPosition,
  {select: typeof fiscalPositionSelectFields}
>;

/** Loads the buyer partner's fiscal position with its `taxEquivList`, ready
 *  to feed the pricing functions. Null when the partner has none (each tax
 *  is then used as-is). */
export async function findPartnerFiscalPosition({
  client,
  mainPartnerId,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
}) {
  if (!mainPartnerId) return null;
  const partner = await client.aOSPartner.findOne({
    where: {id: mainPartnerId},
    select: {fiscalPosition: fiscalPositionSelectFields},
  });
  return partner?.fiscalPosition ?? null;
}

/** The buyer partner's own currency, or null. */
export async function findPartnerCurrency({
  client,
  mainPartnerId,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
}) {
  if (!mainPartnerId) return null;
  const partner = await client.aOSPartner.findOne({
    where: {id: mainPartnerId},
    select: {currency: currencySelect},
  });
  return partner?.currency ?? null;
}

/** Looks up a currency by its ISO 4217 code (`codeISO`) — the unique identity
 *  the rest of pricing keys on (conversion lines are matched on `codeISO`, not
 *  the printing `code`). The app chooses which code, e.g. an app-wide default.
 *  Returns null if the row is missing — the caller decides whether that is a
 *  hard failure or a soft fallback. */
export async function findCurrencyByCodeISO({
  client,
  codeISO,
}: {
  client: Client;
  codeISO: string;
}) {
  return client.aOSCurrency.findOne({
    where: {codeISO},
    select: currencySelect,
  });
}

/** The COEFF unit-conversion lines (`entitySelect = 0`, ENTITY_ALL) the pricing
 *  core uses to quote a price in a unit other than the product's sale unit.
 *  Global, pricing-only side data — mirrors `fetchConversionLines`. The core
 *  (`getUnitCoefficient`) picks the right line and rejects non-COEFF ones. */
export async function fetchUnitConversions(client: Client) {
  return client.aOSUnitConversion.find({
    where: {entitySelect: 0},
    select: unitConversionSelectFields,
  });
}

/** The buyer's candidate sale price lists — the `priceListSet` of their
 *  `salePartnerPriceList`. Hand the result to the pure `getDefaultPriceList`
 *  (it keeps the single active one whose window contains today). Empty when the
 *  partner has none. */
export async function findPartnerSalePriceLists({
  client,
  mainPartnerId,
}: {
  client: Client;
  mainPartnerId: string | null | undefined;
}): Promise<PriceListRow[]> {
  if (!mainPartnerId) return [];
  const partner = await client.aOSPartner.findOne({
    where: {id: mainPartnerId},
    select: {
      salePartnerPriceList: {priceListSet: {select: priceListSelectFields}},
    },
  });
  return partner?.salePartnerPriceList?.priceListSet ?? [];
}

/** All lines of one price list, with the product / category they target — the
 *  core partitions these per product (its lines vs its category's) the way
 *  AOS's two queries do. */
export async function fetchPriceListLines(client: Client, priceListId: string) {
  return client.aOSPriceListLine.find({
    where: {priceList: {id: priceListId}},
    select: priceListLineSelectFields,
  });
}
