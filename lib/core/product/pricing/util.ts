/* Leaf helpers shared across the pricing core: half-up rounding, the
 * timezone-aware "today", and the per-company product-field reader. */

import type {PriceableProduct} from '../orm';

type SaleFieldName = 'salePrice' | 'inAti' | 'saleCurrency';

/** Half-up rounding to `scale` decimal places: round(119.58804, 2) → 119.59. */
export function round(value: number, scale: number): number {
  const factor = 10 ** scale;
  return Math.round(value * factor) / factor;
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
