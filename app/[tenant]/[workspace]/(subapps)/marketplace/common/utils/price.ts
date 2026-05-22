/* Marketplace price compute — single source of truth for every price-
 * related calculation in the marketplace subapp. All WT/ATI math, the
 * Paid/Free predicate so that display values stay in lockstep with what
 * AOS will invoice.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Our algorithm
 * ──────────────────────────────────────────────────────────────────────
 *   1. Read `salePrice` and `inAti` off the product.
 *   2. Resolve the AccountManagement row by walking
 *      Product.accountManagementList → ProductFamily.accountManagementList,
 *      filtered by the selling company's id. Skip a Product-level row
 *      whose `saleTaxSet` is empty (treated as accounting-only override).
 *   3. For each tax in `saleTaxSet`, pick a rate: prefer
 *      `activeTaxLine.value`; otherwise pick the entry from `taxLineList`
 *      whose [startDate, endDate] window contains today (computed in the
 *      company's IANA timezone). Sum the picked rates → totalTaxRate.
 *   4. If `inAti`, invert: WT = salePrice / (1 + rate/100), ATI =
 *      salePrice. Otherwise forward: WT = salePrice, ATI = WT + WT·rate/100.
 *   5. Try to convert WT and ATI in this order (first hit wins):
 *      viewerCurrency → defaultCurrency → productCurrency. Conversion
 *      uses CurrencyConversionLine (direct rate, then inverse fallback).
 *      If no target has a usable line, the price stays in productCurrency.
 *   6. Round both to the resolved currency's `numberOfDecimals`
 *      (defaults to DEFAULT_CURRENCY_SCALE).
 *
 * ──────────────────────────────────────────────────────────────────────
 * Currency resolution
 * ──────────────────────────────────────────────────────────────────────
 *   - productCurrency — the product's own `saleCurrency`, stamped at
 *     creation from the publisher's partner currency (falling back to
 *     DEFAULT_CURRENCY_CODE) and never overwritten on later edits. This
 *     is the source currency and the last-resort display fallback.
 *   - viewerCurrency — `AOSPartner.currency` on `auth.user.mainPartnerId`
 *     (contacts share the parent partner's currency). First conversion
 *     target when present.
 *   - defaultCurrency — the app-wide `DEFAULT_CURRENCY_CODE` looked up
 *     in `AOSCurrency`. Second conversion target — used when the viewer
 *     conversion has no matching line, or when there is no viewer.
 *
 *   Conversion uses `appBase.currencyConversionLineList`, mirroring
 *   AOS's `CurrencyServiceImpl.getCurrencyConversionRateAtDate`: try a
 *   direct fromCode→toCode line first; if none, try the inverse and
 *   invert the rate. Date-range filtering is applied to both.
 *
 * ──────────────────────────────────────────────────────────────────────
 * How AOS does it at the time of this implementation
 * ──────────────────────────────────────────────────────────────────────
 * Java path:
 *   axelor-sale/.../ProductRestService.fetchProductPrice
 *     → axelor-base/.../ProductPriceServiceImpl.getSaleUnitPrice
 *     → axelor-base/.../AccountManagementServiceImpl.getTaxLineSet
 *     → axelor-base/.../TaxService.convertUnitPrice + getTotalTaxRate
 *
 * AOS additionally:
 *   - Applies the buyer partner's FiscalPosition to remap taxes before
 *     summing (`FiscalPositionService.getTaxSet`).
 *   - Converts the price via `CurrencyService` when the product currency
 *     differs from the selling company's currency.
 *   - Applies PriceList / PriceListLine adjustments for the buyer.
 *   - Honours `productCompanyList` per-company overrides of `salePrice`
 *     and related fields.
 *   - Runs all arithmetic in BigDecimal with COMPUTATION_SCALING (20
 *     digits) and HALF_UP rounding, then truncates to the app config's
 *     `nbDecimalDigitForUnitPrice`.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Differences and rationale
 * ──────────────────────────────────────────────────────────────────────
 *   - No fiscal position. Marketplace sells one regime per workspace;
 *     there is no per-buyer tax remapping to perform.
 *   - Currency conversion has a three-step fallback (viewer → default
 *     → product). AOS's full CurrencyService path (company currency,
 *     fiscal position overrides, PriceList currency) is not replicated
 *     — unnecessary given the single-company, single-catalog marketplace
 *     model.
 *   - No price-list / per-partner discount. Marketplace surfaces a
 *     uniform catalog price; per-buyer pricing isn't a marketplace
 *     feature.
 *   - No `productCompanyList` override. Marketplace products aren't
 *     multi-company configured, so the base `salePrice` is the truth.
 *   - Final rounding scale is the resolved currency's `numberOfDecimals`
 *     rather than `nbDecimalDigitForUnitPrice`; the two are typically
 *     equal, and the currency value is the one already on the displayed
 *     row.
 *   - Intermediate arithmetic is float64 rather than BigDecimal. For
 *     positive prices and tax rates `Math.round` matches HALF_UP, so
 *     the rounded result matches AOS at currency precision; cent-level
 *     drift is only theoretically possible at extreme magnitudes.
 */

import {DEFAULT_CURRENCY_SCALE} from '@/constants';

const DEFAULT_TAX_RATE = 0;

/** A row from `accountManagementList` — minimum fields needed for tax
 *  resolution. Lives at the leaf so it can be referenced both on the
 *  product and on the product family without redeclaring. */
type TaxLineRow = {
  value?: unknown;
  /** ISO date strings — only used when the parent tax has no `activeTaxLine`
   *  and we need to pick by today's date. */
  startDate?: string | null;
  endDate?: string | null;
};

type TaxRow = {
  activeTaxLine?: TaxLineRow | null;
  taxLineList?: TaxLineRow[] | null;
};

type AccountManagementRow = {
  company?: {id?: string | null} | null;
  saleTaxSet?: TaxRow[] | null;
};

/** Shape of the fields a product needs to expose for price compute.
 *  Permissive on the leaf types because callers may pass raw ORM
 *  payloads (BigDecimal) or cloned ones (string / number). */
export type PriceComputeInput = {
  salePrice?: unknown;
  inAti?: boolean | null;
  /** Product-level account-management overrides. AOS consults these
   *  before falling back to the product family's list. */
  accountManagementList?: AccountManagementRow[] | null;
  productFamily?: {
    accountManagementList?: AccountManagementRow[] | null;
  } | null;
};

export type ComputedPrice = {
  /** Without tax. */
  wt: number;
  /** All taxes included. */
  ati: number;
  /** Total applied tax rate as a percentage. Sum across all matched tax lines. */
  taxRate: number;
  /** Currency in which wt/ati are expressed: viewer's partner currency
   *  if conversion succeeded, otherwise the product's own currency. */
  currency: {code: string; symbol: string; numberOfDecimals: number};
};

/** Minimal currency shape needed for conversion. */
export type CurrencyInput = {
  code: string;
  symbol: string;
  numberOfDecimals?: number | null;
};

/** One row from `appBase.currencyConversionLineList`. */
export type ConversionLine = {
  startCurrency?: {code?: string | null} | null;
  endCurrency?: {code?: string | null} | null;
  exchangeRate?: unknown;
  fromDate?: string | null;
  toDate?: string | null;
};

export type ComputeOptions = {
  /** Selling company id (`workspace.config.company.id`). Required when
   *  the product carries multi-company AccountManagement rows; without
   *  it we fall back to whatever first row is in the list. */
  companyId?: string | null;
  /** IANA timezone of the selling company (`workspace.config.company.timezone`).
   *  Used to compute "today" for the date-window tax-line fallback so the
   *  display rate matches what AOS will charge — see the doc comment on
   *  `todayInTimezone`. Falls back to server clock when null/invalid. */
  companyTimezone?: string | null;
  /** Decimal places for the rounded result. Defaults to 2; pass the
   *  currency's `numberOfDecimals` for currency-aware rounding. */
  scale?: number;
  /** Currency of the product's `salePrice` field. Used as the conversion
   *  source and as the final fallback when no conversion is possible. */
  productCurrency?: CurrencyInput | null;
  /** Viewer's preferred currency from their partner record. First
   *  conversion target. */
  viewerCurrency?: CurrencyInput | null;
  /** App-wide fallback currency (`DEFAULT_CURRENCY_CODE`). Second
   *  conversion target — tried when the viewer currency conversion has
   *  no matching line, or when there is no viewer currency. */
  defaultCurrency?: CurrencyInput | null;
  /** Active CurrencyConversionLine rows from `appBase`, ideally filtered
   *  to the (productCurrency ↔ viewerCurrency) pair. Used to look
   *  up exchange rates, mirroring AOS's CurrencyService logic. */
  conversionLines?: ConversionLine[] | null;
};

/** AOS-style resolution: try the product's own `accountManagementList`
 *  first, fall back to the product family's. Matches the Java path in
 *  `AccountManagementServiceImpl.getProductTax` (CONFIG_OBJECT_PRODUCT
 *  → CONFIG_OBJECT_PRODUCT_FAMILY) — both lists are filtered by the
 *  selling company; no company → no row.
 *
 *  AOS falls through to family not just when the Product-level AM is
 *  absent, but also when it's present-but-has-empty-`saleTaxSet`. That
 *  accommodates admins who add a Product-level AM purely for accounting
 *  overrides (sale account, journal) and rely on the family for the tax
 *  set. */
function resolveAccountManagement(
  product: PriceComputeInput,
  companyId: string | null | undefined,
): AccountManagementRow | null {
  if (companyId == null) return null;
  const pickForCompany = (list: AccountManagementRow[] | null | undefined) =>
    list?.find(am => am?.company?.id === companyId) ?? null;

  const productLevel = pickForCompany(product.accountManagementList);
  if (productLevel?.saleTaxSet && productLevel.saleTaxSet.length > 0) {
    return productLevel;
  }
  return pickForCompany(product.productFamily?.accountManagementList);
}

/** Picks the tax-line value for a single tax, mirroring AOS's
 *  `TaxService.getTaxLineSet` per-tax resolution: prefer `activeTaxLine`,
 *  fall back to a `taxLineList` entry covering `today`. Returns `null`
 *  if neither produced a usable value. */
function resolveTaxLineValue(tax: TaxRow, today: string): number | null {
  const active = tax.activeTaxLine?.value;
  if (active != null) {
    const rate = Number(active);
    return Number.isFinite(rate) ? rate : null;
  }
  const list = tax.taxLineList;
  if (!list || list.length === 0) return null;
  for (const line of list) {
    if (line?.value == null) continue;
    // ISO date string compare works because both sides are YYYY-MM-DD.
    const start = line.startDate ?? null;
    const end = line.endDate ?? null;
    if (start != null && today < start) continue;
    if (end != null && today > end) continue;
    const rate = Number(line.value);
    return Number.isFinite(rate) ? rate : null;
  }
  return null;
}

function getTotalTaxRate(
  saleTaxSet: TaxRow[] | null | undefined,
  today: string,
): number {
  if (!saleTaxSet || saleTaxSet.length === 0) return DEFAULT_TAX_RATE;
  let total = 0;
  for (const tax of saleTaxSet) {
    const rate = resolveTaxLineValue(tax, today);
    if (rate != null) total += rate;
  }
  return total;
}

/** Returns today's date as `YYYY-MM-DD` in the given IANA timezone, falling
 *  back to the server clock when no zone (or an invalid zone) is supplied.
 *  Mirrors AOS's `AppBaseService.getTodayDate(company)` which always reads
 *  `company.timezone` before resolving "today" for tax / pricing purposes.
 *
 *  `en-CA` is a deliberate pick: it's the locale that natively formats
 *  dates as `YYYY-MM-DD`, exactly matching the shape AOS stores in
 *  `AOSTaxLine.startDate` / `endDate`, so the date-window check can be a
 *  plain lexicographic string compare with no parsing. */
function todayInTimezone(timezone: string | null | undefined): string {
  if (!timezone) return new Date().toISOString().slice(0, 10);
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    // Invalid IANA string on the company row — don't fail rendering; fall
    // back to UTC server time. Misconfiguration will be visible at the
    // edges of midnight rollovers, same as if the field were unset.
    return new Date().toISOString().slice(0, 10);
  }
}

function round(value: number, scale: number): number {
  const factor = 10 ** scale;
  return Math.round(value * factor) / factor;
}

/** Mirrors AOS's CurrencyServiceImpl.getCurrencyConversionRateAtDate:
 *  look for a direct fromCode→toCode line; if none, try the inverse and
 *  invert the rate. Returns null if no line matches (caller falls back). */
function getExchangeRate(
  fromCode: string,
  toCode: string,
  today: string,
  lines: ConversionLine[],
): number | null {
  if (fromCode === toCode) return 1;

  const matchLine = (start: string, end: string) =>
    lines.find(l => {
      if (l.startCurrency?.code !== start || l.endCurrency?.code !== end)
        return false;
      // fromDate/toDate are PG `date` columns (YYYY-MM-DD); lex compare = chronological.
      if (l.fromDate && today < l.fromDate) return false;
      if (l.toDate && today > l.toDate) return false;
      return true;
    });

  const direct = matchLine(fromCode, toCode);
  if (direct != null) {
    const rate = Number(direct.exchangeRate);
    return Number.isFinite(rate) && rate !== 0 ? rate : null;
  }

  const inverse = matchLine(toCode, fromCode);
  if (inverse != null) {
    const rate = Number(inverse.exchangeRate);
    return Number.isFinite(rate) && rate !== 0 ? 1 / rate : null;
  }

  return null;
}

/** Attempt to convert `amount` from `fromCode` to `toCurrency` using the
 *  provided conversion lines. Returns null if no usable rate is found. */
function tryConvert(
  amount: number,
  fromCode: string,
  toCurrency: CurrencyInput,
  today: string,
  lines: ConversionLine[],
): {value: number; currency: CurrencyInput} | null {
  const rate = getExchangeRate(fromCode, toCurrency.code, today, lines);
  if (rate == null) return null;
  return {value: amount * rate, currency: toCurrency};
}

/** Compute the without-tax price, all-tax-included price, total applied
 *  tax rate, and display currency for a product.
 *
 *  Currency resolution (in order, first hit wins):
 *    1. viewerCurrency — if a productCurrency→viewer conversion line exists
 *    2. defaultCurrency — if a productCurrency→default conversion line exists
 *    3. productCurrency — last-resort, displayed as-is */
export function computePrice(
  product: PriceComputeInput,
  options: ComputeOptions = {},
): ComputedPrice {
  const {
    companyId,
    companyTimezone,
    scale = DEFAULT_CURRENCY_SCALE,
    productCurrency,
    viewerCurrency,
    defaultCurrency,
    conversionLines,
  } = options;

  const today = todayInTimezone(companyTimezone);
  const salePrice = Number(product.salePrice ?? 0);
  const accountManagement = resolveAccountManagement(product, companyId);
  const taxRate = accountManagement
    ? getTotalTaxRate(accountManagement.saleTaxSet, today)
    : DEFAULT_TAX_RATE;

  let wt: number;
  let ati: number;
  if (product.inAti) {
    ati = salePrice;
    wt = taxRate === 0 ? salePrice : salePrice / (1 + taxRate / 100);
  } else {
    wt = salePrice;
    ati = wt + (wt * taxRate) / 100;
  }

  const lines = conversionLines ?? [];
  const fromCode = productCurrency?.code;
  let resolvedCurrency: CurrencyInput | null = productCurrency ?? null;
  let convertedWt = wt;
  let convertedAti = ati;
  let resolvedScale = productCurrency?.numberOfDecimals ?? scale;

  if (fromCode) {
    const seen = new Set<string>();
    const targets = [viewerCurrency, defaultCurrency].filter(
      (c): c is CurrencyInput => {
        if (!c?.code || c.code === fromCode || seen.has(c.code)) return false;
        seen.add(c.code);
        return true;
      },
    );
    for (const target of targets) {
      const wtResult = tryConvert(wt, fromCode, target, today, lines);
      const atiResult = tryConvert(ati, fromCode, target, today, lines);
      if (wtResult && atiResult) {
        convertedWt = wtResult.value;
        convertedAti = atiResult.value;
        resolvedCurrency = target;
        resolvedScale = target.numberOfDecimals ?? scale;
        break;
      }
    }
  }

  return {
    wt: round(convertedWt, resolvedScale),
    ati: round(convertedAti, resolvedScale),
    taxRate,
    currency: {
      code: resolvedCurrency?.code ?? '',
      symbol: resolvedCurrency?.symbol ?? '',
      numberOfDecimals: resolvedScale,
    },
  };
}

/** Paid/Free predicate — accepts either a raw `salePrice` (form context)
 *  or a computed `price.ati` (display context). Anything > 0 is Paid;
 *  everything else — null, 0, negative, non-numeric — is Free. */
export function isPaid(value: number | string | null | undefined): boolean {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0;
}
