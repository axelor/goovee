/* The product-price ENDPOINT's price-list step — a literal port of
 * `ProductPriceListServiceImpl.applyPriceList`, kept separate from the invoice
 * path because it reproduces an AOS quirk on purpose. Currently uncalled; kept
 * as the offline reference for the endpoint's exact number. */

import type {DecimalLike} from './types';
import type {PriceListLineRow, PriceListRow} from '../orm';
import {AMOUNT_TYPE, DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE} from './types';
import {convertUnitPrice} from './tax';
import {
  computeDiscount,
  getPriceListLine,
  getReplacedPriceAndDiscounts,
} from './discount';

/** A LITERAL port of `ProductPriceListServiceImpl.applyPriceList` — the final
 *  step of the product-price REST path
 *  (`ProductPriceServiceImpl.getSaleUnitPrice`, behind `/ws/aos/product/
 *  price`). Use this — not `getDiscountedPrice` — when you must reproduce that
 *  endpoint's number bit-for-bit.
 *
 *  AOS gates this on the BUYER, not the price list: with no buyer
 *  (`partnerPresent: false`) the price is returned untouched; with a buyer it
 *  ALWAYS runs, even when no price list applies. That matters because the
 *  discount is defined in the product's own tax basis, so whenever the
 *  requested `targetInAti` differs from `productInAti` the price is converted to
 *  the product basis and back (`taxRate` drives it) — and because each leg
 *  re-rounds to `nbDecimalForUnitPrice`, this round-trip alone can shift the
 *  price by a cent EVEN WITH NO DISCOUNT. (e.g. a WT-stored product priced ATI
 *  in a foreign currency: 433.05 → /1.2 → 360.88 → ×1.2 → 433.06.) Omitting the
 *  round-trip — or skipping it when there's no price list — diverges from the
 *  endpoint.
 *
 *  The discount itself reproduces AOS's quirk: only the amount/type are read
 *  back from the resolved map and re-applied via `computeDiscount`, so a
 *  discount moves the price only in SEPARATE mode. A null `priceList` means no
 *  discount (the round-trip still runs).
 *
 *  Why mirror this rather than "fix" it? Because it is the number the
 *  quick-price endpoint returns, and matching that endpoint is this function's
 *  whole job. But be clear about what it is NOT: it is the ENDPOINT's number,
 *  NOT the invoiced one — the two genuinely differ. The round-trip is arguably
 *  an AOS defect: it re-rounds each leg to `nbDecimalForUnitPrice`, whereas
 *  AOS's own `getConvertedPrice` does the very same WT↔ATI conversion at
 *  COMPUTATION_SCALING (20 dp), and it runs even with no discount, so the same
 *  product quotes a cent differently with vs without a buyer. The actual
 *  sale-order / invoice line never comes through here: it prices via the
 *  taxLineSet `getSaleUnitPrice` → `getConvertedPrice` overload (no
 *  `applyPriceList`) and applies the price list with
 *  `SaleOrderLineDiscountServiceImpl` (honouring the folded price, so
 *  INCLUDE-mode discounts apply — which this path no-ops).
 *
 *  Verified empirically on live AOS for Laser Printer in GBP (€429 WT, 20%):
 *  this endpoint returns ATI 433.06; an order created via POST /ws/aos/sale-
 *  order stores inTaxPrice 433.04 (it grosses up the ROUNDED WT, 360.87×1.2); a
 *  clean single-round conversion is 433.05 — three paths, three numbers. So a
 *  consumer that wants the INVOICED price must NOT use this; use
 *  `getConvertedPrice` (+ `getDiscountedPrice` for discounts). Endpoint parity
 *  itself is confirmed (`scripts/test-price`); the endpoint↔invoice gap is an
 *  AOS bug worth reporting upstream. */
export function applyPriceList<L extends PriceListLineRow>({
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
  /** Whether a buyer is identified. AOS returns the price unchanged when there
   *  is none (`partner == null`); otherwise it runs in full. */
  partnerPresent: boolean;
  /** The buyer's applicable price list, or null when none applies (the basis
   *  round-trip still runs; only the discount is skipped). */
  priceList: PriceListRow | null;
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
