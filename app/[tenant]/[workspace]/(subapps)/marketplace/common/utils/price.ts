/* Marketplace price display — the storefront layer on top of the
 * generic pricing core (`@/product/pricing`).
 *
 * The core computes a price exactly the way AOS does and throws a
 * `PriceComputationError` (with the matching AOS error code) whenever
 * the configuration is broken. A storefront page must render anyway, so
 * `computePrice` here wraps the core with marketplace policy:
 *
 * - The LISTING's price fields win. A listing carries its own
 *   `salePrice` / `inAti` / `saleCurrency`, frozen at create; they are
 *   fed into the core's level 2 exactly like an AOS sale-order line
 *   that owns its price. Only the taxes still come from the workspace
 *   default product.
 * - Broken tax configuration degrades to 0% tax instead of failing the
 *   page.
 * - Display currency is picked leniently, first one that works:
 *     1. the buyer's currency (their partner record's currency;
 *        contacts use their parent company's) — if an exchange rate to
 *        it exists;
 *     2. the app-wide default currency (DEFAULT_CURRENCY_CODE) — same
 *        condition;
 *     3. the listing's own currency, shown as-is.
 *   AOS itself converts to a single target and hard-fails without a
 *   rate — the cascade is purely storefront behaviour.
 * - Amounts are rounded to the display currency's decimal count.
 */

import {DEFAULT_CURRENCY_SCALE} from '@/constants';
import {
  computeWtAti,
  getExchangeRate,
  getSaleTaxLineSet,
  getTotalTaxRateInPercentage,
  PriceComputationError,
  round,
  todayInTimezone,
} from '@/product/pricing';
import type {
  ConversionLine,
  Currency,
  PriceableProduct,
  PriceContext,
} from '../orm';

const DEFAULT_TAX_RATE = 0;

export type ComputedPrice = {
  /** The price without tax. */
  wt: number;
  /** The price with all taxes included. */
  ati: number;
  /** Total applied tax percentage (sum of all matched tax lines). */
  taxRate: number;
  /** The currency `wt`/`ati` are expressed in — the buyer's own currency
   *  when a conversion was possible, otherwise the listing's. `codeISO`
   *  is the machine identity (payment providers, the AOS order
   *  endpoint); `code` is the printing code, for display only. */
  currency: {
    code: string;
    codeISO: string;
    symbol: string;
    numberOfDecimals: number;
  };
};

/** Computes what a listing costs, as the storefront should display it:
 *  WT and ATI amounts, the tax percentage, and the display currency.
 *
 *  The listing's own price fields (`priceOverride`) are always the
 *  source; only the taxes come from the workspace default product. To
 *  price a bare product instead (fields resolved off the product, with
 *  per-company overrides), use the core's `getSaleUnitPrice`.
 *
 *  Which currency the result is shown in, first one that works:
 *    1. the buyer's currency — if an exchange rate to it exists;
 *    2. the app default currency — same condition;
 *    3. the listing's own currency, as-is. */
export function computePrice({
  product,
  priceContext,
  company,
  priceOverride,
}: {
  product: PriceableProduct;
  priceContext: PriceContext;
  company: {id: string; timezone: string | null} | null;
  /** The listing's own price fields, used EXACTLY as given — no
   *  fallback into the product's per-company rows or base fields, the
   *  same way an AOS sale-order line owns its price once created (the
   *  values enter the core at level 2). The product only supplies the
   *  tax configuration, since a listing has none of its own. */
  priceOverride: {
    salePrice: NonNullable<PriceableProduct['salePrice']>;
    saleCurrency: NonNullable<PriceableProduct['saleCurrency']>;
    inAti: NonNullable<PriceableProduct['inAti']>;
  };
}): ComputedPrice {
  const {viewerCurrency, defaultCurrency, conversionLines, fiscalPosition} =
    priceContext;
  const {id: companyId, timezone: companyTimezone} = company || {};

  const today = todayInTimezone(companyTimezone);

  const {salePrice: _salePrice, inAti, saleCurrency} = priceOverride;
  const salePrice = Number(_salePrice);

  /* Resolve the tax percentage through the strict core. If the tax
   * configuration is broken (any PriceComputationError), show the price
   * untaxed rather than failing the page — a storefront page must
   * render. */
  let taxRate: number;
  try {
    const lineSet = getSaleTaxLineSet({
      product,
      companyId,
      fiscalPosition,
      today,
    });
    taxRate = getTotalTaxRateInPercentage(lineSet);
  } catch (e) {
    if (!(e instanceof PriceComputationError)) throw e;
    taxRate = DEFAULT_TAX_RATE;
  }

  const {wt, ati} = computeWtAti(salePrice, Boolean(inAti), taxRate);

  /* Pick the display currency: try the buyer's currency, then the app
   * default; keep the listing's own when neither has a usable exchange
   * rate. */
  const lines = conversionLines ?? [];
  const fromCode = saleCurrency?.codeISO;
  let resolvedCurrency = saleCurrency;
  let convertedWt = wt;
  let convertedAti = ati;
  let resolvedScale = saleCurrency?.numberOfDecimals ?? DEFAULT_CURRENCY_SCALE;

  if (fromCode) {
    /* Note: a target that IS the listing's currency stays in the list —
     * it "converts" at rate 1. That way a buyer whose currency matches
     * the listing's sees the price as-is instead of having it converted
     * to the app default. */
    const seen = new Set<string>();
    const targets = [viewerCurrency, defaultCurrency].filter(
      (c): c is Currency => {
        if (!c?.codeISO || seen.has(c.codeISO)) return false;
        seen.add(c.codeISO);
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
      codeISO: resolvedCurrency?.codeISO ?? '',
      symbol: resolvedCurrency?.symbol ?? '',
      numberOfDecimals: resolvedScale,
    },
  };
}

/** One attempt of the display-currency cascade: convert `amount` into
 *  `toCurrency`, or return null when no usable exchange rate exists so
 *  the caller can try the next target. (This is the lenient wrapper
 *  around the strict `getExchangeRate`.) */
function tryConvert(
  amount: number,
  fromCode: string,
  toCurrency: Currency,
  today: string,
  lines: ConversionLine[],
): {value: number; currency: Currency} | null {
  try {
    const rate = getExchangeRate(fromCode, toCurrency.codeISO, today, lines);
    return {value: amount * rate, currency: toCurrency};
  } catch (e) {
    if (!(e instanceof PriceComputationError)) throw e;
    return null;
  }
}

/** Is this listing Paid (true) or Free (false)? Accepts either the raw
 *  `salePrice` (form context) or a computed `price.ati` (display
 *  context). Anything above zero is Paid; everything else — null, 0,
 *  negative, unreadable — is Free. */
export function isPaid(value: number | string | null | undefined): boolean {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0;
}
