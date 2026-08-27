# Pricing — app composition guide

This is a how-to for app developers: **which core functions to call to build a
pricing feature, and in what order.** It does not explain how those functions
work inside — for that, read `PRICING.md`.

How the pieces fit:

- You load your product with **your own** query — just spread
  `productPriceSelectFields` into it so the row carries the price fields.
- Each recipe below fetches the extra data the core needs (taxes, currencies,
  price lists, …) using helpers from `@/product/orm`, then calls the pricing
  functions from `@/product/pricing`.

The core **throws** `PriceComputationError` when configuration is missing (no
tax, no exchange rate, …). What you do with it depends on who's looking:

- a **customer-facing page** must not break — catch the error and fall back
  (show the price untaxed, or try another currency);
- an **internal / admin screen** can let it surface, so whoever can fix the
  misconfiguration actually sees it.

---

## Which entry point?

| You have…                                         | Call                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| a product, priced from its own `salePrice`        | `getSaleUnitPrice` (unit price), or `quoteProductPrice` (display + charge) |
| a price **you** own (a listing / frozen override) | `getConvertedPrice` + compose the discount/total yourself (Recipe 2/3)     |

`quoteProductPrice` reads `salePrice` off the product — it has **no override
parameter**, so for a price you own, use the primitives (Recipe 2/3), not
`quote`.

---

## Recipe 1 — price a product for a buyer, end to end (display + charge)

One call. Use when you have a real product and a (possibly null) buyer.

```ts
import {
  productPriceSelectFields,
  findPartnerFiscalPosition,
  fetchConversionLines,
  findCompanySpecificProductFields,
  findPartnerSalePriceLists,
  fetchPriceListLines,
  fetchUnitConversions,
} from '@/product/orm';
import {getDefaultPriceList, quoteProductPrice} from '@/product/pricing';
import {BigDecimal} from '@goovee/orm';

// 1. the product — fetched by YOUR query, spreading the core fragment
const product = await client.aOSProduct.findOne({
  where: {id: productId},
  select: {name: true, /* …your page fields… */ ...productPriceSelectFields},
});

// 2. side data the core needs (batch these once per request)
const [fiscalPosition, companySpecificProductFields, priceLists] =
  await Promise.all([
    findPartnerFiscalPosition({client, mainPartnerId}),
    findCompanySpecificProductFields(client),
    findPartnerSalePriceLists({client, mainPartnerId}), // buyer route
  ]);
const today = /* todayInTimezone(company.timezone) */ '2026-06-05';
const priceList = getDefaultPriceList(priceLists, today); // null when none/ambiguous
const priceListLines = priceList
  ? await fetchPriceListLines(client, priceList.id)
  : [];
const conversionLines = await fetchConversionLines({
  client,
  fromCodes: [product.saleCurrency?.codeISO],
  toCodes: [toCurrency.codeISO],
});

// 3. compute
const quote = quoteProductPrice({
  product,
  company: {id: companyId, timezone},
  fiscalPosition,
  toCurrency, // a Currency row (findCurrencyByCodeISO / the buyer's currency)
  conversionLines,
  companySpecificProductFields,
  priceList, // PriceListRow | null
  priceListLines, // all the list's lines; quote partitions per product/category
  computeMethodDiscountSelect, // from AppBase
  inAti, // the order's tax-basis orientation
  qty: BigDecimal.valueOf('1'), // amounts and quantities are decimals
  nbDecimalForUnitPrice, // from AppBase (default 2) — scales stay numbers
  // requestedUnit + unitConversions — only if quoting in another unit (Recipe 4)
});
```

`quote` gives you everything for the line:

```ts
quote.unitPrice; // {wt, ati} — the headline per-unit price to show
quote.discount; // {type:'percent'|'fixed', amount} | null  (see Display rules)
quote.exTaxTotal;
quote.inTaxTotal; // ← CHARGE THIS (ATI). Sum across cart lines for the order.
quote.currency; // the Currency row (codeISO/symbol/…) you passed back
quote.unitId; // the unit the price is in — id only; map it to a name yourself
```

---

## Recipe 2 — price an owned / override price (e.g. a marketplace listing)

The price/`inAti`/currency are yours; the product supplies only the **tax
setup**. `marketplace`'s `computePrice` follows this shape, though it calls
`computeWtAti` + `getExchangeRate` itself rather than `getConvertedPrice`, because
it cascades through several display currencies.

```ts
import {
  convertUnitPrice,
  getSaleTaxLineSet,
  getTotalTaxRateInPercentage,
  getConvertedPrice,
  PriceComputationError,
  toDecimalOrNull,
  ZERO,
  type ResolvedTaxLine,
} from '@/product/pricing';

// tax from the product (lenient: a broken tax config degrades to 0%)
let taxLineSet: ResolvedTaxLine[];
try {
  taxLineSet = getSaleTaxLineSet({product, companyId, fiscalPosition, today});
} catch (e) {
  if (!(e instanceof PriceComputationError)) throw e;
  taxLineSet = []; // 0% — storefront policy, not the core's
}
/* This catch does NOT cover a total rate of exactly -100%: that raises an uncoded
 * Error from the ATI->WT divide below. Guard `taxFactor(rate)` against zero as
 * well if the page must render on corrupt data. */

const taxRate = getTotalTaxRateInPercentage(taxLineSet);

/* Price the values you own, in the basis you own. This returns ONE amount — the
 * single number AOS returns — already rounded to `nbDecimalForUnitPrice`. An ORM
 * decimal column becomes a BigDecimal here. */
const primary = getConvertedPrice({
  price: toDecimalOrNull(listing.salePrice) ?? ZERO, // YOUR price
  sourceInAti: listing.inAti, // YOUR basis
  resultInAti: listing.inAti, // give it back in that same basis
  taxLineSet,
  fromCurrency: listing.saleCurrency, // YOUR currency
  toCurrency, // display currency (your cascade decides which)
  conversionLines,
  today,
  nbDecimalForUnitPrice,
});

// the other basis is DERIVED from the rounded one, never rounded on its own
const wt = listing.inAti
  ? convertUnitPrice(true, taxRate, primary, nbDecimalForUnitPrice)
  : primary;
const ati = listing.inAti
  ? primary
  : convertUnitPrice(false, taxRate, primary, nbDecimalForUnitPrice);
```

Deriving the second basis rather than asking for it is the invoice's own rule, and
it matters: two calls with `resultInAti` false and true round each basis
independently, which is what AOS's quick-price endpoint does — and its pair can
then contradict itself, its ATI not being its own WT re-expressed. That is one of
two reasons the endpoint's figure and the invoiced one drift apart; the other is
the basis round-trip inside `applyPriceList`, which — for a buyer request whose
basis differs from the product's — can shift a cent even with no discount (see
`apply-price-list.ts`). If you already hold both bases unrounded —
from `computeWtAti` — `roundSaleUnitPrice` performs this same round-the-primary,
derive-the-other step for you.

The viewer→default→listing **currency cascade** and the broken-tax fallback are
**app policy** — layer them around these calls; the core stays strict.

---

## Recipe 3 — apply a price-list discount to an owned price

Add a discount on top of Recipe 2 (a buyer price list, or a marketplace-wide
promo). The engine is **buyer-agnostic** — only _how you get the list_ differs.

This is `quoteProductPrice` hand-assembled: the same sequence, around a price the
product doesn't own. It continues from Recipe 2 and uses its `primary` (the price
in the listing's own basis) and `taxRate`; when no discount folds in, the pair
derived at the end is Recipe 2's `wt` / `ati` again.

```ts
import {
  AMOUNT_TYPE,
  convertUnitPrice,
  getDefaultPriceList,
  getPriceListLine,
  getReplacedPriceAndDiscounts,
  getLineTotal,
  scaled,
  ZERO,
  type ResolvedDiscount,
} from '@/product/pricing';
import {findPartnerSalePriceLists, fetchPriceListLines} from '@/product/orm';
import {BigDecimal} from '@goovee/orm';

const qty = BigDecimal.valueOf('1'); // quantities are decimals too

/* Get the applicable list. Buyer route (per-partner, native) below; for a general
 * or promo list, fetch the ONE config-designated list yourself and pass it as
 * `getDefaultPriceList([thatList], today)` — the app owns the overlap rules. */
const priceList = getDefaultPriceList(
  await findPartnerSalePriceLists({client, mainPartnerId}),
  today,
);

// no applicable list → no discount; the total below still needs these fields
let discount: ResolvedDiscount = {
  price: null,
  discountTypeSelect: AMOUNT_TYPE.NONE,
  discountAmount: ZERO,
};

if (priceList) {
  const lines = await fetchPriceListLines(client, priceList.id);

  // match this row's product/category (the price you discount is the OWNED one)
  const productLines = lines.filter(
    listLine => listLine.product?.id === product.id,
  );
  const categoryLines = product.productCategory?.id
    ? lines.filter(
        listLine =>
          listLine.productCategory?.id === product.productCategory?.id,
      )
    : [];
  /* Discount in the basis the PRICE is stored in — `primary` from Recipe 2, the
   * listing's own. That is where an admin typed a fixed amount, and it is the basis
   * a line stores; the order's `inAti` only decides which side drives the totals.
   * `quoteProductPrice` reads the flag off the product for the same reason (AOS
   * branches on `product.inAti`). */
  const line = getPriceListLine(productLines, categoryLines, qty, primary);

  discount = getReplacedPriceAndDiscounts(
    priceList,
    line,
    primary,
    computeMethodDiscountSelect,
    nbDecimalForUnitPrice,
  );
  /* `discount.price` non-null → folded into the unit price (INCLUDE / replace), so
   * show that as the price; otherwise `discountTypeSelect`/`discountAmount` is the
   * separate discount to display.
   *
   * A FIXED fold comes back at the wide discount scale — same value, twenty
   * decimals — so normalise it with `scaled(price, nbDecimalForUnitPrice)` before
   * showing it, and the returned `priceDiscounted` too when the two bases coincide.
   * The totals are rounded to the currency and never affected. */

  /* A residual FIXED amount is money in the listing's basis while the totals are
   * computed in the order's, so re-express it when the two differ — the step
   * `SaleOrderLineDiscountServiceImpl.fillDiscount` performs. A percentage is
   * dimensionless and needs none. */
  if (
    listing.inAti !== inAti &&
    discount.discountTypeSelect === AMOUNT_TYPE.FIXED
  ) {
    discount = {
      ...discount,
      discountAmount: convertUnitPrice(
        listing.inAti,
        taxRate,
        discount.discountAmount,
        nbDecimalForUnitPrice,
      ),
    };
  }
}

/* A folded price REPLACES the pair the total is computed from. It was resolved in
 * the listing's basis, so it becomes that side and the other is derived from it —
 * never rounded independently. Skip this and INCLUDE mode charges the undiscounted
 * amount, because the residual discount is NONE by then. */
const charged = discount.price ?? primary;
const wtToCharge = listing.inAti
  ? convertUnitPrice(true, taxRate, charged, nbDecimalForUnitPrice)
  : charged;
const atiToCharge = listing.inAti
  ? charged
  : convertUnitPrice(false, taxRate, charged, nbDecimalForUnitPrice);

// the billable total (applies the residual discount, ×qty, rounds to currency)
const {exTaxTotal, inTaxTotal, priceDiscounted} = getLineTotal({
  wt: wtToCharge,
  ati: atiToCharge,
  discountTypeSelect: discount.discountTypeSelect,
  discountAmount: discount.discountAmount,
  qty, // a BigDecimal, as above
  taxRate,
  inAti,
  currencyDecimals: toCurrency.numberOfDecimals ?? nbDecimalForUnitPrice,
  nbDecimalForUnitPrice,
});
// charge inTaxTotal.
```

Map admin intents to a synthesized line / list:

| Intent     | Construct                                                             |
| ---------- | --------------------------------------------------------------------- |
| 10% off    | general discount `10` on the list, **or** a `DISCOUNT`/`PERCENT` line |
| flat 1.99  | a `REPLACE`/`FIXED` line, amount `1.99`                               |
| €2 off     | a `DISCOUNT`/`FIXED` line, amount `2`                                 |
| markup +5% | an `INCREASE`/`PERCENT` line                                          |

---

## Recipe 4 — quote in another unit (COEFF only)

Endpoint-style: the per-unit price is converted by coefficient **after**
currency. Pass `requestedUnit` + the COEFF lines.

```ts
import {fetchUnitConversions} from '@/product/orm';
const unitConversions = await fetchUnitConversions(client);

quoteProductPrice({
  /* …Recipe 1… */ requestedUnit: {id: unitId},
  unitConversions,
});
```

This mirrors AOS's quick-price **endpoint**, which has **no invoice
counterpart** — a sale-order line never coefficient-converts. So if you persist
an order, **write the computed price (and unit) onto the line**; don't let AOS
recompute it. Non-COEFF (formula / null type) throws.

---

## Display & charge rules (honour the compute method)

The compute method is the admin's choice of what the buyer sees. `quote` (and
`getReplacedPriceAndDiscounts`) already encode it — don't override it:

- `discount === null` → **`unitPrice` IS the price.** No badge, no strikethrough.
  (Folded by INCLUDE/replace, or there is no discount.)
- `discount !== null` → show **`unitPrice` struck through + the badge**
  (`{type, amount}`), and the real amount is the **line total**.
- **Always charge `inTaxTotal`** (ATI). For a cart, sum each line's `inTaxTotal`
  (+ any order-level adjustment), and re-test Free/Paid on the **final** amount.
- The printing **symbol** isn't in the core's currency — pair `currency.codeISO`
  / `unitId` with your own symbol / unit-name lookups for display.

---

## Rules you must respect when composing

- **`getDefaultPriceList`** keeps active lists whose `[begin, end]` window (in
  the company timezone, inclusive, `null` = open) contains today, and returns
  the **single** survivor — **zero or >1 → `null`**. Overlapping active lists
  for one buyer **nullify** (no discount), they don't stack or pick a winner.
  For a promo, designate **one** list so this is clean.
- **General discount is percent-only.** A flat or fixed-amount promo needs a
  **line** (`REPLACE`/`FIXED` or `DISCOUNT`/`FIXED`).
- **Lines target a product OR a category**, and `minQty` must be `≤ qty`. With
  qty 1 (single-item stores) **quantity tiers never fire**.
- **Targeting is only as fine as the product/category behind the row.** You
  cannot target per-listing, per-publisher, or by price band via price lists —
  the engine never sees those. If you need that, it's app-side promo logic,
  still composed from these primitives.
- **Price lists aren't inherently buyer-tied** — only `findPartnerSalePriceLists`
  is. A general/non-buyer list = fetch it any other way and feed
  `getDefaultPriceList`/`fetchPriceListLines` unchanged.
- **Amounts, rates and quantities are `BigDecimal`, in and out** (scales and
  `*Select` enums stay plain numbers, as in AOS). The core does not coerce, so a
  caller converts at the boundary — `toDecimalOrNull(x) ?? ZERO` for an ORM
  decimal column, `BigDecimal.valueOf('1')` for a literal. Plain numbers come back
  only from `quoteProductPrice` and the marketplace adapter, where each value has
  few enough significant decimals to convert without loss.
- **Strict core.** Almost every failure is a `PriceComputationError` with a
  `.code` (`ACCOUNT_MANAGEMENT_3`, `CURRENCY_1`, `UNIT_CONVERSION_*`, …). Degrade
  in the app, not the core. The one exception is a total tax rate of exactly
  −100%, which raises an uncoded `Error` — see `PRICING.md` § Strictness, and
  guard `taxFactor(rate)` before any ATI→WT conversion if you must render rather
  than fail.

---

## Where things live

- `lib/core/product/orm.ts` — fragments + fetches (the data layer).
- `lib/core/product/pricing/` — the compute functions (see `PRICING.md`).
- `lib/core/product/COMPOSITION.md` — this guide (recipes).
