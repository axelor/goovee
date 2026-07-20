/* The billable line totals — what you'd actually charge — a port of AOS
 * `SaleOrderLineComputeServiceImpl.computeValues`. */

import type {DecimalLike} from './types';
import {DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE} from './types';
import {round} from './util';
import {computeDiscount} from './discount';

/** The billable line totals.
 *
 *  A line stores a unit price (`wt`/`ati`) and, under SEPARATE, a residual
 *  discount (`discountTypeSelect`/`discountAmount`); INCLUDE folds the discount
 *  into the unit price and leaves the residual at NONE / 0. Either way the
 *  total is built the same: discount the unit price in the order's PRIMARY
 *  basis (`computeDiscount`, the no-op identity under INCLUDE), take `× qty`
 *  rounded to the CURRENCY's decimals, and gross/net the other basis off the
 *  tax rate — also rounded to the currency.
 *
 *  `taxRate` is a percentage (e.g. 20 for 20%), matching
 *  `getTotalTaxRateInPercentage`; AOS divides it by 100 here. The returned
 *  `priceDiscounted` is the discounted unit price in the primary basis, as AOS
 *  stores it on the line.
 *
 *  Unlike `getDiscountedPrice` (a unit price), this is the LINE amount: pass the
 *  buyer's resolved discount and quantity, and charge `inTaxTotal`. */
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
  /** The order's tax-basis orientation (`saleOrder.inAti`): which basis is the
   *  primary the total is computed from, the other being derived. */
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
