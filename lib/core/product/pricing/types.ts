/* Computed types, enum constants and error codes for the pricing core.
 *
 * The *input* shapes the pricing functions consume are NOT declared here — they
 * are the `Payload` types of the select fragments in `../orm` (`PriceableProduct`,
 * `Currency`, `TaxRow`, `ConversionLine`, `FiscalPositionInput`, `PriceListRow`,
 * `PriceListLineRow`, `UnitConversionRow`). A field added to a fragment flows
 * straight into the functions that read it. This file holds only what the core
 * itself defines: the values it *computes* (`ResolvedTaxLine`, `ResolvedDiscount`),
 * the `DecimalLike` quantity type, the AOS enum constants, and the error codes.
 *
 * Vocabulary:
 * - WT — the price WITHOUT tax (net); ATI — with ALL TAXES INCLUDED (gross).
 * - inAti — a flag telling which of the two a stored number means.
 * - Tax / tax line — a Tax ("VAT") is a container; its dated TaxLine rows carry
 *   the rates. Account management — a per-company row listing which sale taxes
 *   apply. Fiscal position — buyer-specific tax equivalences.
 * - Conversion line — an exchange-rate row. Price list / price-list line — a
 *   buyer's dated table of discounts, markups and replacement prices; compute
 *   method — whether a matched discount is folded into the unit price or kept
 *   separate. */

import type {BigDecimal} from '@goovee/orm';

/** Any value `Number(...)` understands: plain numbers, decimal strings, and the
 *  ORM's `BigDecimal`. Used for the `qty` params the caller supplies directly
 *  (the ORM-sourced decimal fields are typed `BigDecimal` by their `Payload`). */
export type DecimalLike = string | number | BigDecimal;

/** Why a price could not be computed. Each code corresponds to one spot where
 *  the mirrored AOS Java throws an `AxelorException`, so a caller can react
 *  exactly like an AOS admin would read the original error. */
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
  | 'CURRENCY_2'
  /** No conversion line exists between the two units, in either direction. */
  | 'UNIT_CONVERSION_1'
  /** A conversion line exists but its coefficient is zero or unreadable. */
  | 'UNIT_CONVERSION_2'
  /** The matching conversion line isn't coefficient-based (a Groovy formula, a
   *  null type, or an unknown type); we don't evaluate it. */
  | 'UNIT_CONVERSION_FORMULA_UNSUPPORTED'
  /** A price was requested in a specific unit, but the product has no sale unit
   *  (`salesUnit ?? unit`) to convert from. */
  | 'UNIT_CONVERSION_NO_SOURCE_UNIT';

/** A tax line once picked: just its identity and its rate. The id is what lets
 *  us deduplicate — AOS collects the picked lines into a `HashSet`, so one line
 *  shared by two taxes must count once. (Computed from a `TaxRow`.) */
export type ResolvedTaxLine = {id: string; value: number | null};

/* ──────────────────────────────────────────────────────────────────────
 * Price-list enum constants (PriceListLineRepository / AppBaseRepository)
 * ────────────────────────────────────────────────────────────────────── */

/** `PriceListLine.typeSelect` — what the line does to the price. */
export const PRICE_LIST_LINE_TYPE = {
  /** Reduce the price. */
  DISCOUNT: 1,
  /** Raise the price. */
  INCREASE: 2,
  /** Replace the price outright. */
  REPLACE: 3,
} as const;

/** `PriceListLine.amountTypeSelect` — how to read the line's `amount`. */
export const AMOUNT_TYPE = {
  NONE: 0,
  PERCENT: 1,
  FIXED: 2,
} as const;

/** `AppBase.computeMethodDiscountSelect` — whether a matched discount is folded
 *  into the unit price or surfaced as a separate discount. */
export const COMPUTE_METHOD_DISCOUNT = {
  /** Keep the discount as separate `discountAmount`/`discountTypeSelect`
   *  fields; the unit price is left untouched. */
  SEPARATE: 1,
  /** Fold the discount into the price, but only for REPLACE lines. */
  INCLUDE_REPLACE_ONLY: 2,
  /** Fold every matched discount into the price. */
  INCLUDE: 3,
} as const;

/** AOS `appBaseService.getNbDecimalDigitForUnitPrice()` default — the scale
 *  unit prices (and percentage discounts) are rounded to. Configurable in AOS;
 *  defaults to 2. Callers pass their configured value. */
export const DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE = 2;

/** A resolved discount: the amount, the unit it is expressed in (`AMOUNT_TYPE`),
 *  and — when the compute method folded it in — the already-discounted
 *  `price`. (Computed from a price list + line.) */
export type ResolvedDiscount = {
  discountTypeSelect: number;
  discountAmount: number;
  /** The discounted unit price, set only when the discount was folded into the
   *  price (see `getReplacedPriceAndDiscounts`); otherwise null. */
  price: number | null;
};
