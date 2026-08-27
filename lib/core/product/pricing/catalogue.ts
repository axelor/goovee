/* The catalogue unit price — AOS's two-level API
 * (`ProductPriceServiceImpl.getSaleUnitPrice` → `getConvertedPrice`).
 *
 * Level 1 — `getSaleUnitPrice` — "price THIS PRODUCT for this company": read
 *   `salePrice`/`inAti`/`saleCurrency` off the product (honouring per-company
 *   override rows), work out which taxes apply (`getSaleTaxLineSet`), hand
 *   everything to level 2.
 * Level 2 — `getConvertedPrice` — "price THESE VALUES": sum the tax rates, express
 *   the stored number in the basis the caller asked for, and convert it to the
 *   target currency. Exists so things that OWN their price (a sale-order line, a
 *   price list, a record that stores its own) can be priced without pretending the
 *   values came from the product.
 *
 * One deliberate deviation from AOS: `getConvertedPrice` takes `sourceInAti`
 * explicitly rather than re-reading `inAti` off the product
 * (ProductPriceServiceImpl.java:144-147 silently assumes the price uses the
 * product's basis). That holds for every AOS caller, but not for a caller whose
 * record froze the flag when the price was created — so the basis is the caller's
 * to state.
 *
 * Unit conversion (COEFF only) mirrors the quick-price ENDPOINT, not the
 * invoice: in AOS the ONLY place a price is coefficient-converted by unit is
 * `ProductRestServiceImpl` (the read-only /ws/aos/product/price quote). A
 * sale-order / invoice line never does — `SaleOrderLinePriceServiceImpl` prices
 * via the unit-less `getSaleUnitPrice`, and picking a product forces the line's
 * unit back to the product's sale unit. So unit conversion here is an
 * endpoint-style convenience for an app that wants per-requested-unit quoting,
 * with no invoiced number to check it against — only the endpoint's. The
 * conversion runs AFTER currency conversion.
 *
 * AOS code mirrored: `ProductRestService.fetchProductPrice` →
 * `ProductPriceServiceImpl.getSaleUnitPrice` →
 * `AccountManagementServiceImpl.getTaxLineSet` → `TaxService` →
 * `CurrencyServiceImpl.getAmountCurrencyConvertedAtDate` →
 * `ProductCompanyServiceImpl.get`.
 *
 * Three things are rounded here, each because AOS rounds it: the exchange rate
 * (6 dp, or 8-then-6 inverted); the converted amount at the target currency's
 * decimals, only when a real conversion happened; and the returned amount at
 * `nbDecimalForUnitPrice`. The basis conversion in between is deliberately left
 * wide. A caller rounding the returned amount again rounds twice. */

import type {BigDecimal} from '@goovee/orm';

import type {ResolvedTaxLine} from './types';
import {DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE} from './types';
import type {
  ConversionLine,
  Currency,
  FiscalPositionInput,
  PriceableProduct,
  UnitConversionRow,
} from '../orm';
import {PriceComputationError} from './errors';
import {
  INTERMEDIATE_SCALE,
  ONE,
  resolveProductField,
  scaled,
  todayInTimezone,
  toDecimalOrNull,
  ZERO,
} from './util';
import {
  convertUnitPrice,
  getSaleTaxLineSet,
  getTotalTaxRateInPercentage,
} from './tax';
import {getExchangeRate, getUnitCoefficient} from './conversion';

/** Level 2 — "price THESE VALUES" — mirroring
 *  `ProductPriceServiceImpl.getConvertedPrice`. Use this when the price belongs
 *  to something other than the product: in AOS that's a sale-order line or a
 *  price list, and here any record that stores a price of its own.
 *
 *  Returns ONE amount, in the `resultInAti` basis, rounded to
 *  `nbDecimalForUnitPrice` — the same single number AOS returns. When the source
 *  and result bases differ the conversion runs at the intermediate scale first,
 *  as AOS does, so only the final rounding is visible.
 *
 *  `sourceInAti` says which basis `price` is expressed in, and is OUR parameter,
 *  not AOS's — AOS re-reads the flag off the product and thereby assumes the
 *  supplied price uses the product's basis. Our callers own their basis, so it
 *  must be explicit.
 *
 *  Optionally prices in a unit other than `price`'s own: when `unit` is supplied
 *  the amount is converted from `saleUnitId` to `requestedUnitId` AFTER currency
 *  conversion (the AOS order). Omit `unit` to price in the price's own unit. */
export function getConvertedPrice({
  price,
  sourceInAti,
  resultInAti,
  taxLineSet,
  fromCurrency,
  toCurrency,
  conversionLines,
  today,
  unit,
  unitConversions,
  nbDecimalForUnitPrice = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
}: {
  price: BigDecimal;
  sourceInAti: boolean;
  /** Which basis to return the amount in. */
  resultInAti: boolean;
  taxLineSet: readonly ResolvedTaxLine[];
  fromCurrency: Currency | null | undefined;
  toCurrency: Currency | null | undefined;
  conversionLines: readonly ConversionLine[];
  today: string;
  /** Quote the price in `requestedUnitId` instead of `saleUnitId` (the unit
   *  `price` is expressed in). Omit to keep the price's own unit. */
  unit?: {requestedUnitId: string; saleUnitId: string} | null;
  unitConversions?: readonly UnitConversionRow[];
  nbDecimalForUnitPrice?: number;
}): BigDecimal {
  const taxRate = getTotalTaxRateInPercentage(taxLineSet);

  /* Basis conversion first, at the intermediate scale — AOS passes
   * COMPUTATION_SCALING here precisely so this leg does not round the amount. */
  let amount =
    sourceInAti === resultInAti
      ? price
      : convertUnitPrice(sourceInAti, taxRate, price, INTERMEDIATE_SCALE);

  const fromCode = fromCurrency?.codeISO;
  const toCode = toCurrency?.codeISO;
  if (!fromCode || !toCode) {
    throw new PriceComputationError(
      'CURRENCY_1',
      'Missing source or target currency for conversion',
    );
  }
  const rate = getExchangeRate(fromCode, toCode, today, conversionLines);
  amount = amount.multiply(rate);

  /* Round the converted amount to the TARGET currency's own decimals, the way
   * AOS does inside the conversion itself
   * (`CurrencyServiceImpl.getAmountCurrencyConvertedUsingExchangeRate`:
   * `amount.multiply(rate).setScale(endCurrency.numberOfDecimals)`), and only
   * when a real conversion happened (rate != 1, mirroring AOS's `!= ONE`
   * guard). Skipping this diverges for any currency whose decimals differ from
   * the unit-price scale — e.g. JPY (0 decimals): 8960.25 vs 8960. */
  if (rate.compareTo(ONE) !== 0 && toCurrency?.numberOfDecimals != null) {
    amount = scaled(amount, toCurrency.numberOfDecimals);
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
    amount = amount.multiply(coef);
  }

  return scaled(amount, nbDecimalForUnitPrice);
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
 *  Pass `requestedUnit` to quote in a unit other than the product's sale unit
 *  (`salesUnit ?? unit`) — see `getConvertedPrice`.
 *
 *  Returns the amount in the `resultInAti` basis, plus the two things this
 *  function resolved internally and the caller could not otherwise know: the
 *  total `taxRate` of the applicable taxes, and the `unitId` the amount is
 *  expressed in — the requested unit when one was given, otherwise the product's
 *  own sale unit. Only the id: the core never sees a unit's display name. It is
 *  `null` only when no unit was requested AND the product carries no unit;
 *  requesting one with no source unit to convert from throws
 *  `UNIT_CONVERSION_NO_SOURCE_UNIT`. */
export function getSaleUnitPrice({
  product,
  company,
  fiscalPosition,
  resultInAti,
  toCurrency,
  conversionLines,
  companySpecificProductFields,
  requestedUnit,
  unitConversions,
  nbDecimalForUnitPrice = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
}: {
  product: PriceableProduct;
  company: {id: string; timezone?: string | null} | null;
  fiscalPosition: FiscalPositionInput | null | undefined;
  /** Which basis to return the amount in. A sale-order line asks for the
   *  product's own basis (`resolveProductField(product, 'inAti', …)`), which is
   *  the one it stores; the quick-price endpoint asks for whichever the caller
   *  wants. */
  resultInAti: boolean;
  toCurrency: Currency;
  conversionLines: readonly ConversionLine[];
  companySpecificProductFields: readonly string[];
  /** Quote in this unit instead of the product's `salesUnit ?? unit`. */
  requestedUnit?: {id: string} | null;
  unitConversions?: readonly UnitConversionRow[];
  nbDecimalForUnitPrice?: number;
}): {
  price: BigDecimal;
  taxRate: BigDecimal;
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
    price: getConvertedPrice({
      price: toDecimalOrNull(salePrice) ?? ZERO,
      sourceInAti: Boolean(inAti),
      resultInAti,
      taxLineSet,
      fromCurrency: saleCurrency,
      toCurrency,
      conversionLines,
      today,
      unit,
      unitConversions,
      nbDecimalForUnitPrice,
    }),
    taxRate: getTotalTaxRateInPercentage(taxLineSet),
    /* The unit the returned price is expressed in: the requested one, or the
     * product's own sale unit that we resolved above. */
    unitId: requestedUnit?.id ?? saleUnitId ?? null,
  };
}
