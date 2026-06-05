/* Currency and unit conversion factors — mirroring AOS
 * `CurrencyServiceImpl.getCurrencyConversionRateAtDate` and
 * `UnitConversionServiceImpl.getCoefficient`. Both return a plain multiplier;
 * the caller multiplies the price by it. */

import type {ConversionLine, UnitConversionRow} from '../orm';
import {PriceComputationError} from './errors';
import {round} from './util';

/** Scales AOS rounds exchange rates to (`AppBaseService`): a rate to 6
 *  decimals, an inverted rate at 8 before being re-scaled to 6. */
const EXCHANGE_RATE_SCALE = 6;
const EXCHANGE_RATE_REVERSION_SCALE = 8;

/** Finds the exchange rate between two currencies for today, the way AOS does
 *  (`CurrencyServiceImpl.getCurrencyConversionRateAtDate`):
 *
 *  - same currency → 1, no lookup;
 *  - otherwise look for a direct from→to line valid today;
 *  - failing that, take the reverse to→from line and use 1/rate.
 *
 *  Lines are matched on `codeISO` — the unique ISO code AOS keys on — never the
 *  printing `code` (those can differ, e.g. "¥" vs "JPY").
 *
 *  The rate is rounded exactly as AOS does (`CurrencyServiceImpl`): a direct
 *  rate to 6 decimals; an inverted rate is computed at 8 decimals and then
 *  re-scaled to 6. Half-up throughout. (Final amounts are still rounded by the
 *  caller, at its own scale.)
 *
 *  Errors: no line in either direction → CURRENCY_1; a line whose rate is zero
 *  or unreadable → CURRENCY_2. */
export function getExchangeRate(
  fromCode: string,
  toCode: string,
  today: string,
  lines: readonly ConversionLine[],
): number {
  if (fromCode === toCode) return 1;

  const matchLine = (start: string, end: string) =>
    lines.find(l => {
      if (l.startCurrency.codeISO !== start || l.endCurrency.codeISO !== end)
        return false;
      /* Validity window; dates are YYYY-MM-DD strings, so string comparison is
       * chronological. A missing toDate means the line is open-ended. */
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
    return round(rate, EXCHANGE_RATE_SCALE);
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
    /* AOS inverts at 8 decimals, then re-scales the rate to 6. */
    return round(
      round(1 / rate, EXCHANGE_RATE_REVERSION_SCALE),
      EXCHANGE_RATE_SCALE,
    );
  }

  throw new PriceComputationError(
    'CURRENCY_1',
    `No conversion line between ${fromCode} and ${toCode}`,
  );
}

/** AOS `UnitConversionRepository.TYPE_COEFF`: a conversion line whose
 *  coefficient is a plain number. The other type, `TYPE_FORMULA` (2), is a
 *  Groovy expression we deliberately don't support. */
const TYPE_COEFF = 1;

/** The factor that turns a value in `fromUnitId` into a value in `toUnitId`,
 *  mirroring `UnitConversionServiceImpl.getCoefficient`:
 *
 *  - same unit → 1, no lookup;
 *  - a direct from→to line → its `coef`;
 *  - failing that, the reverse to→from line → `1/coef`.
 *
 *  Only coefficient lines are honoured. A matching line that is a Groovy
 *  formula (or has a null/unknown `typeSelect`) throws
 *  UNIT_CONVERSION_FORMULA_UNSUPPORTED — we never evaluate Groovy. A line whose
 *  coefficient is zero or unreadable throws UNIT_CONVERSION_2, and no line in
 *  either direction throws UNIT_CONVERSION_1.
 *
 *  To turn a per-unit PRICE expressed in the sale unit into the price per a
 *  requested unit, call `getUnitCoefficient(requestedUnitId, saleUnitId, …)`
 *  and multiply — the same argument order AOS uses in `ProductRestServiceImpl`
 *  (`convert(requestedUnit, saleUnit, price)`). */
export function getUnitCoefficient(
  fromUnitId: string,
  toUnitId: string,
  conversions: readonly UnitConversionRow[],
): number {
  if (fromUnitId === toUnitId) return 1;

  const direct = conversions.find(
    c => c.startUnit.id === fromUnitId && c.endUnit.id === toUnitId,
  );
  if (direct != null) return coefOf(direct, false);

  const reverse = conversions.find(
    c => c.startUnit.id === toUnitId && c.endUnit.id === fromUnitId,
  );
  if (reverse != null) return coefOf(reverse, true);

  throw new PriceComputationError(
    'UNIT_CONVERSION_1',
    `No unit conversion between ${fromUnitId} and ${toUnitId}`,
  );
}

/** Reads a usable coefficient off one matched line, inverting it when the line
 *  was matched in reverse. Rejects non-coefficient lines and zero/unreadable
 *  coefficients exactly where AOS does. */
function coefOf(line: UnitConversionRow, inverted: boolean): number {
  if (line.typeSelect !== TYPE_COEFF) {
    throw new PriceComputationError(
      'UNIT_CONVERSION_FORMULA_UNSUPPORTED',
      'Only coefficient-based unit conversions are supported',
    );
  }
  const coef = Number(line.coef);
  if (!Number.isFinite(coef) || coef === 0) {
    throw new PriceComputationError(
      'UNIT_CONVERSION_2',
      'Unit conversion coefficient is zero or unreadable',
    );
  }
  return inverted ? 1 / coef : coef;
}
