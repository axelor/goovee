# Marketplace subapp

A public listing of Axelor add-ons. Two types of products are listed: **skills**
(open-source plugins) and **apps** (paid apps). Workspace members can browse,
review, and download published bundles; contributors can publish and manage
their own products and versions.

This subapp is mounted at `/<tenant>/<workspace>/marketplace`.

## Routes

| Path                                                                    | Purpose                                                                                                   | Auth                                               |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `/marketplace`                                                          | Redirects to `/marketplace/skills`                                                                        | public                                             |
| `/marketplace/[type]`                                                   | Listing for `skills` or `apps`                                                                            | public                                             |
| `/marketplace/products/[slug]`                                          | Product detail (overview, versions, reviews, support)                                                     | public                                             |
| `/marketplace/my-contributions`                                         | Owner dashboard (overview, skills, apps, revenue, profile)                                                | login required                                     |
| `/marketplace/my-purchases`                                             | Buyer's purchase history with download links                                                              | login required                                     |
| `/marketplace/cart`                                                     | Cart (localStorage-backed, marketplace-only)                                                              | public to view; login enforced at checkout         |
| `/marketplace/cart/checkout`                                            | Review + payment provider buttons                                                                         | login required                                     |
| `/marketplace/cart/checkout/success`                                    | Post-payment success page (lists newly-bought items)                                                      | login required                                     |
| `/marketplace/cart/checkout/cancel`                                     | Stripe-only "Cancel" return destination                                                                   | login required                                     |
| `/marketplace/api/products/[product-id]/versions/[version-id]/download` | Bundle download. Owner / free-product / purchaser branches gated server-side via `withBundleAccessFilter` | public for owner + free + published; 404 otherwise |

The "starting URL" the rest of the portal links to is `/marketplace/skills`.
Header, sidebar, mobile bottom-nav, and the apps grid all use this.

## Sub-navigation

The marketplace injects its own top navigation (Skills · Apps Studio ·
My contributions · My purchases) into the global header. The mobile
equivalent is an icon in the workspace's bottom nav that opens a sheet
with the same links. The "My contributions" and "My purchases" entries
are hidden when the visitor isn't signed in.

A second cart icon is also injected into the workspace header and mobile
menu when the marketplace subapp is installed. It sits next to the shop
cart icon (when both are installed); the two carts are intentionally
separate (different storage keys, different checkout flows). See
`app/[tenant]/[workspace]/marketplace-cart.tsx`. A future unification
into a single grouped cart is tracked in
`docs/marketplace-checkout-plan.md`.

## Features

### Listing

- Hero + category filter chips + sort dropdown.
- Server-paginated; `?page=`, `?limit=`, `?category=`, `?sort=` searchParams.
- Hero title/description switches between Skills Hub and Apps Studio based on the route segment.

### Product detail

- Tabs: Overview / Versions / Reviews / Support.
- Type-aware breadcrumb — links back to the product's own hub (skills vs apps); category breadcrumb item is omitted when the product has no category.
- Reviews summary shows filled stars + numeric average.
- **Support tab** shows up to four buttons, each conditional on its source URL being set: **Read docs** (`documentationUrl`), **Open issues** (`supportIssuesUrl`), **Contact author** (`supportContactUrl`), **Report problem** (also `supportIssuesUrl`). The last button reuses the issues URL — only three distinct URLs are modelled on the product today. Either drop "Report problem" or back it with a dedicated field (e.g. `bugReportUrl`) — TODO in `support-tab.tsx`.
- CTA state machine in the header card (resolved server-side):

  | Product state          | Buyer state                               | CTA shown                              |
  | ---------------------- | ----------------------------------------- | -------------------------------------- |
  | Free (price.ati === 0) | any                                       | Download (streams via the API route)   |
  | Paid                   | guest                                     | "Sign in to buy" → login with callback |
  | Paid                   | logged in, not in cart, not owned         | Add to cart + Buy now                  |
  | Paid                   | logged in, in cart                        | "In cart — view cart"                  |
  | Paid                   | logged in, owned (purchaser **or** owner) | Download                               |

- Favorite button is always shown for signed-in users (independent of the buy/download state).

### Cart

- localStorage-backed, keyed by `marketplace-cart-{workspaceURL}`. Mirror of the shop's pattern with a distinct namespace.
- Single seat: quantity is always 1; "Add to cart" is idempotent (dedup on `productId`).
- Items stash a display snapshot (name, slug, priceAti, currencySymbol, scale, description, iconCode, coverStyle, currentVersionNumber) so the cart row renders without a server roundtrip. Snapshots may go stale; checkout always re-fetches.
- Same-tab updates are broadcast via a `marketplace-cart-changed` DOM event so the header badge stays in sync. Cross-tab sync is out of scope.
- Rendered via `CartItemCard` (shared with the checkout review). The cart page adds a remove button; the checkout review is read-only.

### Checkout

- Login required (redirect with callback). Renders the shared `<Payments>` component wired to per-provider session creators for **Stripe (card), PayPal, Paybox**. Up2pay, HubPISP, and Stripe bank-transfer are out of scope for v1.
- Cart review uses the same `CartItemCard` as `/cart`, plus a total row.
- Server-side validation runs inside each provider's session-creation action — never on the client. See "Buying flow" below.
- See `docs/marketplace-checkout-plan.md` for the design decisions (modes, address handling, post-payment fulfilment).

### My purchases

- `/marketplace/my-purchases` — paginated table (10/page) of the buyer's own `MarketplaceProductPurchase` rows, joined to the product.
- Same responsive table primitive as `MyProductsTable` (icon thumbnail with cover-style gradient, name + description, current version, purchased date, invoice id, Download button).
- Visible only when logged in; always present in the navbar for signed-in users.

### My contributions

- Owner dashboard with Overview, Skills, Apps, Revenue, Profile tabs.
- Tables of own products (collapsible columns on mobile, follows the ticketing pattern). Sorted newest-first by `createdOn`.
- **Status column** reads `product.currentVersion?.statusSelect` — it's a "publication state" view, not a per-version status:
  - Green **Published** badge when `currentVersion.statusSelect === 'published'`.
  - Muted badge with the translated status for any other non-null state.
  - **`—`** when `currentVersion` is null. Per the [`currentVersion` rule](#rules), the pointer is only set when a _published_ version exists — so draft-only / in-review-only / unpublished-only products all render `—`. The product still appears in the table (My contributions ignores publication state); only the listing/detail surfaces hide it.
- "Publish new" launcher opens the create flow; row pencil opens the edit flow.

### Create / edit flow

A responsive Dialog (Drawer on small screens) with a two-step stepper:

- **Step 1 — Product**: type, name, category, descriptions (long uses a rich-text editor), cover gradient, icon, support URLs. In edit mode, users can advance without saving when there are no changes.
- **Step 2 — Version**: version number, compatibility chips, changelog, bundle ZIP upload. A carousel browses existing versions, but only one can be edited at a time — switching while dirty toasts "save first". Bundle replace is allowed.

Saving from step 2 closes the dialog and refreshes the route. Step 2 is locked
until step 1 has produced a productId (existing on edit, or returned by the
create call).

The version form footer is keyed off the version's _current_ status and `workspace.config.requiresReview`. The server enforces the same rules.

**Save-as-draft / Unpublish visibility** — depends on current status only:

| Current status | Save as draft | Unpublish |
| -------------- | ------------- | --------- |
| _new_          | ✅            | —         |
| `draft`        | ✅            | —         |
| `in_review`    | ❌            | ✅        |
| `published`    | ❌            | ✅        |
| `rejected`     | ✅            | —         |
| `unpublished`  | ✅            | —         |

Demoting a live or queued version to draft must go through Unpublish first.

**Publish-side button label** — depends on both current status and the workspace `requiresReview` flag:

| Current status                               | `requiresReview` | Label               | Effect                                       |
| -------------------------------------------- | ---------------- | ------------------- | -------------------------------------------- |
| _new_ / `draft` / `rejected` / `unpublished` | `false`          | `Publish`           | goes live immediately                        |
| _new_ / `draft` / `rejected` / `unpublished` | `true`           | `Submit for review` | queues for approval                          |
| `in_review`                                  | (either)         | `Submit for review` | re-queues for approval                       |
| `published`                                  | `false`          | `Save`              | updates the live version in place            |
| `published`                                  | `true`           | `Submit for review` | unlists the version and re-queues for review |

## Rules

- A product is **publicly listed** only if it has at least one **published** version. Owners always see their own products in _My contributions_ regardless.
- A product's **currentVersion** always points at the newest published version. It is recomputed after every version save. Unpublishing the current version explicitly requires the owner to pick the replacement (see Unpublish rule below).
- **Publishing** (creating a new product or a new version) requires `workspace.config.allowToPublish === true`. The check gates only the _create_ paths — owners can still edit existing products and versions when the flag is off. When disabled: the "Publish new" button is hidden in `my-contributions`, and `saveProduct` / `saveVersion` reject calls without an `id`. _My contributions_ remains accessible to all signed-in users (a future "request to publish" flow will live there).
- **Review workflow** is controlled by `workspace.config.requiresReview`. When `true`, every "publish" intent on a version — new or an edit to an already-published one — routes through `in_review` instead of going live immediately. Drafts are unaffected. The version form swaps the "Publish" button label to "Submit for review" and renders an inline alert:
  - new / draft + no review → primary alert ("Ready to publish")
  - new / draft + review → warning alert ("Review required before publishing")
  - editing a published version + no review → primary alert
  - editing a published version + review → destructive alert (the version will be unlisted; if it's the only published version on the product, the product drops off public listings until a new version is approved)
    Listing unlist is automatic: `getPublishedProductFilter` requires at least one version with `statusSelect: 'published'` on the product. `currentVersion` is recomputed only when a published version exists; otherwise the pointer is left alone (the listing filter handles the hide).
- **Unpublish** flips a version's `statusSelect` to `unpublished`. Allowed source states: `published` and `in_review`. Owner-only. The version form footer renders an outline-destructive "Unpublish" button when `current.statusSelect` is one of those, with an AlertDialog confirmation. `currentVersion` is touched only when the version being unpublished is the current one:
  - If other published versions exist, the dialog shows a select (defaults to the newest by `dateOfApproval`) and the action **requires** `newCurrentVersionId`. The server validates the pick (must be a published version of this product, must not be the version being unpublished) and promotes it.
  - If no other published version exists, no select is shown and `currentVersion` is left alone — the listing filter hides the product.
  - If the version being unpublished isn't current, `currentVersion` is untouched and any passed `newCurrentVersionId` is ignored.
- **Bundle files** are capped at 20 MB. Allowed types: `.zip`, `application/zip`, `application/x-zip-compressed`.
- The **marketplace type** (`skill` / `app`) is fixed at creation — the select is disabled in edit mode.
- **Categories** and **Axelor compatibility versions** are admin-controlled in AOS; the marketplace just reads them.
- **Pricing** uses workspace-level defaults set on `PortalAppConfig`: `marketplaceDefaultUnit`, `marketplaceDefaultProductFamily`, and `marketplaceInAti`. `saveProduct` writes these onto every new product at create time so it's ready for the AOS sale-order / invoice path. The `saleCurrency` written at create time is resolved as: publisher's partner currency (`AOSPartner.currency`) → the app-wide `DEFAULT_CURRENCY_CODE` from `@/constants` (looked up in `AOSCurrency` by code). There is no workspace-level default currency. **`saleCurrency` is stamped only on create** — once a product exists, edits never rewrite its currency, even if the publisher's partner currency later changes. Historical products keep the currency they were priced in. The other defaults (unit / family / `inAti`) follow the same create-time-only rule.
- A product is **free** when `salePrice === 0` and **paid** when `salePrice > 0`. Free and paid are not stored as a separate flag.
- **Ownership is per-partner**, not per-user. Any contact under the same `mainPartner` can download products that partner bought. Matches B2B semantics (and mirrors how shop tracks orders).
- **Free products skip checkout entirely** — no `MarketplaceProductPurchase` row is written, the bundle download endpoint serves them publicly. Only paid flows reach `checkout()`.
- **Quantity is always 1** — single-seat. `Add to cart` deduplicates on productId.
- **Mixed-currency carts are rejected** at checkout (the validator refuses if items span more than one `saleCurrency.code`). Today the toast appears on the provider button click; an earlier "Add to cart" check is tracked under "Known gaps" in the checkout doc.
- Only **Stripe (card), PayPal, and Paybox** are exposed by the marketplace checkout. Other providers configured on the workspace are filtered out client-side (handler props omitted on `<Payments>`).

## Pricing

All price computation lives in `common/utils/price.ts`. The file's header
comment is the canonical narrative of our algorithm, AOS's algorithm,
and the deliberate divergences with rationale — see that file before
touching anything price-related.

### How we compute WT / ATI

1. Resolve the per-company override for `salePrice` / `inAti`: walk `Product.productCompanyList` and use the row matching the selling company; fall back to the base product fields otherwise.
2. Resolve the AccountManagement row by walking `Product.accountManagementList → ProductFamily.accountManagementList`, filtered by the selling company's id. Skip a Product-level row whose `saleTaxSet` is empty (treated as accounting-only override).
3. If a buyer fiscal position is provided, remap each tax through `taxEquivList`: when the tax appears in any equiv's `fromTaxSet`, replace it with the equiv's `toTaxSet` (one tax can map to many).
4. For each (possibly remapped) tax, pick a rate — prefer `activeTaxLine.value`; otherwise pick the entry from `taxLineList` whose `[startDate, endDate]` window contains today (computed in the company's IANA timezone). Sum the picked rates → `totalTaxRate`.
5. If `inAti`, invert: `WT = salePrice / (1 + rate/100)`, `ATI = salePrice`. Otherwise forward: `WT = salePrice`, `ATI = WT + WT·rate/100`.
6. Try to convert WT and ATI in this order (first hit wins): **viewer currency → default currency → product currency**. Conversion uses `CurrencyConversionLine` (direct rate, then inverse fallback). The display number and symbol always describe the same currency.

   - _Viewer currency_ — `AOSPartner.currency` resolved via `auth.user.mainPartnerId`; contacts share the parent partner's currency. Guests, and partners with no `currency` set, have no viewer currency and skip straight to the default.
   - _Default currency_ — the app-wide `DEFAULT_CURRENCY_CODE` from `@/constants`, looked up in `AOSCurrency`. Stops a mixed-currency catalog from rendering each product in its own currency when the viewer's currency has no configured rate (or the viewer is a guest).
   - _Product currency_ — last-resort fallback when neither target has a usable rate. The buyer sees the price in the product's own currency.

7. Round both to the resolved currency's `numberOfDecimals` (defaults to `DEFAULT_CURRENCY_SCALE`).

### Server-computed everywhere

`withPrice` in `common/orm.ts` enriches **every product returned by an ORM query** with `price: { wt, ati, taxRate, currency: { code, symbol, numberOfDecimals } }` so the client never recomputes. Display sites (`ProductCard`, the product detail page, `CartItemCard`) read `product.price.ati` and `product.price.currency` for formatting (including the scale — so JPY/BHD render correctly when conversion changes the currency). The bare `computePrice` is still exported for unit tests / future server-side reuse.

`buildPriceContext` is called per find function (`findProducts`, `findProduct`, `findMyProducts`, `validateCart`) **after** the product query and resolves three things in parallel: the viewer's partner currency, the app-wide default currency (`AOSCurrency` by `DEFAULT_CURRENCY_CODE`), and only the `CurrencyConversionLine` rows that connect one of the product currencies in the result to **either** target (filtered via an `OR` in both directions so the inverse-rate fallback still works). We never pull the full conversion table.

Anti-tamper at checkout: `validateCart` returns a server-stamped `ValidatedCart` (items + total) which is then stashed verbatim into `PaymentContext`. On the return leg, `checkout()` reads the cart back from `PaymentContext` and compares `paidAmount` against the **stashed** `cart.total` — prices are not recomputed at return, because pricing inputs (taxes, FX rates) could have moved during the provider redirect and rejecting an already-captured payment over server-state drift is worse than honouring the buyer's quoted price. The tolerance is `0.5 × 10^-scale` (half of the currency's smallest minor unit). Time-sensitive invariants (ownership, published version, workspace access) are re-checked separately via `recheckCartAvailability`.

### AOS parity

The compute mirrors the AOS Java pricing chain:

```
axelor-sale/.../ProductRestService.fetchProductPrice
  → axelor-base/.../ProductPriceServiceImpl.getSaleUnitPrice
  → axelor-base/.../AccountManagementServiceImpl.getTaxLineSet
  → axelor-base/.../FiscalPositionService.getTaxSet
  → axelor-base/.../TaxService.convertUnitPrice + getTotalTaxRate
  → axelor-base/.../CurrencyServiceImpl.getAmountCurrencyConvertedAtDate
  → axelor-base/.../ProductCompanyService.get
```

Parity is verified by `pnpm marketplace:test-price`, which loads every marketplace product, picks one buyer per distinct fiscal position (plus the no-partner case), iterates every active company, and compares `computePrice` against AOS's authoritative `/ws/aos/product/price` endpoint. Pass `--verbose` for a per-row table; mismatches are always reported.

Remaining differences vs AOS:

- **No PriceList / PriceListLine adjustment.** AOS applies the buyer partner's `salePartnerPriceList` to override unit prices (discount, markup, replacement). Marketplace surfaces the catalog price; a buyer with a sale price list will silently diverge — guard at `validateCart` or mirror the logic if this becomes relevant.
- **No unit conversion.** AOS's `/aos/product/price` accepts `unitId` and converts via `Unit.conversion`. Marketplace always sells at qty=1 in the product's natural unit, so this never fires.
- **Currency-conversion fallback.** When no conversion line exists for any target, AOS throws a configuration error and blocks the operation; we silently fall back to displaying the price in the product's original currency. A misconfigured rate results in the buyer seeing the source currency with no warning rather than an error.

AOS order payload notes (`common/service/index.ts`):

- **Prices are computed server-side by AOS**, not sent from goovee. The payload carries only `productId` per item; AOS calls `ProductPriceService.getSaleUnitPrice` in the chosen currency to build each sale order line.
- **`inAti: true` is set on the order**, not per-item, because `ProductPriceService` returns ATI prices directly.

Precision differences (acceptable for display):

- Final rounding scale uses the resolved currency's `numberOfDecimals` rather than AOS's `nbDecimalDigitForUnitPrice` (typically equal, not enforced).
- Intermediate arithmetic is float64 here vs AOS's BigDecimal + HALF_UP. `Math.round` matches HALF_UP for positive values, so the rounded result matches AOS at currency precision.

## Buying flow (paid products)

End-to-end sequence for a logged-in buyer purchasing one or more paid
products. Free products bypass everything below and hit the download
endpoint directly. Same model and code path as the events subapp's
`register()` — see `docs/marketplace-checkout-plan.md` for the side-by-
side comparison.

### 1. Add to cart

- The detail page renders `<BuyButtons>` (logged-in, not owned, paid product). "Add to cart" writes the item snapshot to `localStorage[marketplace-cart-{workspaceURL}]`; "Buy now" writes then `router.push('/cart')`.
- No server call. The header cart badge updates via the `marketplace-cart-changed` DOM event.

### 2. Review cart at `/cart`

- Items render from localStorage; the snapshot is enough for the card layout. There's no server-side validation at this stage — drift is tolerated until checkout.
- "Proceed to checkout" links to `/cart/checkout`.

### 3. Checkout (`/cart/checkout`)

- The server component runs `ensureAuth(..., {allowGuest: false})` and redirects guests to login with `?callbackurl=/cart/checkout`.
- The client component `CheckoutClient` reads localStorage, renders the cart review with `CartItemCard`, and mounts `<Payments>` with handler closures that pass the current `productIds`.

### 4. Provider session creation

When the buyer clicks Stripe / PayPal / Paybox:

1. Client invokes `createStripeCheckoutSession({productIds, workspaceURL})` (or the PayPal / Paybox equivalent) from `common/actions/payments.ts`.
2. The action authenticates, calls `validateCart` (workspace access, paid-only, published, not-already-owned, single-currency — **one query** via the `marketplaceProductPurchaseList` back-relation, plus per-batch fetches for the viewer + default currencies and only the conversion lines relevant to the products in the cart), then delegates to the shared `createStripeOrder` / `createPaypalOrder` / `createPayboxOrder` in `@/payment/...`.
3. The shared helper writes a `PaymentContext` row stashing `{cart, workspaceURL}` — `cart` is the full `ValidatedCart` with server-stamped per-item prices — and creates the provider session with `metadata.context_id` linking back to it.
4. The action returns `{url}` / `{client_secret}` etc.; the `<Payments>` button redirects the buyer to the provider's hosted page.

### 5. Provider return

| Provider | Success URL                                                          | Cancel / failure URL                           |
| -------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| Stripe   | `/cart/checkout?stripe_session_id={CHECKOUT_SESSION_ID}` (same page) | `/cart/checkout/cancel`                        |
| PayPal   | Handled inline by the PayPal SDK popup; no separate redirect URL     | Handled by the PayPal SDK                      |
| Paybox   | `/cart/checkout?paybox_response=true`                                | `/cart/checkout?paybox_error=true` (same page) |

Stripe / Paybox: the buyer lands back on `/cart/checkout`, the provider button reads the query param, and calls the validate handler (which calls `checkout()` below). PayPal: the SDK invokes `onPaypalCaptureOrder` directly.

### 6. Finalize — `checkout()`

`common/actions/actions.ts:checkout({payment, workspaceURL})`:

1. Authenticate. Resolve `mainPartnerId = auth.user.mainPartnerId`.
2. `getPaymentInfo({mode, data, client})` pulls the `PaymentContext` for this provider session and returns `{amount, context: {id, version, data: {cart, ...}}}`. The buyer-supplied identifier is **the only client input** — everything else comes from server-side storage.
3. The stashed `cart` is the source of truth for prices (it's what the provider was handed at prepare time). `recheckCartAvailability(productIds)` re-runs only the time-sensitive invariants — workspace access, published version, not-already-owned — that can change between prepare and return. Prices are **not** recomputed here, so a tax-line or FX-rate edit during the redirect window doesn't fail a payment we already captured.
4. **Anti-tamper**: `Math.abs(paidAmount - cart.total) > 0.5 × 10^-scale` → reject. The tolerance is half of the cart currency's smallest minor unit (0.005 for EUR/USD, 0.5 for JPY, etc.).
5. **goovee transaction**:
   - `recordPurchases(txClient, mainPartnerId, productIds)` — idempotent insert (unique `(partner, product)` constraint).
   - `markPaymentAsProcessed({contextId, version, client: txClient})` — flips the context state so a replay of the same provider session would fail in step 2.
6. **After commit**:
   - POST `/ws/portal/marketplace/order` on AOS with `{partnerId, contactId, workspaceId, currencyCode, invocingPartnerAddressId, items: [{productId}], paidAmount, paymentModeId}`. AOS computes prices server-side, creates SaleOrder + Invoice + InvoicePayment, and returns all three ids.
   - `attachInvoiceToPurchases(client, mainPartnerId, productIds, invoiceId)` back-populates the `invoice` field on each purchase row.
   - **Invoice creation is best-effort** — if it fails, the action still returns success with a warning message. The buyer already has access; a missing invoice is a back-office reconciliation, not a user-facing failure. Price mismatch rejections from AOS are treated the same way (gap is accepted).
7. Return `ActionResponse<true>`.

The `<Payments>` `onApprove` callback then clears the cart and `router.push('/cart/checkout/success')`. The success page re-queries `findPurchases` and renders the buyer's recent purchases with Download buttons.

### Why the goovee tx commits before the AOS HTTP

`SaleOrderPortalServiceImpl` queries the marketplace's local rows by id under read-committed isolation. Calling AOS inside our transaction would make the just-inserted purchase rows invisible to it. Putting AOS after `commit` keeps the visibility correct **and** improves the safety profile: the buyer always gets access immediately if payment captured. A missing Invoice is recoverable by a reconciliation job (one-product-per-row scan, idempotent insert).

### Bundle download gate

Single query via `withBundleAccessFilter` (`common/orm/helpers.ts`):

```
OR(
  // Free + published
  {statusSelect: PUBLISHED, product: AND(getProductAccessFilter, salePrice <= 0 OR null)},

  // Paid + owned + published
  partnerId && {statusSelect: PUBLISHED, product: AND(getProductAccessFilter, marketplaceProductPurchaseList: {partner: {id: partnerId}}})},

  // Owner — any status (lets sellers grab their own drafts)
  partnerId && {product: getMyProductAccessFilter(workspace, partnerId)},
)
```

Non-owner non-purchaser buyers of paid products never match → 404.

## Permissions

| Capability                                | Guest               | Member                   | Owner                    | Purchaser                 |
| ----------------------------------------- | ------------------- | ------------------------ | ------------------------ | ------------------------- |
| Browse listing / product detail           | ✅                  | ✅                       | ✅                       | ✅                        |
| Favorite a product                        | ❌                  | ✅                       | ✅                       | ✅                        |
| Download a free published bundle          | ✅                  | ✅                       | ✅                       | ✅                        |
| Download a paid published bundle          | ❌                  | ❌                       | ✅ (own product)         | ✅ (partner has purchase) |
| Download a draft bundle                   | ❌                  | ❌                       | ✅ (own product)         | ❌                        |
| Add a paid product to cart                | ❌                  | ✅                       | ✅                       | ✅                        |
| Proceed through `/cart/checkout`          | ❌ (login redirect) | ✅                       | ✅                       | ✅                        |
| See "My contributions" link               | ❌                  | ✅                       | ✅                       | ✅                        |
| Open `/marketplace/my-contributions`      | ❌ (login redirect) | ✅ (sees own)            | ✅                       | ✅                        |
| See "My purchases" link                   | ❌                  | ✅                       | ✅                       | ✅                        |
| Open `/marketplace/my-purchases`          | ❌ (login redirect) | ✅ (sees own partner's)  | ✅                       | ✅                        |
| Create a new product / version            | ❌                  | ✅ (if `allowToPublish`) | ✅ (if `allowToPublish`) | ✅ (if `allowToPublish`)  |
| Edit an existing product / version        | ❌                  | ✅ (own only)            | ✅                       | ❌                        |
| Unpublish a published / in-review version | ❌                  | ✅ (own only)            | ✅                       | ❌                        |

"Member" = any signed-in user with portal access to this workspace.
"Owner" = `AOSProduct.defaultSupplierPartner.id === auth.user.mainPartnerId`.
"Purchaser" = a `MarketplaceProductPurchase` row exists for the user's
`mainPartner` and this product. Roles compose — a single user can be a
Member who is both Owner of one product and Purchaser of another.
See the [Identity](#identity-actor-vs-owning-partner) section.

## Identity (actor vs owning partner)

Two ids are in play on every authenticated request:

- **`auth.user.id`** — the actor. Set to the actual logged-in user's `AOSPartner` row (either a partner or a contact).
- **`auth.user.mainPartnerId`** — the owning partner. Resolved at `ensureAuth` time via `getPartnerId(user)`: `mainPartnerId` for contacts, `user.id` for direct partners. The marketplace's `MarketplaceUser` augments the global `User` type with `mainPartnerId: string` (non-null), so call sites can use it directly.

How each id is used:

| Field / filter                                            | Identity                                              |
| --------------------------------------------------------- | ----------------------------------------------------- |
| `AOSProduct.defaultSupplierPartner` (the product's owner) | `auth.user.mainPartnerId` (partner — never a contact) |
| `AOSProduct.marketplaceCreatedBy`                         | `auth.user.id` (actor — can be a contact)             |
| `AOSProduct.marketplaceUpdatedBy`                         | `auth.user.id` (actor)                                |
| Ownership filter (`withMyProductAccessFilter` etc.)       | `auth.user.mainPartnerId`                             |
| `AOSMarketplaceReview.author`                             | `auth.user.id` (reviews are per-user)                 |
| `AOSPartner.favouriteProducts` (the row being updated)    | `auth.user.id` (favorites are per-user)               |

Net effect: a contact who creates a product attaches the product to their main partner (so the partner-as-supplier is consistent across all contacts of the same company), while audit fields (`createdBy` / `updatedBy`) and personal data (reviews, favorites) retain the contact's individual identity.

---

## Models (ORM)

Defined in `goovee/schema/`. See `common/orm.ts` for the query layer.

- **`AOSProduct`** — the product itself. Marketplace-relevant fields:
  - `isMarketPlace: true`, `marketplaceTypeSelect: 'skill' | 'app'`
  - `slug`, `name`, `description`, `longDescription`
  - `productCategory` (M2O → `AOSProductCategory`)
  - `marketplaceCoverStyle`, `marketplaceIconCode`
  - `defaultSupplierPartner` (M2O → `AOSPartner`) — the owner
  - `marketplaceCreatedBy` (M2O → `AOSPartner`)
  - `currentVersion` (M2O → `AOSMarketplaceProductVersion`) — latest published version
  - `versionList` (O2M → `AOSMarketplaceProductVersion`) — inverse of `version.product`
  - `documentationUrl`, `supportIssuesUrl`, `supportContactUrl`
  - `averageRating`, `ratingCount`, `installCount`
  - **Pricing**: `salePrice` (BigDecimal), `saleCurrency` (M2O → `AOSCurrency`), `inAti`, `accountManagementList` (O2M → `AOSAccountManagement`), `productFamily.accountManagementList` (tax chain fallback)
  - `marketplaceProductPurchaseList` (O2M → `AOSMarketplaceProductPurchase`) — back-relation used by the bundle access filter and cart validator to gate paid downloads without a second query
- **`AOSMarketplaceProductVersion`** — a release.
  - `versionNumber`, `changelog`
  - `statusSelect: 'draft' | 'in_review' | 'published'` (`rejected` and `unpublished` are defined upstream but not produced by Goovee today). `in_review` is set automatically when `workspace.config.requiresReview` is on and the form sends a "publish" intent.
  - `bundleFile` (M2O → `AOSMetaFile`) — the uploaded `.zip`
  - `compatibilitySet` (M2M → `AOSMarketplaceAxelorVersion`)
  - `product` (M2O → `AOSProduct`)
  - `dateOfApproval` — set when status flips to `published`
- **`AOSMarketplaceAxelorVersion`** — the list of Axelor releases a version can declare compatibility with (e.g. `7.4`, `7.3`).
- **`AOSMarketplaceReview`** — user review with rating + comment, linked to product + reviewed version.
- **`AOSProductCategory`** — categories with `forMarketPlace: true`.
- **`AOSCurrencyConversionLine`** — exchange-rate rows from `appBase.currencyConversionLineList`. Fields: `startCurrency`, `endCurrency`, `exchangeRate`, `fromDate`, `toDate`. Fetched per-request by `buildPriceContext` (filtered to the `(productCurrency ↔ {viewer, default})` pairs needed for the batch, in both directions) and used by `computePrice` for the conversion step.
- **`AOSMarketplaceDownload`** — telemetry; not used by the listing UI.
- **`AOSMarketplaceProductPurchase`** — per-`(partner, product)` ownership row, written by `checkout()`. Fields: `partner`, `product`, `invoice` (nullable; back-attached after the post-commit AOS HTTP call), `purchasedAt`. Unique constraint on `(partner, product)` makes `recordPurchases` and `attachInvoiceToPurchases` idempotent. The AOS-side domain (`MarketplaceProductPurchase.xml` in `axelor-portal`) provides a back-office grid for inspection — see Marketplace → Purchases.

## Access filters

Each rule above is enforced by a helper in `common/orm/helpers.ts`. The
`get*` form returns the `where`; the `with*` form returns a function that
merges a caller-provided `where` with the base. Filters compose via
`and()` / `or()` from `utils/orm.ts`, so changing a base rule flows
through everything built on top of it.

| Rule                                                                                                                               | Helper                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Product is in this workspace, not archived, `isMarketPlace`, not private                                                           | `getProductAccessFilter` / `withProductAccessFilter`       |
| Product has at least one published version (public listings + product detail)                                                      | `getPublishedProductFilter` / `withPublishedProductFilter` |
| Caller owns the product (their `defaultSupplierPartner`)                                                                           | `getMyProductAccessFilter` / `withMyProductAccessFilter`   |
| Category belongs to the workspace's marketplace                                                                                    | `getCategoryAccessFilter` / `withCategoryAccessFilter`     |
| Bundle is downloadable: published + (free **or** caller's partner has a purchase row), **or** caller owns the product (any status) | `withBundleAccessFilter`                                   |
