/* Price-list discounts — a faithful port of the AOS price-list services. AOS
 * finishes pricing a line by running the buyer's sale price list over the
 * catalogue unit price: a per-product (or per-category), per-quantity table of
 * discounts, markups and replacement prices.
 *
 * How a discount is applied (in reading order):
 * 1. Find the buyer's applicable price list (`getDefaultPriceList`): among the
 *    lists attached to the buyer, the single active one whose window contains
 *    today (zero or more than one → none).
 * 2. Pick the best matching line (`getPriceListLine`): among the product's
 *    lines — or, if none, its category's — whose `minQty` the quantity reaches,
 *    the one yielding the lowest discounted price. No line → the general
 *    discount.
 * 3. Turn the line into a discount (`getDiscounts` /
 *    `getReplacedPriceAndDiscounts`) and apply it (`computeDiscount`).
 *    `getDiscountedPrice` composes the whole of this step.
 *
 * Discounts are computed in the PRODUCT's own tax basis (the line amounts are
 * stored that way); a caller wanting the result in the other basis converts
 * around this step.
 *
 * AOS code mirrored: `PartnerPriceListServiceImpl.getDefaultPriceList`,
 * `PriceListService` (getPriceListLine, getDiscountAmount,
 * getUnitPriceDiscounted, computeDiscount, getDiscounts,
 * getReplacedPriceAndDiscounts), `SaleOrderLineDiscountServiceImpl
 * .getDiscountedPrice`. The end-to-end `getDiscountedPrice` mirrors the SALE
 * path (honours the folded-in price). The product-price endpoint's quirky
 * variant lives in `apply-price-list.ts`.
 *
 * Precision: float64, not BigDecimal. The fixed-amount discount branch of
 * `computeDiscount` would round to AOS's DISCOUNT_SCALE (20) — past float64's
 * precision, so a no-op and omitted; the percentage branch rounds to the
 * unit-price scale exactly as AOS does. */

import type {DecimalLike, ResolvedDiscount} from './types';
import type {PriceListLineRow, PriceListRow} from '../orm';
import {
  AMOUNT_TYPE,
  COMPUTE_METHOD_DISCOUNT,
  DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
  PRICE_LIST_LINE_TYPE,
} from './types';
import {round} from './util';

/* ──────────────────────────────────────────────────────────────────────
 * Discount primitives (PriceListService)
 * ────────────────────────────────────────────────────────────────────── */

/** The discount's unit, i.e. the line's `amountTypeSelect`
 *  (`PriceListService.getDiscountTypeSelect`); a null type reads as NONE. */
export function getDiscountTypeSelect(line: PriceListLineRow): number {
  return line.amountTypeSelect ?? AMOUNT_TYPE.NONE;
}

/** The signed discount amount a line represents, relative to `unitPrice`
 *  (`PriceListService.getDiscountAmount`):
 *  - increase → the amount, negated (a negative discount);
 *  - discount → the amount as-is;
 *  - replace  → the gap between the current price and the replacement
 *    (`unitPrice − amount`), so subtracting it lands on the replacement;
 *  - anything else → 0.
 *
 *  The amount is interpreted later, by `computeDiscount`, according to the
 *  line's `amountTypeSelect` (percentage vs fixed). */
export function getDiscountAmount(
  line: PriceListLineRow,
  unitPrice: number,
): number {
  const amount = Number(line.amount ?? 0);
  switch (line.typeSelect) {
    case PRICE_LIST_LINE_TYPE.INCREASE:
      return -amount;
    case PRICE_LIST_LINE_TYPE.DISCOUNT:
      return amount;
    case PRICE_LIST_LINE_TYPE.REPLACE:
      return unitPrice - amount;
    default:
      return 0;
  }
}

/** The unit price a line yields, fully resolved
 *  (`PriceListService.getUnitPriceDiscounted(line, …)`). Used to compare
 *  candidate lines when several match. Combines `typeSelect` and
 *  `amountTypeSelect`:
 *  - increase: fixed → `+ amount`, percent → `× (1 + amount/100)`;
 *  - discount: fixed → `− amount`, percent → `× (1 − amount/100)`;
 *  - replace: the amount, outright;
 *  - otherwise: the price unchanged. */
export function getUnitPriceDiscounted(
  line: PriceListLineRow,
  unitPrice: number,
): number {
  const amount = Number(line.amount ?? 0);
  switch (line.typeSelect) {
    case PRICE_LIST_LINE_TYPE.INCREASE:
      if (line.amountTypeSelect === AMOUNT_TYPE.FIXED) {
        return unitPrice + amount;
      }
      if (line.amountTypeSelect === AMOUNT_TYPE.PERCENT) {
        return unitPrice * (1 + amount / 100);
      }
      return unitPrice;
    case PRICE_LIST_LINE_TYPE.DISCOUNT:
      if (line.amountTypeSelect === AMOUNT_TYPE.FIXED) {
        return unitPrice - amount;
      }
      if (line.amountTypeSelect === AMOUNT_TYPE.PERCENT) {
        return unitPrice * (1 - amount / 100);
      }
      return unitPrice;
    case PRICE_LIST_LINE_TYPE.REPLACE:
      return amount;
    default:
      return unitPrice;
  }
}

/** The unit price after a price list's flat general discount (a percentage),
 *  mirroring the `PriceListService.getUnitPriceDiscounted(PriceList, …)`
 *  overload: `unitPrice × (1 − generalDiscount/100)`. */
export function getUnitPriceDiscountedByGeneralDiscount(
  priceList: PriceListRow,
  unitPrice: number,
): number {
  const generalDiscount = Number(priceList.generalDiscount ?? 0);
  return unitPrice * (1 - generalDiscount / 100);
}

/** Applies a resolved discount to a unit price
 *  (`PriceListService.computeDiscount`):
 *  - fixed   → `unitPrice − discountAmount`;
 *  - percent → `unitPrice × (100 − discountAmount) / 100`, rounded to the
 *    unit-price scale (half-up);
 *  - none / unknown → unchanged.
 *
 *  AOS rounds the fixed branch to DISCOUNT_SCALE (20) — beyond float64's
 *  precision, hence a no-op and omitted here. */
export function computeDiscount(
  unitPrice: number,
  discountTypeSelect: number,
  discountAmount: number,
  nbDecimalForUnitPrice: number = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
): number {
  if (discountTypeSelect === AMOUNT_TYPE.FIXED) {
    return unitPrice - discountAmount;
  }
  if (discountTypeSelect === AMOUNT_TYPE.PERCENT) {
    return round(
      (unitPrice * (100 - discountAmount)) / 100,
      nbDecimalForUnitPrice,
    );
  }
  return unitPrice;
}

/** Resolves a line (or, when there is none, the price list's general discount)
 *  into a discount amount + type (`PriceListService.getDiscounts`). The amount
 *  is rounded to the unit-price scale, as AOS does.
 *
 *  - with a line: the signed `getDiscountAmount`, typed by the line's
 *    `amountTypeSelect`;
 *  - without a line: the general discount as a percentage — type PERCENT, or
 *    NONE when it is zero. */
export function getDiscounts(
  priceList: PriceListRow,
  line: PriceListLineRow | null,
  price: number,
  nbDecimalForUnitPrice: number = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
): {discountTypeSelect: number; discountAmount: number} {
  if (line != null) {
    return {
      discountAmount: round(
        getDiscountAmount(line, price),
        nbDecimalForUnitPrice,
      ),
      discountTypeSelect: getDiscountTypeSelect(line),
    };
  }
  const discountAmount = round(
    Number(priceList.generalDiscount ?? 0),
    nbDecimalForUnitPrice,
  );
  return {
    discountAmount,
    discountTypeSelect:
      discountAmount === 0 ? AMOUNT_TYPE.NONE : AMOUNT_TYPE.PERCENT,
  };
}

/** Resolves a discount and, depending on the compute method, optionally folds
 *  it straight into the price
 *  (`PriceListService.getReplacedPriceAndDiscounts`):
 *
 *  - INCLUDE, or INCLUDE_REPLACE_ONLY on a REPLACE line → apply the discount
 *    now, return the discounted `price` and report the residual discount as
 *    NONE / 0;
 *  - otherwise (SEPARATE) → leave `price` null and return the discount so the
 *    caller can surface it as a separate field. */
export function getReplacedPriceAndDiscounts(
  priceList: PriceListRow,
  line: PriceListLineRow | null,
  price: number,
  computeMethodDiscountSelect: number,
  nbDecimalForUnitPrice: number = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
): ResolvedDiscount {
  const lineTypeSelect = line != null ? (line.typeSelect ?? 0) : 0;
  const {discountAmount, discountTypeSelect} = getDiscounts(
    priceList,
    line,
    price,
    nbDecimalForUnitPrice,
  );

  if (
    (computeMethodDiscountSelect ===
      COMPUTE_METHOD_DISCOUNT.INCLUDE_REPLACE_ONLY &&
      lineTypeSelect === PRICE_LIST_LINE_TYPE.REPLACE) ||
    computeMethodDiscountSelect === COMPUTE_METHOD_DISCOUNT.INCLUDE
  ) {
    const discountedPrice = computeDiscount(
      price,
      discountTypeSelect,
      discountAmount,
      nbDecimalForUnitPrice,
    );
    return {
      price: discountedPrice,
      discountTypeSelect: AMOUNT_TYPE.NONE,
      discountAmount: 0,
    };
  }

  return {price: null, discountTypeSelect, discountAmount};
}

/* ──────────────────────────────────────────────────────────────────────
 * Line selection (PriceListService.getPriceListLine)
 * ────────────────────────────────────────────────────────────────────── */

/** The candidate lines for a quantity, mirroring AOS's fetch
 *  (`PriceListService.getPriceListLineList`): the product's lines whose
 *  `minQty` the quantity reaches, ordered by `minQty` descending; or — when the
 *  product has none — the product category's, the same way. Callers pass each
 *  list already scoped to the right price list + product / category; this
 *  applies the `minQty <= qty` filter and the ordering. */
export function getPriceListLineList<L extends PriceListLineRow>(
  productLines: readonly L[],
  categoryLines: readonly L[] | null | undefined,
  qty: DecimalLike,
): L[] {
  const qtyNum = Number(qty);
  const reachableSortedDesc = (lines: readonly L[]) =>
    lines
      .filter(line => Number(line.minQty ?? 0) <= qtyNum)
      .sort((a, b) => Number(b.minQty ?? 0) - Number(a.minQty ?? 0));

  const fromProduct = reachableSortedDesc(productLines);
  if (fromProduct.length > 0) return fromProduct;
  if (categoryLines && categoryLines.length > 0) {
    return reachableSortedDesc(categoryLines);
  }
  return [];
}

/** Picks the single applicable line (`PriceListService.getPriceListLine`):
 *  among the candidate lines for the quantity, the one yielding the LOWEST
 *  discounted price (the best deal for the buyer). With one candidate it is
 *  chosen directly; with none, `null` (the caller falls back to the general
 *  discount). On a tie the earlier line — the higher `minQty`, given the
 *  descending order — is kept, as AOS's strict `>` comparison does. */
export function getPriceListLine<L extends PriceListLineRow>(
  productLines: readonly L[],
  categoryLines: readonly L[] | null | undefined,
  qty: DecimalLike,
  unitPrice: number,
): L | null {
  const candidates = getPriceListLineList(productLines, categoryLines, qty);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  let bestLine: L | null = null;
  let bestDiscounted: number | null = null;
  for (const line of candidates) {
    const discounted = getUnitPriceDiscounted(line, unitPrice);
    if (bestDiscounted === null || bestDiscounted > discounted) {
      bestDiscounted = discounted;
      bestLine = line;
    }
  }
  return bestLine;
}

/* ──────────────────────────────────────────────────────────────────────
 * Partner's applicable price list (PartnerPriceListServiceImpl)
 * ────────────────────────────────────────────────────────────────────── */

/** The buyer's applicable price list for today
 *  (`PartnerPriceListServiceImpl.getDefaultPriceList`): among the lists
 *  attached to the buyer (already filtered to the wanted type), keep the active
 *  ones whose `[applicationBeginDate, applicationEndDate]` window contains
 *  today. Returns the sole survivor, or `null` if zero — or more than one —
 *  qualify (AOS treats an ambiguous set as no price list). */
export function getDefaultPriceList<P extends PriceListRow>(
  priceLists: readonly P[],
  today: string,
): P | null {
  const applicable = priceLists.filter(
    priceList =>
      priceList.isActive === true &&
      (priceList.applicationBeginDate == null ||
        priceList.applicationBeginDate <= today) &&
      (priceList.applicationEndDate == null ||
        priceList.applicationEndDate >= today),
  );
  return applicable.length === 1 ? applicable[0] : null;
}

/* ──────────────────────────────────────────────────────────────────────
 * Composition (SaleOrderLineDiscountServiceImpl.getDiscountedPrice)
 * ────────────────────────────────────────────────────────────────────── */

/** The unit price after the buyer's price list — the end-to-end step,
 *  mirroring `SaleOrderLineDiscountServiceImpl.getDiscountedPrice`: find the
 *  best line for the product/category at this quantity, resolve the discount,
 *  and return the folded-in price when the compute method folds it (INCLUDE /
 *  INCLUDE_REPLACE_ONLY), or the price unchanged otherwise (SEPARATE — the
 *  discount is meant to be shown separately).
 *
 *  `price` is the catalogue unit price in the PRODUCT's own tax basis, as the
 *  line amounts are; a caller needing the result in the other basis converts
 *  around this call. */
export function getDiscountedPrice<L extends PriceListLineRow>({
  priceList,
  productLines,
  categoryLines,
  qty,
  price,
  computeMethodDiscountSelect,
  nbDecimalForUnitPrice = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
}: {
  priceList: PriceListRow;
  productLines: readonly L[];
  categoryLines?: readonly L[] | null;
  qty: DecimalLike;
  price: number;
  computeMethodDiscountSelect: number;
  nbDecimalForUnitPrice?: number;
}): number {
  const line = getPriceListLine(productLines, categoryLines, qty, price);
  const discounts = getReplacedPriceAndDiscounts(
    priceList,
    line,
    price,
    computeMethodDiscountSelect,
    nbDecimalForUnitPrice,
  );
  return discounts.price ?? price;
}
