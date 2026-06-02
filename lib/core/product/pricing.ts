/* Product price computation — a faithful TypeScript port of the AOS
 * pricing services. Computing a price here gives the same result the
 * AOS back end would invoice.
 *
 * This module is generic: it knows nothing about any subapp. It defines
 * its own structural input types (the `Pricing*` family) so callers can
 * feed it their own ORM result shapes, and it fails exactly where AOS
 * fails — wherever the Java throws an `AxelorException`, this module
 * throws a `PriceComputationError` carrying the matching error code.
 * Callers decide their own degradation policy (see the marketplace
 * adapter in `(subapps)/marketplace/common/utils/price.ts` for an
 * example: lenient display fallbacks layered on top of this core).
 *
 * ──────────────────────────────────────────────────────────────────────
 * Vocabulary
 * ──────────────────────────────────────────────────────────────────────
 * - WT — the price WITHOUT tax (net).
 * - ATI — the price with ALL TAXES INCLUDED (gross).
 * - inAti — a flag telling which of the two a stored number means:
 *   true → the number is the ATI price; false → it is the WT price.
 * - Tax / tax line — in AOS a Tax (e.g. "VAT") is a container; its dated
 *   TaxLine rows carry the actual rates ("20% from 2014-01-01"). The
 *   line that is currently active is the one that applies.
 * - Account management — a per-company configuration row on a product
 *   (or on its product family) that lists which sale taxes apply.
 * - Fiscal position — buyer-specific tax rules: an equivalence like
 *   "instead of {domestic VAT}, this buyer pays {export VAT}".
 * - Conversion line — an exchange-rate row in AOS: from currency, to
 *   currency, the rate, and the dates it is valid for.
 *
 * ──────────────────────────────────────────────────────────────────────
 * How a price is computed (in reading order)
 * ──────────────────────────────────────────────────────────────────────
 * The module mirrors AOS's own two-level API
 * (`ProductPriceServiceImpl.getSaleUnitPrice` → `getConvertedPrice`):
 *
 * Level 1 — `getSaleUnitPrice` — "price THIS PRODUCT for this company":
 *   a. Read `salePrice` / `inAti` / `saleCurrency` off the product. In a
 *      multi-company setup a product can carry per-company override rows
 *      (`productCompanyList`); a row is honoured only for fields the
 *      admin has flagged as company-specific, and when it is honoured it
 *      is read as-is — a null on the row does NOT fall back to the base
 *      product. (See `resolveProductField`.)
 *   b. Work out which taxes apply (see `getSaleTaxLineSet` below).
 *   c. Hand everything to level 2.
 *
 * Level 2 — `getConvertedPrice` — "price THESE VALUES":
 *   d. Sum the tax-line rates into one percentage.
 *   e. Derive both bases from the stored number: if the price is ATI,
 *      WT = price / (1 + rate/100); if it is WT, ATI = WT + WT·rate/100.
 *   f. Convert both amounts to the target currency using the conversion
 *      lines (details at `getExchangeRate`).
 *   Level 2 exists so that things which OWN their price — AOS sale-order
 *   lines, price lists, marketplace listings — can be priced without
 *   pretending the values came from the product.
 *
 * Tax resolution (`getSaleTaxLineSet`), step b in detail:
 *   - Find the account-management row for the selling company: first on
 *     the product itself, then on its product family. A product-level
 *     row whose tax list is empty is treated as "accounting-only" and
 *     skipped in favour of the family's. No row anywhere → error
 *     ACCOUNT_MANAGEMENT_3.
 *   - Apply the buyer's fiscal position, if any: when one of its
 *     equivalences lists EXACTLY the product's tax set as its source,
 *     the whole set is swapped for the equivalence's target taxes.
 *     A partial overlap does nothing — it is all-or-nothing.
 *   - For each tax, pick the applicable line: the explicitly active one
 *     if set, otherwise the first line whose date window contains today
 *     (today is computed in the company's timezone). The picked lines
 *     form a SET — if two taxes point at the same line it counts once.
 *
 * ──────────────────────────────────────────────────────────────────────
 * One deliberate deviation from the AOS signature
 * ──────────────────────────────────────────────────────────────────────
 * AOS's `getConvertedPrice` re-reads `inAti` off the PRODUCT
 * (ProductPriceServiceImpl.java:144-147) — it silently assumes the price
 * it was handed is expressed in the product's tax basis. That holds for
 * every AOS caller, but not for a caller whose record copied the flag
 * once and froze it (e.g. a marketplace listing): if an admin later
 * flips the product's flag, the two disagree and the caller's stored
 * flag is the correct one. So our level 2 takes `sourceInAti` as an
 * explicit parameter instead of re-reading it.
 *
 * ──────────────────────────────────────────────────────────────────────
 * The AOS code this mirrors
 * ──────────────────────────────────────────────────────────────────────
 *   axelor-sale/.../ProductRestService.fetchProductPrice
 *     → axelor-base/.../ProductPriceServiceImpl.getSaleUnitPrice
 *     → axelor-base/.../AccountManagementServiceImpl.getTaxLineSet
 *     → axelor-base/.../FiscalPositionServiceImpl.getTaxSet
 *     → axelor-base/.../TaxService.getTaxLineSet + convertUnitPrice
 *     → axelor-base/.../CurrencyServiceImpl.getAmountCurrencyConvertedAtDate
 *     → axelor-base/.../ProductCompanyServiceImpl.get
 *
 * ──────────────────────────────────────────────────────────────────────
 * Known differences vs AOS (precision only — the logic is identical)
 * ──────────────────────────────────────────────────────────────────────
 * - Price lists are not applied. AOS finishes by running the buyer's
 *   sale price list (discounts / markups / replacement prices) over the
 *   unit price; callers surface the catalogue price, so a buyer who has
 *   a price list would be invoiced differently than displayed.
 * - No unit conversion. AOS can quote a price per requested unit (e.g.
 *   per gram for a product sold per kilogram); this module prices one
 *   item in the product's own unit.
 * - No rounding is applied here — both levels return raw values and the
 *   caller rounds at whatever scale its context requires. AOS rounds at
 *   its configurable unit-price precision (often 4 decimals).
 * - Arithmetic is plain float64 instead of BigDecimal, and exchange
 *   rates are applied unrounded where AOS first rounds them to 6
 *   decimals (8 for an inverted rate). For realistic prices and rates
 *   the rounded results agree; drift is theoretical.
 */

import type {BigDecimal} from '@goovee/orm';

/* ----- Input types.
 *
 * These describe the minimum shape each computation needs — nothing
 * more. Callers' generated ORM result types fit them structurally
 * (checked by the compiler at the call sites), which is what keeps this
 * module independent of any subapp's schema. ----- */

/** Any value `Number(...)` understands: plain numbers, decimal strings,
 *  and the ORM's `BigDecimal` objects (which stringify to their decimal
 *  value). */
export type DecimalLike = string | number | BigDecimal;

/* Nullability follows the schema declarations exactly: a field that is
 * `required` in the schema is plain `T`; one that isn't is `T | null`
 * (the generated payloads never produce `undefined` for a selected
 * field). */

export type PricingCurrency = {
  /** Required + unique in the schema — always present. */
  codeISO: string;
  numberOfDecimals: number | null;
};

/** One dated rate of a tax, e.g. "20% from 2014-01-01". */
export type PricingTaxLine = {
  id: string;
  value: DecimalLike | null;
  startDate: string;
  endDate: string | null;
};

/** A tax with its rates: the explicitly active line, plus the dated
 *  history to fall back on. */
export type PricingTax = {
  id: string;
  activeTaxLine: {id: string; value: DecimalLike | null} | null;
  taxLineList: readonly PricingTaxLine[] | null;
};

/** Per-company tax configuration: "for this company, these sale taxes
 *  apply". */
export type PricingAccountManagement = {
  company: {id: string};
  saleTaxSet: readonly PricingTax[] | null;
};

/** Buyer-specific tax rules: each equivalence swaps one exact set of
 *  taxes for another (e.g. {domestic VAT} → {export VAT}). */
export type PricingFiscalPosition = {
  taxEquivList:
    | readonly {
        fromTaxSet: readonly {id: string}[] | null;
        toTaxSet: readonly PricingTax[] | null;
      }[]
    | null;
};

/** One exchange-rate row: from → to, the rate, and its validity window
 *  (`fromDate` is required in AOS; a missing `toDate` means open-ended). */
export type PricingConversionLine = {
  startCurrency: {codeISO: string};
  endCurrency: {codeISO: string};
  exchangeRate: DecimalLike | null;
  fromDate: string;
  toDate: string | null;
};

type SaleFieldName = 'salePrice' | 'inAti' | 'saleCurrency';

/** What level 1 needs from a product: the sale price fields, the
 *  per-company override rows, and the tax configuration (own and
 *  family-level). */
export type PricingProduct = {
  salePrice: DecimalLike | null;
  inAti: boolean | null;
  saleCurrency: PricingCurrency | null;
  productCompanyList:
    | readonly {
        company: {id: string} | null;
        salePrice: DecimalLike | null;
        inAti: boolean | null;
        saleCurrency: PricingCurrency | null;
      }[]
    | null;
  accountManagementList: readonly PricingAccountManagement[] | null;
  productFamily: {
    accountManagementList: readonly PricingAccountManagement[] | null;
  } | null;
};

/** Why a price could not be computed. Each code corresponds to one spot
 *  where the mirrored AOS Java throws an `AxelorException`, so a caller
 *  can react exactly like an AOS admin would read the original error. */
export type PriceComputationErrorCode =
  /** The product (and its family) has no sale tax configured for this company. */
  | 'ACCOUNT_MANAGEMENT_3'
  /** Taxes exist, but none of them has a usable rate line. */
  | 'TAX_1'
  /** An empty tax set was handed to tax-line resolution. */
  | 'TAX_2'
  /** No exchange-rate line exists between the two currencies, in either direction. */
  | 'CURRENCY_1'
  /** An exchange-rate line exists but its rate is zero or unreadable. */
  | 'CURRENCY_2';

export class PriceComputationError extends Error {
  constructor(
    public readonly code: PriceComputationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PriceComputationError';
  }
}

/** Reads one sale field off the product, honouring the per-company
 *  override rows the way AOS does (`ProductCompanyServiceImpl.get`):
 *
 *  - If the admin has NOT flagged this field as company-specific, the
 *    override rows are ignored entirely — base product value.
 *  - If it IS flagged and a row exists for the selling company, the
 *    row's value is used as-is. Deliberately no fallback: a null on the
 *    row stays null, because in AOS the row fully owns the field.
 *  - Otherwise, the base product value. */
export function resolveProductField<
  P extends PricingProduct,
  K extends SaleFieldName,
>(
  product: P,
  fieldName: K,
  companyId: string | null | undefined,
  companySpecificProductFields: readonly string[],
): P[K] {
  if (!companySpecificProductFields.includes(fieldName)) {
    return product[fieldName];
  }
  if (companyId != null) {
    const row = product.productCompanyList?.find(
      pc => pc.company?.id === companyId,
    );
    if (row) return row[fieldName] as P[K];
  }
  return product[fieldName];
}

/** Finds the account-management row (the "which taxes apply" config)
 *  for the selling company: first on the product itself, then on its
 *  product family. No company → no row.
 *
 *  Subtlety mirrored from AOS (`AccountManagementServiceImpl
 *  .getProductTax`): a product-level row whose tax list is EMPTY also
 *  falls through to the family. Admins sometimes add a product-level
 *  row purely for accounting overrides (sale account, journal) and
 *  still rely on the family for the taxes. */
function resolveAccountManagement(
  product: PricingProduct,
  companyId: string | null | undefined,
): PricingAccountManagement | null {
  if (companyId == null) return null;
  const pickForCompany = (
    list: readonly PricingAccountManagement[] | null | undefined,
  ) => list?.find(am => am.company.id === companyId) ?? null;

  const productLevel = pickForCompany(product.accountManagementList);
  if (productLevel?.saleTaxSet && productLevel.saleTaxSet.length > 0) {
    return productLevel;
  }
  return pickForCompany(product.productFamily?.accountManagementList);
}

/** The product's sale taxes for this company, or — when nothing is
 *  configured anywhere — the ACCOUNT_MANAGEMENT_3 error, thrown at the
 *  same point AOS throws it. */
function getProductTaxSet(
  product: PricingProduct,
  companyId: string | null | undefined,
): readonly PricingTax[] {
  const accountManagement = resolveAccountManagement(product, companyId);
  const taxSet = accountManagement?.saleTaxSet;
  if (!taxSet || taxSet.length === 0) {
    throw new PriceComputationError(
      'ACCOUNT_MANAGEMENT_3',
      'No sale tax configured for the product/company',
    );
  }
  return taxSet;
}

/** Applies the buyer's fiscal position: if one of its equivalences lists
 *  EXACTLY the product's tax set as its source (same tax ids — not a
 *  subset, not a superset), the whole set is replaced by that
 *  equivalence's target taxes. First match wins; no match keeps the
 *  original set.
 *
 *  The all-or-nothing comparison is the AOS rule
 *  (`FiscalPositionServiceImpl.getTaxSet` uses `Set.equals`). An
 *  equivalence covering only some of the product's taxes does nothing. */
function applyFiscalPosition(
  taxSet: readonly PricingTax[],
  fiscalPosition: PricingFiscalPosition | null | undefined,
): readonly PricingTax[] {
  const equivs = fiscalPosition?.taxEquivList;
  if (!equivs || equivs.length === 0 || taxSet.length === 0) return taxSet;

  const taxIds = new Set(taxSet.map(t => t.id));
  for (const equiv of equivs) {
    const fromIds = (equiv.fromTaxSet ?? []).map(t => t.id);
    if (
      fromIds.length > 0 &&
      fromIds.length === taxIds.size &&
      fromIds.every(id => taxIds.has(id)) &&
      equiv.toTaxSet &&
      equiv.toTaxSet.length > 0
    ) {
      return equiv.toTaxSet;
    }
  }
  return taxSet;
}

/** A tax line once picked: just its identity and its rate. The id is
 *  what lets us deduplicate — AOS collects the picked lines into a
 *  `HashSet`, so one line shared by two taxes must count once. */
export type ResolvedTaxLine = {id: string; value: number | null};

/** Picks one rate line per tax and deduplicates the result
 *  (`TaxService.getTaxLineSet`).
 *
 *  Errors, at the same points as AOS: an empty input set → TAX_2; taxes
 *  present but none of them produced anything → TAX_1. A tax whose
 *  dated lines simply don't cover today is NOT an error — AOS records
 *  it as a null member and it contributes 0% (see `resolveTaxLine`). */
function getTaxLineSet(
  taxSet: readonly PricingTax[],
  today: string,
): ResolvedTaxLine[] {
  if (taxSet.length === 0) {
    throw new PriceComputationError('TAX_2', 'Empty tax set');
  }
  const byId = new Map<string, ResolvedTaxLine>();
  let hasNullMember = false;
  for (const tax of taxSet) {
    const resolved = resolveTaxLine(tax, today);
    if (resolved === undefined) continue;
    if (resolved === null) {
      hasNullMember = true;
      continue;
    }
    byId.set(resolved.id, resolved);
  }
  if (byId.size === 0 && !hasNullMember) {
    throw new PriceComputationError(
      'TAX_1',
      'No usable tax line for the tax set',
    );
  }
  return [...byId.values()];
}

/** The full "which taxes apply" pipeline, mirroring
 *  `AccountManagementServiceImpl.getTaxLineSet`: read the product's tax
 *  set → apply the buyer's fiscal position → pick one rate line per
 *  tax. */
export function getSaleTaxLineSet({
  product,
  companyId,
  fiscalPosition,
  today,
}: {
  product: PricingProduct;
  companyId: string | null | undefined;
  fiscalPosition: PricingFiscalPosition | null | undefined;
  today: string;
}): ResolvedTaxLine[] {
  const taxSet = getProductTaxSet(product, companyId);
  const effectiveSet = applyFiscalPosition(taxSet, fiscalPosition);
  return getTaxLineSet(effectiveSet, today);
}

/** Picks the applicable rate line of ONE tax: the explicitly active
 *  line if the tax has one, otherwise the first dated line whose
 *  [startDate, endDate] window contains today.
 *
 *  Three possible outcomes, mirroring the AOS loop body exactly:
 *  - a line — found one;
 *  - `null` — the tax HAS dated lines but none covers today (AOS puts a
 *    literal null into its set; net effect: contributes 0%, no error);
 *  - `undefined` — the tax has no active line and no dated lines at all
 *    (AOS adds nothing; if EVERY tax ends up here, TAX_1 is thrown by
 *    the caller). */
function resolveTaxLine(
  tax: PricingTax,
  today: string,
): ResolvedTaxLine | null | undefined {
  const active = tax.activeTaxLine;
  if (active != null) {
    return {id: active.id, value: toNumberOrNull(active.value)};
  }
  const list = tax.taxLineList;
  if (!list || list.length === 0) return undefined;
  for (const line of list) {
    /* Dates are YYYY-MM-DD strings on both sides, so plain string
     * comparison is also chronological comparison. */
    if (today < line.startDate) continue;
    if (line.endDate != null && today > line.endDate) continue;
    return {id: line.id, value: toNumberOrNull(line.value)};
  }
  return null;
}

/** Total tax percentage: the plain sum of the picked lines' rates
 *  (`TaxService.getTotalTaxRateInPercentage`). E.g. VAT 20 + eco-tax
 *  1.5 → 21.5. */
export function getTotalTaxRateInPercentage(
  lineSet: readonly ResolvedTaxLine[],
): number {
  let total = 0;
  for (const line of lineSet) {
    if (line.value != null) total += line.value;
  }
  return total;
}

/** Derives both bases from one stored price (`taxRate` is a percentage,
 *  e.g. 20 for 20%):
 *  - the stored price is ATI → WT = price / (1 + rate/100);
 *  - the stored price is WT  → ATI = WT + WT · rate/100.
 *  Same algebra as `TaxService.convertUnitPrice`, just producing both
 *  numbers at once instead of one per call. */
export function computeWtAti(
  price: number,
  inAti: boolean,
  taxRate: number,
): {wt: number; ati: number} {
  if (inAti) {
    return {
      ati: price,
      wt: taxRate === 0 ? price : price / (1 + taxRate / 100),
    };
  }
  return {wt: price, ati: price + (price * taxRate) / 100};
}

/** Today's date as `YYYY-MM-DD` in the given IANA timezone (e.g.
 *  "Europe/Paris"), falling back to the server clock when no zone — or
 *  an invalid one — is supplied. AOS likewise resolves "today" in the
 *  company's timezone before checking tax/rate validity windows
 *  (`AppBaseService.getTodayDate(company)`).
 *
 *  The `en-CA` locale is a trick: it's the locale whose native date
 *  format IS `YYYY-MM-DD`, the same shape the dates have in the
 *  database — which is what makes the plain string comparisons in the
 *  window checks valid. */
export function todayInTimezone(timezone: string | null | undefined): string {
  if (!timezone) return new Date().toISOString().slice(0, 10);
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    /* Invalid IANA string on the company row — don't fail rendering;
     * fall back to UTC server time. The misconfiguration only shows
     * around midnight rollovers, same as if the field were unset. */
    return new Date().toISOString().slice(0, 10);
  }
}

/** Half-up rounding to `scale` decimal places: round(119.58804, 2) →
 *  119.59. */
export function round(value: number, scale: number): number {
  const factor = 10 ** scale;
  return Math.round(value * factor) / factor;
}

/** Finds the exchange rate between two currencies for today, the way
 *  AOS does (`CurrencyServiceImpl.getCurrencyConversionRateAtDate`):
 *
 *  - same currency → 1, no lookup;
 *  - otherwise look for a direct from→to line valid today;
 *  - failing that, take the reverse to→from line and use 1/rate.
 *
 *  Lines are matched on `codeISO` — the unique ISO code AOS keys on —
 *  never the printing `code` (those can differ, e.g. "¥" vs "JPY").
 *  Errors: no line in either direction → CURRENCY_1; a line whose rate
 *  is zero or unreadable → CURRENCY_2. */
export function getExchangeRate(
  fromCode: string,
  toCode: string,
  today: string,
  lines: readonly PricingConversionLine[],
): number {
  if (fromCode === toCode) return 1;

  const matchLine = (start: string, end: string) =>
    lines.find(l => {
      if (l.startCurrency.codeISO !== start || l.endCurrency.codeISO !== end)
        return false;
      /* Validity window; dates are YYYY-MM-DD strings, so string
       * comparison is chronological. A missing toDate means the line is
       * open-ended. */
      if (today < l.fromDate) return false;
      if (l.toDate && today > l.toDate) return false;
      return true;
    });

  const direct = matchLine(fromCode, toCode);
  if (direct != null) {
    const rate = Number(direct.exchangeRate);
    if (!Number.isFinite(rate) || rate === 0) {
      throw new PriceComputationError(
        'CURRENCY_2',
        `Unusable exchange rate for ${fromCode} → ${toCode}`,
      );
    }
    return rate;
  }

  const inverse = matchLine(toCode, fromCode);
  if (inverse != null) {
    const rate = Number(inverse.exchangeRate);
    if (!Number.isFinite(rate) || rate === 0) {
      throw new PriceComputationError(
        'CURRENCY_2',
        `Unusable exchange rate for ${toCode} → ${fromCode}`,
      );
    }
    return 1 / rate;
  }

  throw new PriceComputationError(
    'CURRENCY_1',
    `No conversion line between ${fromCode} and ${toCode}`,
  );
}

/** Level 2 — "price THESE VALUES" — mirroring
 *  `ProductPriceServiceImpl.getConvertedPrice`. Use this when the price
 *  belongs to something other than the product: in AOS that's a
 *  sale-order line or a price list; in the portal, a marketplace
 *  listing. Computes the WT/ATI pair from the supplied price and
 *  converts both into the target currency.
 *
 *  `sourceInAti` says which basis `price` is expressed in, and is OUR
 *  parameter, not AOS's — AOS re-reads the flag off the product and
 *  thereby assumes the supplied price uses the product's basis. Our
 *  callers own their basis, so it must be explicit. Returns unrounded
 *  values; the caller rounds at whatever scale its context requires. */
export function getConvertedPrice({
  price,
  sourceInAti,
  taxLineSet,
  fromCurrency,
  toCurrency,
  conversionLines,
  today,
}: {
  price: number;
  sourceInAti: boolean;
  taxLineSet: readonly ResolvedTaxLine[];
  fromCurrency: PricingCurrency | null | undefined;
  toCurrency: PricingCurrency | null | undefined;
  conversionLines: readonly PricingConversionLine[];
  today: string;
}): {wt: number; ati: number; taxRate: number} {
  const taxRate = getTotalTaxRateInPercentage(taxLineSet);
  let {wt, ati} = computeWtAti(price, sourceInAti, taxRate);

  const fromCode = fromCurrency?.codeISO;
  const toCode = toCurrency?.codeISO;
  if (!fromCode || !toCode) {
    throw new PriceComputationError(
      'CURRENCY_1',
      'Missing source or target currency for conversion',
    );
  }
  const rate = getExchangeRate(fromCode, toCode, today, conversionLines);
  wt *= rate;
  ati *= rate;

  return {wt, ati, taxRate};
}

/** Level 1 — "price THIS PRODUCT for this company, in this currency" —
 *  mirroring `ProductPriceServiceImpl.getSaleUnitPrice`: reads the
 *  price fields off the product (honouring per-company overrides),
 *  resolves the applicable taxes, then delegates to level 2.
 *
 *  Strict throughout: any missing configuration throws a
 *  `PriceComputationError`, exactly where AOS would throw. There is no
 *  fallback currency here — degradation policy belongs to the caller. */
export function getSaleUnitPrice({
  product,
  company,
  fiscalPosition,
  toCurrency,
  conversionLines,
  companySpecificProductFields,
}: {
  product: PricingProduct;
  company: {id: string; timezone?: string | null} | null;
  fiscalPosition: PricingFiscalPosition | null | undefined;
  toCurrency: PricingCurrency;
  conversionLines: readonly PricingConversionLine[];
  companySpecificProductFields: readonly string[];
}): {wt: number; ati: number; taxRate: number} {
  const companyId = company?.id;
  const today = todayInTimezone(company?.timezone);

  const salePrice = resolveProductField(
    product,
    'salePrice',
    companyId,
    companySpecificProductFields,
  );
  const inAti = resolveProductField(
    product,
    'inAti',
    companyId,
    companySpecificProductFields,
  );
  const saleCurrency = resolveProductField(
    product,
    'saleCurrency',
    companyId,
    companySpecificProductFields,
  );

  const taxLineSet = getSaleTaxLineSet({
    product,
    companyId,
    fiscalPosition,
    today,
  });

  return getConvertedPrice({
    price: Number(salePrice ?? 0),
    sourceInAti: Boolean(inAti),
    taxLineSet,
    fromCurrency: saleCurrency,
    toCurrency,
    conversionLines,
    today,
  });
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
