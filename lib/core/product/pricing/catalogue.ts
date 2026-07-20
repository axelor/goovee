/* The catalogue unit price — AOS's two-level API
 * (`ProductPriceServiceImpl.getSaleUnitPrice` → `getConvertedPrice`).
 *
 * Level 1 — `getSaleUnitPrice` — "price THIS PRODUCT for this company": read
 *   `salePrice`/`inAti`/`saleCurrency` off the product (honouring per-company
 *   override rows), work out which taxes apply (`getSaleTaxLineSet`), hand
 *   everything to level 2.
 * Level 2 — `getConvertedPrice` — "price THESE VALUES": sum the tax rates,
 *   derive WT and ATI from the stored number, convert both to the target
 *   currency. Exists so things that OWN their price (a sale-order line, a price
 *   list, a marketplace listing) can be priced without pretending the values
 *   came from the product.
 *
 * One deliberate deviation from AOS: `getConvertedPrice` takes `sourceInAti`
 * explicitly rather than re-reading `inAti` off the product
 * (ProductPriceServiceImpl.java:144-147 silently assumes the price uses the
 * product's basis). That holds for every AOS caller, but not for a caller whose
 * record froze the flag (e.g. a marketplace listing) — so the basis is the
 * caller's to state.
 *
 * Unit conversion (COEFF only) mirrors the quick-price ENDPOINT, not the
 * invoice: in AOS the ONLY place a price is coefficient-converted by unit is
 * `ProductRestServiceImpl` (the read-only /ws/aos/product/price quote). A
 * sale-order / invoice line never does — `SaleOrderLinePriceServiceImpl` prices
 * via the unit-less `getSaleUnitPrice`, and picking a product forces the line's
 * unit back to the product's sale unit. So unit conversion here is an
 * endpoint-style convenience for an app that wants per-requested-unit quoting;
 * only the endpoint validates it (see scripts/test-price). The conversion runs
 * AFTER currency conversion.
 *
 * AOS code mirrored: `ProductRestService.fetchProductPrice` →
 * `ProductPriceServiceImpl.getSaleUnitPrice` →
 * `AccountManagementServiceImpl.getTaxLineSet` → `TaxService` →
 * `CurrencyServiceImpl.getAmountCurrencyConvertedAtDate` →
 * `ProductCompanyServiceImpl.get`.
 *
 * Final amounts are NOT rounded here (both levels return raw values; the caller
 * rounds at its scale). Exchange rates ARE rounded as AOS rounds them (they
 * feed the computed value). Arithmetic is float64 — see PRICING.md. */

import type {ResolvedTaxLine} from './types';
import type {
  ConversionLine,
  Currency,
  FiscalPositionInput,
  PriceableProduct,
  UnitConversionRow,
} from '../orm';
import {PriceComputationError} from './errors';
import {resolveProductField, round, todayInTimezone} from './util';
import {
  computeWtAti,
  getSaleTaxLineSet,
  getTotalTaxRateInPercentage,
} from './tax';
import {getExchangeRate, getUnitCoefficient} from './conversion';

/** Level 2 — "price THESE VALUES" — mirroring
 *  `ProductPriceServiceImpl.getConvertedPrice`. Use this when the price belongs
 *  to something other than the product: in AOS that's a sale-order line or a
 *  price list; in the portal, a marketplace listing. Computes the WT/ATI pair
 *  from the supplied price and converts both into the target currency.
 *
 *  `sourceInAti` says which basis `price` is expressed in, and is OUR parameter,
 *  not AOS's — AOS re-reads the flag off the product and thereby assumes the
 *  supplied price uses the product's basis. Our callers own their basis, so it
 *  must be explicit.
 *
 *  Optionally prices in a unit other than `price`'s own. When `unit` is
 *  supplied, the per-unit WT/ATI are converted from `saleUnitId` to
 *  `requestedUnitId` AFTER currency conversion (the AOS order), then the line
 *  totals are computed as unit price × `qty`. Omit `unit` (and `qty` defaults to
 *  1) to price one item in the price's own unit.
 *
 *  Returns unrounded values; `wt`/`ati` are the per-(requested-)unit price and
 *  `wtTotal`/`atiTotal` are those times `qty`. The caller rounds at whatever
 *  scale its context requires. */
export function getConvertedPrice({
  price,
  sourceInAti,
  taxLineSet,
  fromCurrency,
  toCurrency,
  conversionLines,
  today,
  unit,
  unitConversions,
  qty = 1,
}: {
  price: number;
  sourceInAti: boolean;
  taxLineSet: readonly ResolvedTaxLine[];
  fromCurrency: Currency | null | undefined;
  toCurrency: Currency | null | undefined;
  conversionLines: readonly ConversionLine[];
  today: string;
  /** Quote the price in `requestedUnitId` instead of `saleUnitId` (the unit
   *  `price` is expressed in). Omit to keep the price's own unit. */
  unit?: {requestedUnitId: string; saleUnitId: string} | null;
  unitConversions?: readonly UnitConversionRow[];
  /** Quantity in the requested (or sale) unit; defaults to 1. */
  qty?: number;
}): {
  wt: number;
  ati: number;
  taxRate: number;
  qty: number;
  wtTotal: number;
  atiTotal: number;
} {
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

  /* Round the converted amount to the TARGET currency's own decimals, the way
   * AOS does inside the conversion itself
   * (`CurrencyServiceImpl.getAmountCurrencyConvertedUsingExchangeRate`:
   * `amount.multiply(rate).setScale(endCurrency.numberOfDecimals)`), and only
   * when a real conversion happened (rate != 1, mirroring AOS's `!= ONE`
   * guard). Skipping this diverges for any currency whose decimals differ from
   * the unit-price scale — e.g. JPY (0 decimals): 8960.25 vs 8960. The caller
   * still applies the final unit-price rounding on top. */
  if (rate !== 1 && toCurrency?.numberOfDecimals != null) {
    wt = round(wt, toCurrency.numberOfDecimals);
    ati = round(ati, toCurrency.numberOfDecimals);
  }

  /* Unit conversion, after currency, mirroring AOS `ProductRestServiceImpl`:
   * the per-unit price in the sale unit is multiplied by the coefficient that
   * maps the requested unit to the sale unit. */
  if (unit && unit.requestedUnitId !== unit.saleUnitId) {
    const coef = getUnitCoefficient(
      unit.requestedUnitId,
      unit.saleUnitId,
      unitConversions ?? [],
    );
    wt *= coef;
    ati *= coef;
  }

  return {wt, ati, taxRate, qty, wtTotal: wt * qty, atiTotal: ati * qty};
}

/** Level 1 — "price THIS PRODUCT for this company, in this currency" —
 *  mirroring `ProductPriceServiceImpl.getSaleUnitPrice`: reads the price fields
 *  off the product (honouring per-company overrides), resolves the applicable
 *  taxes, then delegates to level 2.
 *
 *  Strict throughout: any missing configuration throws a
 *  `PriceComputationError`, exactly where AOS would throw. There is no fallback
 *  currency here — degradation policy belongs to the caller.
 *
 *  Pass `requestedUnit` to quote the price in a unit other than the product's
 *  sale unit (`salesUnit ?? unit`), and `qty` for the line total — see
 *  `getConvertedPrice`.
 *
 *  Echoes back the resolved `unitId` — the requested unit when one was given,
 *  otherwise the product's own sale unit (`salesUnit ?? unit`), which this
 *  function picks internally so the caller would not otherwise know it. Only the
 *  id: the core never sees a unit's display name. It is `null` only when no unit
 *  was requested AND the product carries no unit — requesting a unit with no
 *  source unit to convert from throws `UNIT_CONVERSION_NO_SOURCE_UNIT`. */
export function getSaleUnitPrice({
  product,
  company,
  fiscalPosition,
  toCurrency,
  conversionLines,
  companySpecificProductFields,
  requestedUnit,
  unitConversions,
  qty = 1,
}: {
  product: PriceableProduct;
  company: {id: string; timezone?: string | null} | null;
  fiscalPosition: FiscalPositionInput | null | undefined;
  toCurrency: Currency;
  conversionLines: readonly ConversionLine[];
  companySpecificProductFields: readonly string[];
  /** Quote in this unit instead of the product's `salesUnit ?? unit`. */
  requestedUnit?: {id: string} | null;
  unitConversions?: readonly UnitConversionRow[];
  qty?: number;
}): {
  wt: number;
  ati: number;
  taxRate: number;
  qty: number;
  wtTotal: number;
  atiTotal: number;
  unitId: string | null;
} {
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

  /* The sale price is expressed in the product's sale unit. When a caller asks
   * for a different unit we must have a source unit to convert from; AOS
   * likewise throws on a null source unit rather than silently leaving the
   * price unconverted. */
  const saleUnitId = product.salesUnit?.id ?? product.unit?.id;
  let unit: {requestedUnitId: string; saleUnitId: string} | null = null;
  if (requestedUnit?.id) {
    if (!saleUnitId) {
      throw new PriceComputationError(
        'UNIT_CONVERSION_NO_SOURCE_UNIT',
        'A unit was requested but the product has no sale unit to convert from',
      );
    }
    unit = {requestedUnitId: requestedUnit.id, saleUnitId};
  }

  return {
    ...getConvertedPrice({
      price: Number(salePrice ?? 0),
      sourceInAti: Boolean(inAti),
      taxLineSet,
      fromCurrency: saleCurrency,
      toCurrency,
      conversionLines,
      today,
      unit,
      unitConversions,
      qty,
    }),
    /* The unit the returned price is expressed in: the requested one, or the
     * product's own sale unit that we resolved above. */
    unitId: requestedUnit?.id ?? saleUnitId ?? null,
  };
}
