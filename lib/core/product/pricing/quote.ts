/* The one-call composition: price a product for a buyer end to end and return
 * a single object usable for BOTH display and charging. It chains the catalogue
 * unit price → invoice-style rounding → the buyer's price-list discount → the
 * billable line total, the same pipeline an order/invoice line follows.
 *
 * Not a 1:1 AOS port but the sequence AOS runs to price a sale-order line (the
 * `getProductInformation` onchange, `SaleOrderLineController.computeLineFromProduct`):
 * `SaleOrderLinePriceServiceImpl.getUnitPrice` (→ `ProductPriceServiceImpl
 * .getSaleUnitPrice`) → the discount fill (`SaleOrderLineDiscountServiceImpl`) →
 * `SaleOrderLineComputeServiceImpl.computeValues`. Each step's exact mirror is
 * documented on the underlying function it calls (`catalogue`/`tax`/`discount`/
 * `line-total`).
 *
 * Strict — it throws `PriceComputationError` like the rest of the core;
 * degradation (untaxed fallback, currency cascade) is the caller's job. A
 * storefront wraps this with its own lenient policy and product fetch; the
 * parity test wraps it to compare against AOS. */

import type {BigDecimal} from '@goovee/orm';

import {AMOUNT_TYPE, DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE} from './types';
import type {
  ConversionLine,
  Currency,
  FiscalPositionInput,
  PriceableProduct,
  PriceListLineRow,
  PriceListRow,
  UnitConversionRow,
} from '../orm';
import {convertUnitPrice} from './tax';
import {ONE, resolveProductField, scaled, ZERO} from './util';
import {getSaleUnitPrice} from './catalogue';
import {getPriceListLine, getReplacedPriceAndDiscounts} from './discount';
import {getLineTotal} from './line-total';

/** A price-list discount surfaced for display, present ONLY when the compute
 *  method keeps it separate from the unit price (SEPARATE, or non-replace lines
 *  under INCLUDE_REPLACE_ONLY). When the discount is folded into the unit price
 *  this is null — there is no badge to show. */
export type QuoteDiscount = {type: 'percent' | 'fixed'; amount: number};

export type Quote = {
  /** The target currency the quote is expressed in — the `Currency` row the
   *  caller passed (`codeISO`, `numberOfDecimals`, and the printing
   *  `code`/`symbol` for display). */
  currency: Currency;
  /** The unit the price is expressed in: the requested unit, or the product's
   *  own sale unit (`salesUnit ?? unit`). Only the id — the core never sees a
   *  unit's display name; the caller maps it. `null` only when no unit was
   *  requested AND the product carries none. */
  unitId: string | null;
  qty: number;
  /** Total tax rate as a percentage (e.g. 20 for 20%). */
  taxRate: number;
  /** The headline per-unit price to display: the discounted price when the
   *  compute method folds it in, the catalogue price otherwise. */
  unitPrice: {wt: number; ati: number};
  /** The separate discount to display, or null when none / folded in. When
   *  present, the UI shows `unitPrice` struck through and the line total as the
   *  real price; when null, `unitPrice` IS the price. */
  discount: QuoteDiscount | null;
  /** The discounted per-unit price in the order's primary basis — for an
   *  "€X/unit × qty" breakdown. */
  priceDiscounted: number;
  /** The billable line totals. Charge `inTaxTotal`. */
  exTaxTotal: number;
  inTaxTotal: number;
};

/** Price a product for a buyer, returning everything needed to display the line
 *  and to charge for it.
 *
 *  Pass the buyer's resolved price list (`getDefaultPriceList`) and ALL its
 *  lines (`priceListLines`); this partitions product- vs category-lines the way
 *  AOS's two queries do, using the product's own `productCategory`. `inAti` is
 *  the order's primary tax basis. Pass `requestedUnit` (+ `unitConversions`) to
 *  quote in a unit other than the product's sale unit (COEFF conversions only;
 *  endpoint semantics — see `catalogue.ts`). */
export function quoteProductPrice({
  product,
  company,
  fiscalPosition,
  toCurrency,
  conversionLines,
  companySpecificProductFields,
  priceList,
  priceListLines,
  computeMethodDiscountSelect,
  inAti,
  qty = ONE,
  requestedUnit,
  unitConversions,
  nbDecimalForUnitPrice = DEFAULT_NB_DECIMAL_FOR_UNIT_PRICE,
}: {
  product: PriceableProduct;
  company: {id: string; timezone?: string | null} | null;
  fiscalPosition: FiscalPositionInput | null | undefined;
  toCurrency: Currency;
  conversionLines: readonly ConversionLine[];
  companySpecificProductFields: readonly string[];
  /** The buyer's applicable price list, or null when there is no buyer / no
   *  list. */
  priceList: PriceListRow | null;
  /** All lines of the price list; partitioned per product/category here. */
  priceListLines: readonly PriceListLineRow[];
  computeMethodDiscountSelect: number;
  /** The order's tax-basis orientation (`saleOrder.inAti`). */
  inAti: boolean;
  qty?: BigDecimal;
  requestedUnit?: {id: string} | null;
  unitConversions?: readonly UnitConversionRow[];
  nbDecimalForUnitPrice?: number;
}): Quote {
  const nb = nbDecimalForUnitPrice;

  /* The PRODUCT's own basis is the one a line prices, discounts and stores in;
   * the order's `inAti` only decides which stored side drives the totals. AOS
   * reads the flag straight off the product for this
   * (`SaleOrderLineProductServiceImpl` branches on `product.getInAti()`), so read
   * it the same way — honouring the per-company override rows. */
  const productInAti = Boolean(
    resolveProductField(
      product,
      'inAti',
      company?.id,
      companySpecificProductFields,
    ),
  );

  const result = getSaleUnitPrice({
    product,
    company,
    fiscalPosition,
    resultInAti: productInAti,
    toCurrency,
    conversionLines,
    companySpecificProductFields,
    nbDecimalForUnitPrice: nb,
    ...(requestedUnit ? {requestedUnit, unitConversions} : {}),
  });

  /* Everything up to the derived basis happens in the product's basis. */
  let primary = result.price;

  /* Resolve the buyer's discount the way the SO-line fill step does. INCLUDE
   * folds it into the unit price (price set); SEPARATE leaves the catalogue
   * price and reports the residual discount, which the line total applies. */
  let discountTypeSelect: number = AMOUNT_TYPE.NONE;
  let discountAmount = ZERO;
  let discount: QuoteDiscount | null = null;
  if (priceList) {
    /* Partition the list's lines into this product's vs its category's — the
     * two scopes AOS's `getPriceListLineList` queries. */
    const productLines = priceListLines.filter(
      line => line.product?.id === product.id,
    );
    const categoryLines = product.productCategory?.id
      ? priceListLines.filter(
          line => line.productCategory?.id === product.productCategory?.id,
        )
      : [];
    const line = getPriceListLine(productLines, categoryLines, qty, primary);
    const discounts = getReplacedPriceAndDiscounts(
      priceList,
      line,
      primary,
      computeMethodDiscountSelect,
      nb,
    );
    discountTypeSelect = discounts.discountTypeSelect;
    discountAmount = discounts.discountAmount;
    primary = scaled(discounts.price ?? primary, nb);

    /* A residual FIXED discount is money in the product's basis, and the totals
     * are computed in the order's — so re-express it when the two differ, as
     * `SaleOrderLineDiscountServiceImpl.fillDiscount` does. A percentage is
     * dimensionless and needs no conversion. */
    if (
      productInAti !== inAti &&
      discountTypeSelect !== AMOUNT_TYPE.NONE &&
      discountTypeSelect !== AMOUNT_TYPE.PERCENT
    ) {
      discountAmount = convertUnitPrice(
        productInAti,
        result.taxRate,
        discountAmount,
        nb,
      );
    }

    /* A residual discount (SEPARATE) is the display label; a folded one
     * (INCLUDE) is already in `unitPrice`, so no badge. */
    if (discountTypeSelect !== AMOUNT_TYPE.NONE) {
      discount = {
        type: discountTypeSelect === AMOUNT_TYPE.PERCENT ? 'percent' : 'fixed',
        amount: discountAmount.toNumber(),
      };
    }
  }

  /* The other basis is derived from the product-basis price, after the discount
   * — never rounded independently. */
  const wt = productInAti
    ? convertUnitPrice(true, result.taxRate, primary, nb)
    : primary;
  const ati = productInAti
    ? primary
    : convertUnitPrice(false, result.taxRate, primary, nb);

  const {exTaxTotal, inTaxTotal, priceDiscounted} = getLineTotal({
    wt,
    ati,
    discountTypeSelect,
    discountAmount,
    qty,
    taxRate: result.taxRate,
    inAti,
    currencyDecimals: toCurrency.numberOfDecimals ?? nb,
    nbDecimalForUnitPrice: nb,
  });

  /* The quote is the core's outer edge, so the values convert to `number` here.
   * Each has few enough significant decimals to survive that: the money fields
   * were rounded above, `priceDiscounted` stays at the unit-price scale in every
   * branch — rounded there, or a difference of two values already there — and
   * `taxRate`/`qty` are returned as supplied. A wide decimal would NOT survive:
   * `.toNumber()` keeps about 15 significant digits. Callers doing further
   * arithmetic on money should come back through the core rather than build on
   * these. */
  return {
    currency: toCurrency,
    unitId: result.unitId,
    qty: qty.toNumber(),
    taxRate: result.taxRate.toNumber(),
    unitPrice: {wt: wt.toNumber(), ati: ati.toNumber()},
    discount,
    priceDiscounted: priceDiscounted.toNumber(),
    exTaxTotal: exTaxTotal.toNumber(),
    inTaxTotal: inTaxTotal.toNumber(),
  };
}
