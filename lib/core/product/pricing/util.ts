/* Leaf helpers shared across the pricing core: the decimal arithmetic the money
 * path is built from, the timezone-aware "today", and the per-company
 * product-field reader.
 *
 * Amounts, rates and quantities are `BigDecimal`, matching the types AOS uses and
 * its half-up rounding. Scales and enum selects are plain numbers, as they are in
 * AOS. */

import {BigDecimal, RoundingMode} from '@goovee/orm';

import type {PriceableProduct} from '../orm';

type SaleFieldName = 'salePrice' | 'inAti' | 'saleCurrency';

export const ZERO = BigDecimal.valueOf('0');
export const ONE = BigDecimal.valueOf('1');
export const HUNDRED = BigDecimal.valueOf('100');

/** The scale AOS carries through its intermediate tax and discount maths
 *  (`AppBaseService.COMPUTATION_SCALING`); non-terminating divisions cut here.
 *  Equal to `DISCOUNT_SCALE` by coincidence, not by meaning. */
export const INTERMEDIATE_SCALE = 20;

/** Half-up rounding to `scale` decimal places — AOS's `setScale(scale,
 *  HALF_UP)`: scaled(119.58804, 2) → 119.59. */
export function scaled(value: BigDecimal, scale: number): BigDecimal {
  return value.setScale(scale, RoundingMode.HALF_UP);
}

const ONE_HUNDREDTH = BigDecimal.valueOf('0.01');

/**
 * Half-up division, carried to at least the intermediate scale; the caller scales
 * the result down to whatever it needs.
 *
 * AOS divides once, straight to the scale it wants. Do NOT follow it here:
 * `BigDecimal.divide(divisor, scale, mode)` in `@goovee/orm` 0.0.7 returns a
 * wildly too-large result whenever `scale + divisor.scale() − dividend.scale()` is
 * negative — `6666.03333 / 100` at scale 2 gives 66660333.30. Only the scales
 * matter, not the divisor's value. This raises the scale to keep that expression
 * non-negative, so any width of dividend is safe.
 */
export function divide(dividend: BigDecimal, divisor: BigDecimal): BigDecimal {
  const safeScale = Math.max(
    INTERMEDIATE_SCALE,
    dividend.scale() - divisor.scale(),
  );
  return dividend.divide(divisor, safeScale, RoundingMode.HALF_UP);
}

/** A percentage as a fraction — AOS's `percent.divide(new BigDecimal(100))`
 *  (`TaxService.getTotalTaxRate`, `PriceListService.getUnitPriceDiscounted`).
 *  Multiplying by 0.01 is exact, and needs no scale. */
export function percentFraction(percent: BigDecimal): BigDecimal {
  return percent.multiply(ONE_HUNDREDTH);
}

/** `1 + taxRate/100` — the factor turning WT into ATI.
 *
 *  Zero at a rate of exactly -100%, which AOS's tax lines cannot hold (they are
 *  constrained to 0..100). Dividing by it raises a plain `Error`, not a
 *  `PriceComputationError`, so a caller that degrades rather than fails has to
 *  check this factor against zero itself. */
export function taxFactor(taxRate: BigDecimal): BigDecimal {
  return ONE.add(percentFraction(taxRate));
}

/** `value × (100 − percent) / 100`, half-up at `scale` — the whole percentage
 *  branch of AOS `PriceListService.computeDiscount`, including its `100 −`, so
 *  `percent` is the percentage to take off and the result is what remains.
 *
 *  `percent` is unbounded on both sides, and neither end is an edge case to guard
 *  against: a negative one RAISES the value, which is how a markup arrives (a
 *  price-list INCREASE line resolves into a negative discount), and one above 100
 *  drives the value below zero. Both steps are exact, so `scale` is the only
 *  rounding. */
export function applyPercentDiscount(
  value: BigDecimal,
  percent: BigDecimal,
  scale: number,
): BigDecimal {
  const remaining = HUNDRED.subtract(percent);
  return scaled(value.multiply(remaining).multiply(ONE_HUNDREDTH), scale);
}

/** Reads an ORM decimal column (or any value carrying one) as a `BigDecimal`,
 *  yielding null for null/unreadable input. Going through the string form keeps
 *  a value that arrived as a double exact to its printed digits.
 *
 *  Exponential notation is not readable, so a plain JS number whose MAGNITUDE
 *  falls outside `[1e-6, 1e21)` yields null — zero and negatives of a readable
 *  magnitude are fine. A `BigDecimal` never prints that way whatever its
 *  magnitude, so only a caller handing over raw numbers has to stay in range. */
export function toDecimalOrNull(value: unknown): BigDecimal | null {
  if (value == null) return null;
  try {
    return BigDecimal.valueOf(String(value));
  } catch {
    return null;
  }
}

/** Formats a date as `YYYY-MM-DD` in the given IANA timezone (e.g.
 *  "Europe/Paris"), falling back to the server clock when no zone — or an
 *  invalid one — is supplied. AOS likewise resolves "today" in the company's
 *  timezone before checking tax/rate validity windows
 *  (`AppBaseService.getTodayDate(company)`).
 *
 *  The `en-CA` locale is a trick: its native date format IS `YYYY-MM-DD`, the
 *  same shape the dates have in the database — which is what makes the plain
 *  string comparisons in the window checks valid. */
export function dateInTimezone(
  date: Date,
  timezone: string | null | undefined,
): string {
  if (!timezone) return date.toISOString().slice(0, 10);
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    /* Invalid IANA string on the company row — don't fail rendering; fall back
     * to UTC server time. The misconfiguration only shows around midnight
     * rollovers, same as if the field were unset. */
    return date.toISOString().slice(0, 10);
  }
}

export function todayInTimezone(timezone: string | null | undefined): string {
  return dateInTimezone(new Date(), timezone);
}

/** Reads one sale field off the product, honouring the per-company override
 *  rows the way AOS does (`ProductCompanyServiceImpl.get`):
 *
 *  - If the admin has NOT flagged this field as company-specific, the override
 *    rows are ignored entirely — base product value.
 *  - If it IS flagged and a row exists for the selling company, the row's value
 *    is used as-is. Deliberately no fallback: a null on the row stays null,
 *    because in AOS the row fully owns the field.
 *  - Otherwise, the base product value. */
export function resolveProductField<
  P extends PriceableProduct,
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
