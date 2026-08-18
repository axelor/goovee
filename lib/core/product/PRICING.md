# Product pricing core

A faithful TypeScript port of the AOS sales-order pricing path. Given a price, a
tax setup and a target currency it returns the **WT** (without-tax) and **ATI**
(all-tax-included) amounts — the same numbers AOS would invoice.

The module lives in the **`pricing/` folder**, split by concern and re-exported
from `pricing/index.ts` (import everything from `@/product/pricing`):

- `types` / `errors` — the _computed_ shapes (`ResolvedTaxLine`,
  `ResolvedDiscount`), the enums, error codes, and the error class. (The
  _input_ shapes are the `Payload` types of `../orm`'s fragments — see below.)
- `util` — decimal arithmetic, timezone "today", per-company field reads.
- `tax` — tax resolution, WT/ATI, basis conversion + invoice pairing.
- `conversion` — currency exchange rate, unit coefficient.
- `discount` — the buyer's price-list discount primitives.
- `line-total` — the billable `exTaxTotal` / `inTaxTotal`.
- `catalogue` — `getSaleUnitPrice` / `getConvertedPrice`.
- `apply-price-list` — the product-price ENDPOINT's quirky variant (reference).
- `quote` — `quoteProductPrice`, the one call for display + charge (below).

The module is **subapp-agnostic**: it knows nothing about any subapp. Its input
types are the `Payload` types of the select fragments in the co-located data
layer **`../orm.ts`** (`PriceableProduct`, `Currency`, `TaxRow`, `ConversionLine`,
`FiscalPositionInput`, `PriceListRow`, `PriceListLineRow`, `UnitConversionRow`).
So adding a field a pricing function reads is a _single_ edit — extend the
fragment, and it flows straight into the function's accepted input.

This keeps the boundary that matters: `core/product` depends only on types it
owns (its own `orm.ts` fragments over the goovee ORM) — **never** on a subapp's
shapes. `orm.ts` is the one file here that calls the ORM client; the compute
layer imports only its _types_, so it stays unit-testable without a database.
The marketplace is one consumer; see its `SPEC.md` §6 for the policy it layers on
top.

## One call: `quoteProductPrice`

For a complete priced line — what to **display** and what to **charge** — call
`quoteProductPrice` (in `quote.ts`). It chains the steps below (catalogue unit
price → invoice rounding → the buyer's price-list discount → the billable line
total) and returns one object:

- `unitPrice {wt, ati}` — the headline per-unit price (the discounted price when
  the compute method folds it in, the catalogue price otherwise);
- `discount {type, amount} | null` — the separate discount to show, present
  **only** when the compute method keeps it separate (so the display honours the
  admin's intent: a folded discount shows no badge);
- `priceDiscounted`, `exTaxTotal`, `inTaxTotal` — **charge `inTaxTotal`**.

It is strict (throws like the rest of the core); a storefront wraps it with its
own degradation policy and product fetch, the parity test wraps it to compare
against AOS.

## Strictness

The core is **strict**. Wherever the mirrored AOS Java raises an
`AxelorException` — no tax configured, no usable exchange rate, an unsupported
unit conversion — this module throws a `PriceComputationError` carrying the
matching error code. It never invents a fallback. **Degradation policy belongs
to the caller** (e.g. the marketplace shows a broken-tax price untaxed and
cascades through display currencies rather than failing a page).

One failure is **not** a `PriceComputationError`: a total tax rate of exactly
−100% makes `1 + rate` zero, and dividing by it raises a plain `Error`. AOS
mirrors this — its tax lines are constrained to `0..100`, so the input takes a
direct database write, and where AOS does divide it raises an unchecked
`ArithmeticException` rather than an `AxelorException`. A caller that must render
rather than fail therefore cannot rely on catching `PriceComputationError` alone;
it has to check `taxFactor(rate)` against zero before any ATI→WT conversion — an
ATI-stored price, or an ATI-primary order over a WT-stored one.

## How a price is computed

1. **Resolve the price values** (price, inATI, currency). A caller that owns its
   price — an AOS sale-order line, or a marketplace listing — supplies the three
   values directly; AOS's per-company product overrides don't apply to such a
   caller. When pricing a bare product instead, the per-company override rows
   are honoured exactly as AOS does (a company-flagged field is read from the
   company row as-is, with no fallback to the base product).
2. **Resolve the tax setup** from the product's account management (then its
   product family), filtered to the selling company. A product-level entry with
   no tax set is skipped as an accounting-only override. Nothing anywhere →
   error.
3. **Apply the buyer's fiscal position** (if any): if an equivalence rule's
   source taxes exactly match the product's whole tax set, the set is swapped
   for the rule's target taxes — e.g. a domestic tax swapped for an EU/export
   one. A partial overlap does nothing (all-or-nothing). Otherwise the original
   taxes are kept.
4. **Pick each tax rate**: use the active tax line, otherwise the tax line whose
   date window contains today (evaluated in the company's timezone). Summing the
   picked rates (each shared line counted once) gives the total tax rate.
5. **Compute WT and ATI**:
   - tax-inclusive — `WT = price / (1 + rate)`, `ATI = price`
   - tax-exclusive — `WT = price`, `ATI = WT + WT * rate`
6. **Convert to the target currency** using the same currency-conversion lines
   AOS uses: for a source → target pair it first looks for a **direct** rate
   valid for today's date, else takes the **reverse** line and inverts the rate.
   Date-validity filtering applies to both directions. Currencies are matched by
   their ISO code (`codeISO`), never the printing code. The rate is rounded the
   way AOS rounds it — a direct rate to **6** decimals, an inverted rate at **8**
   then re-scaled to 6 (half-up).
7. **(Optional) re-express in a requested unit, for a quantity.** After the
   currency step the per-unit price can be converted from the product's sale
   unit (`salesUnit ?? unit`) to a different unit and multiplied by a quantity,
   mirroring AOS `ProductRestServiceImpl`. Only **coefficient** conversions are
   supported (`UnitConversion.typeSelect == TYPE_COEFF`): forward = `coef`,
   reverse = `1/coef`. Groovy-formula conversions are rejected, as is a null /
   unknown type, or requesting a unit when the product has no sale unit to
   convert from. Omit the requested unit to price one item in the product's own
   unit.

   **This mirrors the quick-price ENDPOINT, not the invoice.** In AOS the only
   place a price is coefficient-converted by unit is `ProductRestServiceImpl`
   (the read-only `/ws/aos/product/price` quote). A sale-order / invoice line
   never unit-converts — it prices via the unit-less `getSaleUnitPrice`, and
   picking a product forces the line's unit back to the product's sale unit,
   where the catalogue price is already expressed. So this step is an
   endpoint-style convenience for an app that wants per-requested-unit quoting;
   there is no invoiced number to validate it against, only the endpoint.

Both levels return the per-unit `wt` and `ati`, the applied `taxRate` (a
percentage), the `qty`, and the line totals `wtTotal` / `atiTotal` (`wt`/`ati` ×
`qty`). Level 1 additionally echoes the resolved `unitId`. The **unit-price**
rounding is left to the caller, at whatever scale its context requires — but a
real currency conversion has already rounded the amounts to the target currency's
decimals (step 6), so they are not raw.

## Two levels

The module mirrors AOS's own two-level API:

- **Level 1 — `getSaleUnitPrice`** — "price THIS PRODUCT for this company":
  reads the price fields off the product (honouring per-company overrides),
  resolves the taxes, then delegates to level 2. Echoes back the resolved
  `unitId`.
- **Level 2 — `getConvertedPrice`** — "price THESE VALUES": for callers that own
  their price (a sale-order line, a price list, a marketplace listing). Takes the
  tax basis (`sourceInAti`) explicitly rather than re-reading it off the product,
  so a caller whose record froze the flag at create time stays correct.

## Errors

Each code below is a `PriceComputationError` thrown at the same point the mirrored
AOS Java throws — so a caller can react exactly as an AOS admin would read the
original error, or degrade (see Strictness). The table is the complete set of
_coded_ failures; a total tax rate of exactly −100% raises an uncoded `Error`
instead, for the reason given under Strictness.

| Code                                  | Raised when                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ACCOUNT_MANAGEMENT_3`                | No sale tax is configured for the product (nor its family) for the selling company.                          |
| `TAX_1`                               | Taxes exist, but none has a usable rate line.                                                                |
| `TAX_2`                               | An empty tax set reached tax-line resolution.                                                                |
| `CURRENCY_1`                          | No exchange-rate line between the two currencies (either direction), or a source/target currency is missing. |
| `CURRENCY_2`                          | An exchange-rate line exists but its rate is zero or unreadable.                                             |
| `UNIT_CONVERSION_1`                   | No conversion line between the two units (either direction).                                                 |
| `UNIT_CONVERSION_2`                   | A conversion line exists but its coefficient is zero or unreadable.                                          |
| `UNIT_CONVERSION_FORMULA_UNSUPPORTED` | The matching conversion line is a Groovy formula (or a null / unknown type) — not coefficient-based.         |
| `UNIT_CONVERSION_NO_SOURCE_UNIT`      | A unit was requested but the product has no sale unit (`salesUnit ?? unit`) to convert from.                 |

## Price-list discounts

AOS finishes pricing by running the buyer's sale price list — discounts,
markups and replacement prices — over the catalogue unit price. That step lives
in **`discount.ts`** (a faithful port of `PriceListService`,
`PartnerPriceListServiceImpl.getDefaultPriceList` and the
`SaleOrderLineDiscountServiceImpl` composition). It is an adjustment applied
_after_ a catalogue price exists, and not every consumer wants it:
`getSaleUnitPrice` returns the catalogue price, and a caller who has a buyer
applies the price list as the next step (`getDefaultPriceList` →
`getDiscountedPrice`). See that file's header for the discount rules, the
compute-method modes (fold the discount into the price vs keep it separate), and
the line-selection logic. Like the rest of the core it leaves final rounding to
the caller.

The **billable line total** — what you actually charge — is `getLineTotal` in
`line-total.ts`, a port of `SaleOrderLineComputeServiceImpl.computeValues`. It
takes the unit price plus the buyer's resolved discount and quantity and
returns `exTaxTotal` / `inTaxTotal`, rounded to the currency's decimals. This
matters under the SEPARATE compute method, where the discount is **not** in the
unit price: the discounted amount only surfaces in the line total. `wt`/`ati`
from this core are the unit price; `getLineTotal` is the line amount.

## Types

Amounts, rates and quantities are the `BigDecimal` the goovee ORM exports
(`@goovee/orm`); scales and enum selects are plain numbers. That is the split AOS
uses — `BigDecimal qty`, `BigDecimal unitPrice`, `int scale`,
`int discountTypeSelect` — and half-up rounding matches Java's, negatives
included.

The core does not coerce, so a caller holding a number or a decimal string
converts at its own boundary — `toDecimalOrNull` is exported for exactly that, and
routes through the string form so a value that arrived as a double stays exact to
its printed digits. Plain numbers come back out of `quoteProductPrice` and the
marketplace adapter only, where each value has few enough significant decimals to
convert without loss. `taxRate` and `qty` are returned as they were supplied.

The arithmetic helpers, all in `util`: `scaled` (half-up to a scale), `divide`,
`percentFraction` (`percent / 100`), `taxFactor` (`1 + rate/100`),
`applyPercentDiscount` (`value × (100 − percent) / 100`, so a negative percent
raises the value — that is how a markup arrives), and the `ZERO` / `ONE` /
`HUNDRED` constants. Two scales, both AOS's: `INTERMEDIATE_SCALE` in `util` (20,
`COMPUTATION_SCALING`) for intermediates, and `DISCOUNT_SCALE` in `types` (20,
`PriceListLineRepository`) for a fixed-amount discount. They coincide at 20 and
mean unrelated things — do not substitute one for the other.

Two rules for arithmetic here:

- **Prefer one rounding, at the scale the result is wanted at.** Rounding wide and
  then re-rounding can in principle cross a half-cent boundary a single rounding
  would not. Where AOS rounds twice — the currency step below, then the caller's
  unit-price rounding — the port rounds twice too; faithfulness wins over the
  rule.
- **Never call `BigDecimal.divide(divisor, scale, mode)` directly.** In
  `@goovee/orm` 0.0.7 it returns a result too large by `10 ** (2 × deficit)`
  whenever `scale + divisor.scale() − dividend.scale()` is negative — the divisor's
  value is irrelevant, only the scales matter (`6666.03333 / 100` at scale 2 gives
  `66660333.30`; `6666.03333 / 1.2` gives `55550277.75`). Use `divide`, which
  raises the scale to keep that expression non-negative, and `percentFraction` for
  a division by 100, which needs no division at all.

Rounding on the money path goes through `scaled`, except inside `divide`, which
rounds its own quotient. A consumer totalling amounts the core has already
rounded does that on its own side.

An exact half rounds **away from zero**, as Java's HALF_UP does — so `−119.585`
gives `−119.59`. That applies wherever a discount amount is negative: an INCREASE
line, which is resolved into a negative discount, and a REPLACE line whose
replacement price sits above the price being replaced.

## Known simplifications vs AOS

- **The final unit-price rounding** is left to the caller. What the two levels do
  round internally, they round because AOS does: the exchange rate, and the
  converted amount at the target currency's decimals (step 6).
  `quoteProductPrice` is the exception — being the outer edge, it rounds
  everything it returns.

See the header comment in `catalogue.ts` (and each concern file) for the exact
AOS services each step mirrors.
