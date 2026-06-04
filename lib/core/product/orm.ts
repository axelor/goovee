/* Pricing data layer — the SELECT fragments and side-data fetches the
 * pricing functions need, kept beside them so a consuming app reads the
 * right shape without re-deriving it.
 *
 * Two mechanisms, by who owns the fetch:
 *  - SELECT FRAGMENTS (`currencySelect`, `productPriceSelectFields`, …) —
 *    for data that rides on a row the APP already fetches (a product, a
 *    listing) alongside everything else it needs. The app spreads the
 *    fragment into its OWN query; the resulting row structurally satisfies
 *    the matching `Pricing*` input of `pricing.ts` / `price-list.ts`.
 *    Fetching the product stays the app's concern.
 *  - FETCH FUNCTIONS (`fetchConversionLines`, `findPartnerFiscalPosition`,
 *    …) — for data that exists ONLY to feed pricing, on rows the app never
 *    otherwise touches (exchange rates, the buyer's fiscal position, the
 *    company-specific-field set, a currency lookup). The app just calls
 *    these and hands the result to the pricing functions.
 *
 * This is the ONLY file in `core/product` that talks to the ORM client; the
 * compute layer stays pure and unit-testable without a database. */
import type {Client} from '@/goovee/.generated/client';
import type {
  AOSAccountManagement,
  AOSCurrency,
  AOSCurrencyConversionLine,
  AOSFiscalPosition,
  AOSProduct,
  AOSTax,
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
