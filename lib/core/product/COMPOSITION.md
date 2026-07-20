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
  qty: 1,
  nbDecimalForUnitPrice, // from AppBase (default 2)
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
setup**. This is what `marketplace`'s `computePrice` does.

```ts
import {
  getSaleTaxLineSet,
  getTotalTaxRateInPercentage,
  getConvertedPrice,
  PriceComputationError,
} from '@/product/pricing';

// tax from the product (lenient: a broken tax config degrades to 0%)
let taxLineSet;
try {
  taxLineSet = getSaleTaxLineSet({product, companyId, fiscalPosition, today});
} catch (e) {
  if (!(e instanceof PriceComputationError)) throw e;
  taxLineSet = []; // 0% — storefront policy, not the core's
}

// price the values you own
const {wt, ati, taxRate} = getConvertedPrice({
  price: listing.salePrice, // YOUR price
  sourceInAti: listing.inAti, // YOUR basis
  taxLineSet,
  fromCurrency: listing.saleCurrency, // YOUR currency
  toCurrency, // display currency (your cascade decides which)
  conversionLines,
  today,
});
```

The viewer→default→listing **currency cascade** and the broken-tax fallback are
**app policy** — layer them around these calls; the core stays strict.

---

## Recipe 3 — apply a price-list discount to an owned price

Add a discount on top of Recipe 2 (a buyer price list, or a marketplace-wide
promo). The engine is **buyer-agnostic** — only _how you get the list_ differs.

```ts
import {
  getDefaultPriceList,
  getPriceListLine,
  getReplacedPriceAndDiscounts,
  getLineTotal,
} from '@/product/pricing';
import {findPartnerSalePriceLists, fetchPriceListLines} from '@/product/orm';

// --- get the applicable list ---
// buyer route (per-partner, native):
const priceList = getDefaultPriceList(
  await findPartnerSalePriceLists({client, mainPartnerId}),
  today,
);
// general / promo route (everyone): fetch ONE config-designated list yourself,
// then: getDefaultPriceList([thatList], today)   // app owns overlap rules

if (priceList) {
  const lines = await fetchPriceListLines(client, priceList.id);

  // match this row's product/category (the price you discount is the OWNED one)
  const productLines = lines.filter(l => l.product?.id === product.id);
  const categoryLines = product.productCategory?.id
    ? lines.filter(l => l.productCategory?.id === product.productCategory?.id)
    : [];
  const primary = inAti ? ati : wt;
  const line = getPriceListLine(productLines, categoryLines, 1, primary);

  const d = getReplacedPriceAndDiscounts(
    priceList,
    line,
    primary,
    computeMethodDiscountSelect,
    nbDecimalForUnitPrice,
  );
  // d.price !== null → folded into the unit price (INCLUDE / replace); show as the price
  // else → d.discountTypeSelect/d.discountAmount is the SEPARATE discount to display
}

// the billable total (applies the residual discount, ×qty, rounds to currency)
const {exTaxTotal, inTaxTotal, priceDiscounted} = getLineTotal({
  wt,
  ati,
  discountTypeSelect: d.discountTypeSelect,
  discountAmount: d.discountAmount,
  qty: 1,
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
- **Arithmetic is float64.** A value on an exact half-cent can round a cent off
  AOS's `BigDecimal` (rare). A consumer that captures payment should accept the
  quote within **half the currency's smallest unit**.
- **Strict core.** Every failure is a `PriceComputationError` with a `.code`
  (`ACCOUNT_MANAGEMENT_3`, `CURRENCY_1`, `UNIT_CONVERSION_*`, …). Degrade in the
  app, not the core.

---

## Where things live

- `lib/core/product/orm.ts` — fragments + fetches (the data layer).
- `lib/core/product/pricing/` — the compute functions (see `PRICING.md`).
- `lib/core/product/COMPOSITION.md` — this guide (recipes).
