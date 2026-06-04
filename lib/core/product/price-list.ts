/* Price-list discounts — a faithful TypeScript port of the AOS price-list
 * services. AOS finishes pricing a sale-order line by running the buyer's
 * sale price list over the catalogue unit price: a per-product (or
 * per-category), per-quantity table of discounts, markups and replacement
 * prices. This module mirrors that step so a consumer can apply the same
 * adjustment the AOS back end would.
 *
 * It is the companion of `pricing.ts`: that module resolves the catalogue
 * unit price (tax, currency, unit); this one adjusts it for a buyer. Like
 * its sibling it is generic — it defines its own structural input types
 * (the `Pricing*` family) so callers feed their own ORM result shapes, and
 * it leaves final rounding to the caller.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Vocabulary
 * ──────────────────────────────────────────────────────────────────────
 * - Price list — a dated, typed (sale / purchase) table a buyer is
 *   attached to (via a PartnerPriceList). It carries a general discount
 *   and a set of lines.
 * - Price-list line — one rule: for a product (or product category), from
 *   a minimum quantity, adjust the price. Its `typeSelect` says how
 *   (discount / increase / replace) and its `amountTypeSelect` says in
 *   what unit the amount is (a percentage, a fixed money amount, or none).
 * - General discount — a flat percentage on the whole price list, used
 *   when no specific line matches.
 * - Compute method — an app-wide setting deciding whether a matched
 *   discount is folded into the unit price or kept as a separate
 *   discount field on the line (see `getReplacedPriceAndDiscounts`).
 *
 * ──────────────────────────────────────────────────────────────────────
 * How a discount is applied (in reading order)
 * ──────────────────────────────────────────────────────────────────────
 * 1. Find the buyer's applicable sale price list (`getDefaultPriceList`):
 *    among the lists attached to the buyer, keep the active ones whose
 *    application window contains today; exactly one must remain, else none.
 * 2. Pick the best matching line (`getPriceListLine`): among the price
 *    list's lines for this product — or, if none, this product's category
 *    — whose `minQty` the quantity reaches, take the one that yields the
 *    lowest discounted price. No line → the general discount is used.
 * 3. Turn the line into a discount (`getDiscounts` /
 *    `getReplacedPriceAndDiscounts`) and apply it (`computeDiscount`),
 *    giving the adjusted unit price. `getDiscountedPrice` composes the
 *    whole of this step.
 * 4. (Billable amount) `getLineTotal` takes the unit price plus the
 *    resolved discount and quantity to the line totals `exTaxTotal` /
 *    `inTaxTotal`, rounded to the currency — a port of
 *    `SaleOrderLineComputeServiceImpl.computeValues`. This is where a
 *    SEPARATE-mode discount (kept off the unit price) actually lands.
 *
 * AOS does this AFTER the catalogue price is fully resolved (tax + currency)
 * — `ProductPriceServiceImpl.getSaleUnitPrice` calls it as its final step,
 * and every sale/purchase/invoice/contract line service reuses the same
 * primitives. Discounts are computed in the PRODUCT's own tax basis (the
 * line amounts are stored that way); a caller wanting the result in the
 * other basis converts around this step (see
 * `SaleOrderLineDiscountServiceImpl`).
 *
 * ──────────────────────────────────────────────────────────────────────
 * The AOS code this mirrors
 * ──────────────────────────────────────────────────────────────────────
 *   axelor-base/.../PartnerPriceListServiceImpl.getDefaultPriceList
 *   axelor-base/.../PriceListService (getPriceListLine, getDiscountAmount,
 *     getUnitPriceDiscounted, computeDiscount, getDiscounts,
 *     getReplacedPriceAndDiscounts)
 *   axelor-base/.../ProductPriceListServiceImpl.applyPriceList
 *   axelor-sale/.../SaleOrderLineDiscountServiceImpl.getDiscountedPrice
 *
 * The end-to-end entry point, `getDiscountedPrice`, mirrors the SALE path
 * (`SaleOrderLineDiscountServiceImpl.getDiscountedPrice`), which reads back
 * the folded-in price. We deliberately do NOT mirror the OTHER AOS caller,
 * `ProductPriceListServiceImpl.applyPriceList` (the final step of
 * `ProductPriceServiceImpl.getSaleUnitPrice`): it extracts only the discount
 * amount/type from the resolved map and discards the folded price, so in the
 * INCLUDE / INCLUDE_REPLACE_ONLY modes it returns the price UNCHANGED and only
 * applies the discount in SEPARATE mode — the opposite of what the mode names
 * suggest, and almost certainly a latent AOS inconsistency. `getDiscountedPrice`
 * applies the discount in every mode the price is meant to be folded, matching
 * how an actual order/invoice line is priced. A consumer that must reproduce
 * the bare-product `getSaleUnitPrice` number bit-for-bit (quirk included)
 * should compose the primitives directly rather than call `getDiscountedPrice`.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Known differences vs AOS (precision only — the logic is identical)
 * ──────────────────────────────────────────────────────────────────────
 * - Arithmetic is float64 instead of BigDecimal. The fixed-amount discount
 *   branch of `computeDiscount` rounds to AOS's DISCOUNT_SCALE (20) — past
 *   float64's precision, so it is a no-op here and omitted; the percentage
 *   branch rounds to the unit-price scale exactly as AOS does.
 * - The sale-order-TEMPLATE manual-discount comparison (where a larger
 *   hand-entered discount overrides the price-list one) is out of scope — it
 *   is sale-order-line UI logic, not part of pricing a product for a buyer.
 */

import type {DecimalLike} from './pricing';
import {convertUnitPrice, round} from './pricing';

/* ──────────────────────────────────────────────────────────────────────
 * AOS enum constants (PriceListLineRepository / AppBaseRepository)
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

/** `AppBase.computeMethodDiscountSelect` — whether a matched discount is
 *  folded into the unit price or surfaced as a separate discount. */
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
 *  unit prices (and percentage discounts) are rounded to. Configurable in
 *  AOS; defaults to 2. Callers pass their configured value. */
export const DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE = 2;

/* ──────────────────────────────────────────────────────────────────────
 * Input types — the minimum shape each computation needs.
 * ────────────────────────────────────────────────────────────────────── */

/** One price-list line. The product / category / price-list associations
 *  are resolved by the caller's fetch (it passes the lines already scoped
 *  to a price list and to a product or category); this module only needs
 *  the rule itself. */
export type PricingPriceListLine = {
  /** `PRICE_LIST_LINE_TYPE` — discount / increase / replace. Nullable in
   *  the schema; a null (or unknown) type falls through to "no change",
   *  exactly as the AOS switch defaults do. */
  typeSelect: number | null;
  /** `AMOUNT_TYPE` — percent / fixed / none. Nullable; treated as NONE. */
  amountTypeSelect: number | null;
  amount: DecimalLike | null;
  /** The quantity from which this line applies; treated as 0 when null. */
  minQty: DecimalLike | null;
};

/** A price list. Its general discount is a percentage (e.g. 5 → 5%); the
 *  date window and active flag drive `getDefaultPriceList`. */
export type PricingPriceList = {
  generalDiscount: DecimalLike | null;
  isActive: boolean | null;
  /** `YYYY-MM-DD`; null means open-ended. */
  applicationBeginDate: string | null;
  applicationEndDate: string | null;
};

/** A resolved discount: the amount, the unit it is expressed in
 *  (`AMOUNT_TYPE`), and — when the compute method folded it in — the
 *  already-discounted `price`. */
export type ResolvedDiscount = {
  discountTypeSelect: number;
  discountAmount: number;
  /** The discounted unit price, set only when the discount was folded into
   *  the price (see `getReplacedPriceAndDiscounts`); otherwise null. */
  price: number | null;
};

/* ──────────────────────────────────────────────────────────────────────
 * Discount primitives (PriceListService)
 * ────────────────────────────────────────────────────────────────────── */

/** The discount's unit, i.e. the line's `amountTypeSelect`
 *  (`PriceListService.getDiscountTypeSelect`); a null type reads as NONE. */
export function getDiscountTypeSelect(line: PricingPriceListLine): number {
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
  line: PricingPriceListLine,
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
  line: PricingPriceListLine,
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

/** The unit price after a price list's flat general discount (a
 *  percentage), mirroring the `PriceListService.getUnitPriceDiscounted(
 *  PriceList, …)` overload: `unitPrice × (1 − generalDiscount/100)`. */
export function getUnitPriceDiscountedByGeneralDiscount(
  priceList: PricingPriceList,
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

/** Resolves a line (or, when there is none, the price list's general
 *  discount) into a discount amount + type (`PriceListService.getDiscounts`).
 *  The amount is rounded to the unit-price scale, as AOS does.
 *
 *  - with a line: the signed `getDiscountAmount`, typed by the line's
 *    `amountTypeSelect`;
 *  - without a line: the general discount as a percentage — type PERCENT,
 *    or NONE when it is zero. */
export function getDiscounts(
  priceList: PricingPriceList,
  line: PricingPriceListLine | null,
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

/** Resolves a discount and, depending on the compute method, optionally
 *  folds it straight into the price
 *  (`PriceListService.getReplacedPriceAndDiscounts`):
 *
 *  - INCLUDE, or INCLUDE_REPLACE_ONLY on a REPLACE line → apply the
 *    discount now, return the discounted `price` and report the residual
 *    discount as NONE / 0;
 *  - otherwise (SEPARATE) → leave `price` null and return the discount so
 *    the caller can surface it as a separate field. */
export function getReplacedPriceAndDiscounts(
  priceList: PricingPriceList,
  line: PricingPriceListLine | null,
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
 *  `minQty` the quantity reaches, ordered by `minQty` descending; or — when
 *  the product has none — the product category's, the same way. Callers
 *  pass each list already scoped to the right price list + product /
 *  category; this applies the `minQty <= qty` filter and the ordering. */
export function getPriceListLineList<L extends PricingPriceListLine>(
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
export function getPriceListLine<L extends PricingPriceListLine>(
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
 *  attached to the buyer (already filtered to the wanted type), keep the
 *  active ones whose `[applicationBeginDate, applicationEndDate]` window
 *  contains today. Returns the sole survivor, or `null` if zero — or more
 *  than one — qualify (AOS treats an ambiguous set as no price list). */
export function getDefaultPriceList<P extends PricingPriceList>(
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
 *  best line for the product/category at this quantity, resolve the
 *  discount, and return the folded-in price when the compute method folds
 *  it (INCLUDE / INCLUDE_REPLACE_ONLY), or the price unchanged otherwise
 *  (SEPARATE — the discount is meant to be shown separately).
 *
 *  `price` is the catalogue unit price in the PRODUCT's own tax basis, as
 *  the line amounts are; a caller needing the result in the other basis
 *  converts around this call. */
export function getDiscountedPrice<L extends PricingPriceListLine>({
  priceList,
  productLines,
  categoryLines,
  qty,
  price,
  computeMethodDiscountSelect,
  nbDecimalForUnitPrice = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
}: {
  priceList: PricingPriceList;
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

/** The billable line totals — what you'd actually charge — mirroring
 *  `SaleOrderLineComputeServiceImpl.computeValues`.
 *
 *  A line stores a unit price (`wt`/`ati`) and, under SEPARATE, a residual
 *  discount (`discountTypeSelect`/`discountAmount`); INCLUDE folds the
 *  discount into the unit price and leaves the residual at NONE / 0. Either
 *  way the total is built the same: discount the unit price in the order's
 *  PRIMARY basis (`computeDiscount`, the no-op identity under INCLUDE), take
 *  `× qty` rounded to the CURRENCY's decimals, and gross/net the other basis
 *  off the tax rate — also rounded to the currency.
 *
 *  `taxRate` is a percentage (e.g. 20 for 20%), matching
 *  `getTotalTaxRateInPercentage`; AOS divides it by 100 here. The returned
 *  `priceDiscounted` is the discounted unit price in the primary basis, as
 *  AOS stores it on the line.
 *
 *  Unlike `getDiscountedPrice` (a unit price), this is the LINE amount: pass
 *  the buyer's resolved discount and quantity, and charge `inTaxTotal`. */
export function getLineTotal({
  wt,
  ati,
  discountTypeSelect,
  discountAmount,
  qty,
  taxRate,
  inAti,
  currencyDecimals,
  nbDecimalForUnitPrice = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
}: {
  /** The line's unit prices (WT / ATI), as stored — already folded under
   *  INCLUDE, catalogue under SEPARATE. */
  wt: number;
  ati: number;
  /** The residual price-list discount (`AMOUNT_TYPE`); NONE under INCLUDE. */
  discountTypeSelect: number;
  discountAmount: number;
  qty: DecimalLike;
  /** Total tax rate as a PERCENTAGE (e.g. 20), per
   *  `getTotalTaxRateInPercentage`. */
  taxRate: number;
  /** The order's tax-basis orientation (`saleOrder.inAti`): which basis is
   *  the primary the total is computed from, the other being derived. */
  inAti: boolean;
  /** The order currency's `numberOfDecimals` — the scale the totals round to. */
  currencyDecimals: number;
  nbDecimalForUnitPrice?: number;
}): {exTaxTotal: number; inTaxTotal: number; priceDiscounted: number} {
  const quantity = Number(qty);
  const primary = inAti ? ati : wt;
  const priceDiscounted = computeDiscount(
    primary,
    discountTypeSelect,
    discountAmount,
    nbDecimalForUnitPrice,
  );
  const rate = taxRate / 100;
  let exTaxTotal: number;
  let inTaxTotal: number;
  if (!inAti) {
    exTaxTotal = round(quantity * priceDiscounted, currencyDecimals);
    inTaxTotal = round(exTaxTotal * (1 + rate), currencyDecimals);
  } else {
    inTaxTotal = round(quantity * priceDiscounted, currencyDecimals);
    exTaxTotal = round(inTaxTotal / (1 + rate), currencyDecimals);
  }
  return {exTaxTotal, inTaxTotal, priceDiscounted};
}

/** A LITERAL port of `ProductPriceListServiceImpl.applyPriceList` — the
 *  final step of the product-price REST path
 *  (`ProductPriceServiceImpl.getSaleUnitPrice`, behind `/ws/aos/product/
 *  price`). Use this — not `getDiscountedPrice` — when you must reproduce
 *  that endpoint's number bit-for-bit.
 *
 *  AOS gates this on the BUYER, not the price list: with no buyer
 *  (`partnerPresent: false`) the price is returned untouched; with a buyer it
 *  ALWAYS runs, even when no price list applies. That matters because the
 *  discount is defined in the product's own tax basis, so whenever the
 *  requested `targetInAti` differs from `productInAti` the price is converted
 *  to the product basis and back (`taxRate` drives it) — and because each leg
 *  re-rounds to `nbDecimalForUnitPrice`, this round-trip alone can shift the
 *  price by a cent EVEN WITH NO DISCOUNT. (e.g. a WT-stored product priced ATI
 *  in a foreign currency: 433.05 → /1.2 → 360.88 → ×1.2 → 433.06.) Omitting
 *  the round-trip — or skipping it when there's no price list — diverges from
 *  the endpoint.
 *
 *  The discount itself reproduces AOS's quirk (see the header): only the
 *  amount/type are read back from the resolved map and re-applied via
 *  `computeDiscount`, so a discount moves the price only in SEPARATE mode. A
 *  null `priceList` means no discount (the round-trip still runs).
 *
 *  Why mirror this rather than "fix" it? Because it is the number the quick-
 *  price endpoint returns, and matching that endpoint is this function's whole
 *  job. But be clear about what it is NOT: it is the ENDPOINT's number, NOT the
 *  invoiced one — the two genuinely differ. The round-trip is arguably an AOS
 *  defect: it re-rounds each leg to `nbDecimalForUnitPrice`, whereas AOS's own
 *  `getConvertedPrice` does the very same WT↔ATI conversion at
 *  COMPUTATION_SCALING (20 dp), and it runs even with no discount, so the same
 *  product quotes a cent differently with vs without a buyer. The actual
 *  sale-order / invoice line never comes through here: it prices via the
 *  taxLineSet `getSaleUnitPrice` → `getConvertedPrice` overload (no
 *  `applyPriceList`) and applies the price list with
 *  `SaleOrderLineDiscountServiceImpl` (honouring the folded price, so INCLUDE-
 *  mode discounts apply — which this path no-ops).
 *
 *  Verified empirically on live AOS for Laser Printer in GBP (€429 WT, 20%):
 *  this endpoint returns ATI 433.06; an order created via POST /ws/aos/sale-
 *  order stores inTaxPrice 433.04 (it grosses up the ROUNDED WT, 360.87×1.2);
 *  a clean single-round conversion is 433.05 — three paths, three numbers. So
 *  a consumer that wants the INVOICED price must NOT use this; use
 *  `getConvertedPrice` (+ `getDiscountedPrice` for discounts). Endpoint parity
 *  itself is confirmed (748/748 + 540/540, `scripts/test-price`); the
 *  endpoint↔invoice gap is an AOS bug worth reporting upstream. */
export function applyPriceList<L extends PricingPriceListLine>({
  price,
  productInAti,
  targetInAti,
  taxRate,
  partnerPresent,
  priceList,
  productLines,
  categoryLines,
  qty = 1,
  computeMethodDiscountSelect,
  nbDecimalForUnitPrice = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
}: {
  price: number;
  /** The product's stored tax basis (`product.inAti`). */
  productInAti: boolean;
  /** The basis `price` is expressed in / wanted back in. */
  targetInAti: boolean;
  /** Total tax percentage, for the basis round-trip. */
  taxRate: number;
  /** Whether a buyer is identified. AOS returns the price unchanged when
   *  there is none (`partner == null`); otherwise it runs in full. */
  partnerPresent: boolean;
  /** The buyer's applicable price list, or null when none applies (the
   *  basis round-trip still runs; only the discount is skipped). */
  priceList: PricingPriceList | null;
  productLines: readonly L[];
  categoryLines?: readonly L[] | null;
  qty?: DecimalLike;
  computeMethodDiscountSelect: number;
  nbDecimalForUnitPrice?: number;
}): number {
  if (!partnerPresent) return price;

  const differingBasis = productInAti !== targetInAti;
  let working = differingBasis
    ? convertUnitPrice(targetInAti, taxRate, price, nbDecimalForUnitPrice)
    : price;

  /* fillDiscount keeps only the amount + type from the resolved map (and
   * discards its folded price); computeDiscount then re-applies them. With no
   * price list AOS's fillDiscount yields NONE / 0, so computeDiscount is a
   * no-op — but the basis round-trip above/below still happens. */
  let discountTypeSelect: number = AMOUNT_TYPE.NONE;
  let discountAmount = 0;
  if (priceList != null) {
    const line = getPriceListLine(productLines, categoryLines, qty, working);
    const discounts = getReplacedPriceAndDiscounts(
      priceList,
      line,
      working,
      computeMethodDiscountSelect,
      nbDecimalForUnitPrice,
    );
    discountTypeSelect = discounts.discountTypeSelect;
    discountAmount = discounts.discountAmount;
  }
  working = computeDiscount(
    working,
    discountTypeSelect,
    discountAmount,
    nbDecimalForUnitPrice,
  );

  return differingBasis
    ? convertUnitPrice(productInAti, taxRate, working, nbDecimalForUnitPrice)
    : working;
}
