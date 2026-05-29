/* Marketplace price compute — single source of truth for every price-
 * related calculation in the marketplace subapp. All WT/ATI math and the
 * Paid/Free predicate so that display values stay in lockstep with what
 * AOS will invoice.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Our algorithm
 * ──────────────────────────────────────────────────────────────────────
 *   1. Resolve the price-defining fields (`salePrice`, `inAti`,
 *      `saleCurrency`). If `priceOverride` is provided, use it as-is —
 *      the override layer is sealed and never falls through. Otherwise
 *      walk `Product.productCompanyList` for a row matching the selling
 *      company; fall back to the base product fields if none.
 *   2. Resolve the AccountManagement row by walking
 *      Product.accountManagementList → ProductFamily.accountManagementList,
 *      filtered by the selling company's id. Skip a Product-level row
 *      whose `saleTaxSet` is empty (treated as accounting-only override).
 *   3. If a buyer fiscal position is provided, remap each tax through
 *      `taxEquivList`: when the tax appears in any equiv's `fromTaxSet`,
 *      replace it with the equiv's `toTaxSet` (one tax can map to many).
 *   4. For each (possibly remapped) tax, pick a rate: prefer
 *      `activeTaxLine.value`; otherwise pick the entry from `taxLineList`
 *      whose [startDate, endDate] window contains today (computed in the
 *      company's IANA timezone). Sum the picked rates → totalTaxRate.
 *   5. If `inAti`, invert: WT = salePrice / (1 + rate/100), ATI =
 *      salePrice. Otherwise forward: WT = salePrice, ATI = WT + WT·rate/100.
 *   6. Try to convert WT and ATI in this order (first hit wins):
 *      viewerCurrency → defaultCurrency → productCurrency. Conversion
 *      uses CurrencyConversionLine (direct rate, then inverse fallback).
 *      If no target has a usable line, the price stays in productCurrency.
 *   7. Round both to the resolved currency's `numberOfDecimals`
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
 * AOS Java path mirrored
 * ──────────────────────────────────────────────────────────────────────
 *   axelor-sale/.../ProductRestService.fetchProductPrice
 *     → axelor-base/.../ProductPriceServiceImpl.getSaleUnitPrice
 *     → axelor-base/.../AccountManagementServiceImpl.getTaxLineSet
 *     → axelor-base/.../FiscalPositionService.getTaxSet
 *     → axelor-base/.../TaxService.convertUnitPrice + getTotalTaxRate
 *     → axelor-base/.../CurrencyServiceImpl.getAmountCurrencyConvertedAtDate
 *     → axelor-base/.../ProductCompanyService.get
 *
 * ──────────────────────────────────────────────────────────────────────
 * Remaining differences vs AOS
 * ──────────────────────────────────────────────────────────────────────
 *   - No PriceList / PriceListLine adjustment. AOS applies the buyer's
 *     `salePartnerPriceList` to override unit prices (discount, markup,
 *     replacement). Marketplace surfaces the catalog price; partners
 *     with a sale price list will diverge silently. Either mirror this
 *     or guard at validateCart against `buyer.salePartnerPriceList`.
 *   - No unit conversion. AOS's `/aos/product/price` accepts `unitId`
 *     and converts via `Unit.conversion`. Marketplace always sells at
 *     qty=1 in the product's natural unit, so this never fires.
 *   - Rounding scale is the resolved currency's `numberOfDecimals` (typically
 *     2) rather than `appConfig.nbDecimalDigitForUnitPrice` (often 4).
 *     With qty=1 the totals converge at the cent; multi-line inversions
 *     could theoretically drift by sub-cent.
 *   - Intermediate arithmetic is float64 rather than BigDecimal. For
 *     positive prices and tax rates `Math.round` matches HALF_UP, so
 *     the rounded result matches AOS at currency precision; cent-level
 *     drift is only theoretically possible at extreme magnitudes.
 */

import {DEFAULT_CURRENCY_SCALE} from '@/constants';
import type {
  TaxRow,
  AccountManagementRow,
  ConversionLine,
  FiscalPositionInput,
  PriceableProduct,
  PriceContext,
  Currency,
} from '../orm';
const DEFAULT_TAX_RATE = 0;

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
  product: PriceableProduct,
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

/** Mirrors AOS's `FiscalPositionService.getTaxSet`: if any equivalence row
 *  lists this tax in its `fromTaxSet`, swap it for the equivalence's
 *  `toTaxSet` (one tax can map to many). Returns `[tax]` when no fiscal
 *  position is provided or no row matches. */
function remapTax(
  tax: TaxRow,
  fiscalPosition: FiscalPositionInput | null | undefined,
): TaxRow[] {
  const equivs = fiscalPosition?.taxEquivList;
  if (!equivs || equivs.length === 0 || tax.id == null) return [tax];
  for (const equiv of equivs) {
    if (!equiv?.fromTaxSet || !equiv.toTaxSet) continue;
    if (equiv.fromTaxSet.some(t => t?.id != null && t.id === tax.id)) {
      return equiv.toTaxSet;
    }
  }
  return [tax];
}

function getTotalTaxRate(
  saleTaxSet: TaxRow[] | null | undefined,
  today: string,
  fiscalPosition: FiscalPositionInput | null | undefined,
): number {
  if (!saleTaxSet || saleTaxSet.length === 0) return DEFAULT_TAX_RATE;
  let total = 0;
  for (const tax of saleTaxSet) {
    for (const effective of remapTax(tax, fiscalPosition)) {
      const rate = resolveTaxLineValue(effective, today);
      if (rate != null) total += rate;
    }
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

export function round(value: number, scale: number): number {
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
  toCurrency: Currency,
  today: string,
  lines: ConversionLine[],
): {value: number; currency: Currency} | null {
  const rate = getExchangeRate(fromCode, toCurrency.code, today, lines);
  if (rate == null) return null;
  return {value: amount * rate, currency: toCurrency};
}

/** Compute the without-tax price, all-tax-included price, total applied
 *  tax rate, and display currency for a product.
 *
 *  Layering of price-defining fields (top wins):
 *    1. `priceOverride`        — marketplace listing layer, optional
 *    2. `productCompanyList`   — per-company override on the Product
 *    3. base Product fields
 *
 *  Currency display resolution (in order, first hit wins):
 *    1. viewerCurrency — if a productCurrency→viewer conversion line exists
 *    2. defaultCurrency — if a productCurrency→default conversion line exists
 *    3. productCurrency — last-resort, displayed as-is */
export function computePrice({
  product,
  priceContext,
  company,
  priceOverride,
}: {
  product: PriceableProduct;
  priceContext: PriceContext;
  company: {id: string; timezone: string | null} | null;
  /** Override layer — fully sealed when provided. All three fields
   *  must be present; none fall back through `productCompanyList` or
   *  the base product. The fallback path runs only when there's no
   *  `priceOverride`. Tax / accountManagement always come from the
   *  product itself; this layer overrides only price, inAti, and
   *  currency. */
  priceOverride?: {
    salePrice: NonNullable<PriceableProduct['salePrice']>;
    saleCurrency: NonNullable<PriceableProduct['saleCurrency']>;
    inAti: NonNullable<PriceableProduct['inAti']>;
  };
}): ComputedPrice {
  const {viewerCurrency, defaultCurrency, conversionLines, fiscalPosition} =
    priceContext;
  const {id: companyId, timezone: companyTimezone} = company || {};

  const today = todayInTimezone(companyTimezone);
  const companyOverride =
    companyId == null
      ? null
      : (product.productCompanyList?.find(
          row => row?.company?.id === companyId,
        ) ?? null);

  const base = priceOverride ?? {
    salePrice: companyOverride?.salePrice ?? product.salePrice,
    inAti: companyOverride?.inAti ?? product.inAti,
    saleCurrency: companyOverride?.saleCurrency ?? product.saleCurrency,
  };

  const {salePrice: _salePrice, inAti, saleCurrency} = base;
  const salePrice = Number(_salePrice ?? 0);

  const accountManagement = resolveAccountManagement(product, companyId);
  const taxRate = accountManagement
    ? getTotalTaxRate(accountManagement.saleTaxSet, today, fiscalPosition)
    : DEFAULT_TAX_RATE;

  let wt: number;
  let ati: number;
  if (inAti) {
    ati = salePrice;
    wt = taxRate === 0 ? salePrice : salePrice / (1 + taxRate / 100);
  } else {
    wt = salePrice;
    ati = wt + (wt * taxRate) / 100;
  }

  const lines = conversionLines ?? [];
  const fromCode = saleCurrency?.code;
  let resolvedCurrency = saleCurrency;
  let convertedWt = wt;
  let convertedAti = ati;
  let resolvedScale = saleCurrency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE;

  if (fromCode) {
    const seen = new Set<string>();
    const targets = [viewerCurrency, defaultCurrency].filter(
      (c): c is Currency => {
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
        resolvedScale = target.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE;
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
