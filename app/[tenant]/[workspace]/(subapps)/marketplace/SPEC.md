# Marketplace — Functional Specification

> **Audience:** product managers, designers, support, QA, and anyone who needs
> to understand _what the Marketplace does_ without reading code.
>
> **Scope:** describes the behaviour that exists in the product today. Where a
> behaviour has a sharp edge or a known gap, it is called out in
> [§9 Current limitations](#9-current-limitations--gotchas).
>
> **Note:** this spec covers _behaviour and rules only_ — not layout, styling,
> or visual design.

---

## 1. Overview

The Marketplace is a storefront built into a portal workspace. It lets a
workspace publish **apps** and **skills** that visitors can discover, and
(optionally) buy and download. Each listing carries a description, versions,
reviews, and support links.

Two things happen in one place:

- **Consumers** browse, search, favourite, buy, download, and review listings.
- **Contributors** publish their own listings, upload downloadable bundles, and
  manage versions over time.

Everything is scoped to a single **workspace** — a listing published in one
workspace is never visible in another.

**Accounts: customers and contacts.** A logged-in **user** is either a
**customer** account or one of its **contacts** — both can log in. Ownership in
the Marketplace is always at the **customer** level and shared across the
customer and all of its contacts:

- when a user **buys** a paid listing, everyone under the same customer (the
  customer and all its contacts) gets access to it;
- when a user **publishes** a listing, everyone under that customer can manage
  it.

Individual _audit_ — who created or last edited a listing, who wrote a review —
is tracked at the **user** level (the actual person who logged in), while
_ownership_ is tracked at the **customer** level.

---

## 2. Roles & personas

| Persona                     | Can do                                                                                                                                                                     | Notes                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visitor (guest)**         | Browse, search, open any published listing, read reviews                                                                                                                   | No login required to look around.<br>Any action that changes data (buy, favourite, review, download a paid item) redirects to login first.               |
| **Member / Buyer**          | Everything a visitor can, plus:<br>favourite, buy, download, write/edit a review, see their purchases                                                                      | A logged-in **user** (a customer or one of its contacts).<br>Purchases belong to the **customer**, so they're shared with everyone under it.             |
| **Contributor / Publisher** | Everything a member can, plus:<br>create listings, upload versions/bundles, manage the version lifecycle, see their contributions & revenue                                | Only when the workspace **allows publishing**.<br>The listing is published under the user's **customer**, so everyone under that customer can manage it. |
| **Workspace admin**         | Configure the storefront:<br>branding, whether publishing is allowed, whether submissions need review, payment options, and the workspace default product used for pricing | Configured in AOS, not in the storefront UI.<br>See [§7](#7-workspace-configuration).                                                                    |

---

## 3. Glossary

- **Listing / Product** — one item in the Marketplace (e.g. an app or a skill).
  Has a name, slug (its URL), description, categories, license, support links,
  price, and a set of versions.
- **App vs Skill** — the two listing _types_. Used as a filter. Functionally
  identical otherwise.
- **Version** — a specific release of a listing, with a version number
  (e.g. `1.2.0`), a changelog, a downloadable **bundle** file, and a
  **compatibility** list. A listing can have many versions over time.
- **Bundle** — the actual downloadable file (e.g. a `.zip`) attached to a
  version.
- **Compatibility** — labels on a version indicating which platform/app
  versions it works with.
- **Category** — a tag for grouping listings. A listing can belong to
  **multiple** categories. Used to filter the catalogue.
- **License** — a named (optionally linked) license shown on the listing.
- **Customer** — the top-level account that owns purchases and listings, shared
  by all of its contacts. Can log in directly.
- **Contact** — an individual belonging to a customer, who can also log in.
- **User** — whoever is currently logged in: a customer or one of its contacts.
  The actor recorded in audit fields (created-by, updated-by, review author).
- **Publisher** — the **customer** a listing belongs to ("the author"), shown on
  the listing page.
- **Free vs Paid** — a listing is **Free** when its price is zero or unset, and
  **Paid** when its price is above zero. This single fact drives whether a
  download needs a purchase.
- **Workspace default product** — an internal product record that supplies the
  tax rules for price calculation, and seeds a new listing's tax-inclusive
  (inATI) flag at create. Invisible to end users; see
  [§6 Pricing](#6-pricing--currency).
- **Purchase / ownership** — a record that a **customer** has bought a paid
  listing. Ownership unlocks paid downloads for all of that customer's contacts.

---

## 4. Features & behaviour

### 4.1 Browsing & discovery (catalogue)

The catalogue lists the workspace's listings with the following capabilities,
all reflected in the URL (so a filtered view is shareable/bookmarkable):

- **Filter by category** — one category at a time, or all.
- **Filter by type** — All / App / Skill.
- **Filter by price** — All / Free / Paid.
- **Sort** — Popular (by install count), Newest (by creation date), or Rating
  (by average rating). Default is **Popular**.
- **Pagination** — results are paged, with a total result count.

**Visibility rule:** only listings that have **at least one published version**
appear in the catalogue, in search, and on a public listing page. A listing
with only drafts is invisible to everyone except its owner
(see [§4.9](#49-publishing--versions-contributors)).

### 4.2 Search

Search returns listings whose **name or description** matches the query
(case-insensitive). Matching is limited to those two fields.

### 4.3 The listing page

Each listing has a page (addressed by its slug) that exposes:

- **Identity & metadata** — name, type, the full category list, publisher,
  current version, last-updated date, first-published date, bundle size,
  compatibility labels, and license (with a link when a license URL is set).
- **Price** — the computed price, or "Free", shown in the user's currency where
  possible (full rule in [§6](#6-pricing--currency)).
- **A primary action** that adapts to the viewer and the listing
  (see [§4.5](#45-the-primary-action)).
- **Overview** — the long description and the screenshot gallery. A listing can
  carry **up to 9 screenshots**. Clicking any screenshot opens
  a **full-size zoomable preview** (lightbox) that can be navigated image-to-image,
  including by touch/swipe on mobile.
- **Versions** — the version history with per-version downloads
  (gated, see [§4.7](#47-downloading--installs)).
- **Reviews** — the reviews and the viewer's own review.
- **Support** — documentation / issues / contact links.

**Preview mode:** a contributor can open their _unpublished_ listing in a
preview that surfaces its current draft status; all actions are inert in
preview.

### 4.4 Favourites

A logged-in user can toggle a listing as a favourite. Favourites are
**per-user** — not shared with the customer's other contacts. Guests are
redirected to login.

### 4.5 The primary action

The listing's main action adapts to the viewer and the listing. The exact
button shown is decided in this order:

```
        ┌──────────────────────────────────┐
        │ Can the viewer download?         │
        │ (free OR owner OR bought)        │
        └──────────────────────────────────┘
             │                        │
          yes│                        │no
             ▼                        ▼
   ┌───────────────────┐   ┌──────────────────────────┐
   │ [ Download ZIP ]  │   │ Is the viewer logged in? │
   └───────────────────┘   └──────────────────────────┘
                                │                  │
                              no│                  │yes
                                ▼                  ▼
                       ┌───────────────────┐  ┌──────────────────────────┐
                       │ [ Sign in to buy ]│  │ Already in cart?          │
                       └───────────────────┘  └──────────────────────────┘
                                                   │                │
                                                 no│                │yes
                                                   ▼                ▼
                                          ┌──────────────┐  ┌────────────────────────┐
                                          │ [ Buy now ]  │  │ [ In cart — view cart ]│
                                          │ [ Add to     │  └────────────────────────┘
                                          │   cart ]     │
                                          └──────────────┘
```

In **preview** mode the buyer-facing button is shown but inert (greyed out with
an "Inactive in preview" tooltip): **Buy now** + **Add to cart** for a paid
listing, or **Download ZIP** for a free one.

### 4.6 Buying & checkout

Paid listings go through a cart → checkout flow:

1. **Cart** holds the chosen paid items.
2. **Checkout** validates the cart and starts payment. Validation enforces:
   workspace access, _paid-only_ (free items can't be checked out), the listing
   is published, **not already owned**, and that all items resolve to a
   **single supported currency**.
3. **Payment** is handled by one of the configured providers — **Stripe**,
   **PayPal**, or **Paybox**. The checkout page always shows the cart and total;
   the payment buttons are whichever providers the workspace has enabled. If
   online payment is **off**, or **no provider** is configured, the payment area
   is simply **empty** — the cart and total still show, but there are no buttons
   and no on-screen explanation (see [§9](#9-current-limitations--gotchas)).
4. On **success** (the buyer returns from the provider having paid), the system
   runs these steps in order:

   1. **Verifies the amount** — the amount the provider actually captured must
      match the cart total that was locked in at checkout (within a rounding
      tolerance). Prices are **not** recomputed here, so tax/FX changes during
      payment can't retro-actively reject a payment the buyer already made.
   2. **Re-checks availability** — because payment can take minutes (3-D Secure,
      external redirects), it re-confirms each item is still published and not
      already owned. If something changed (e.g. the buyer bought it in another
      tab, or the publisher pulled a version), the grant is blocked.
   3. **Grants access** — records the ownership rows (for the customer) and marks
      the payment as processed, in one transaction.
   4. **Creates the order** — picks the buyer's invoicing address and creates
      the sale order + invoice, then links them back to the ownership rows.

   **Invoicing address selection.** The address is taken from the **customer**
   account (not the individual contact): among the customer's addresses marked
   as _invoicing_ addresses, it uses the one flagged **default**, or — if none is
   flagged — the **first** invoicing address on file. If the customer has **no**
   invoicing address, the order/invoice is skipped (see below).

   **Access is granted independently of invoicing.** If there's no invoicing
   address, or order/invoice creation fails, the buyer **still keeps access** —
   checkout returns success with a warning message (shown as a toast). It does
   not undo the purchase. The failure only goes to the server console; there is
   **no automated retry or AOS alert**, so a missing invoice has to be
   noticed and reconciled manually (see [§9](#9-current-limitations--gotchas)).

   The cart is then cleared and the buyer lands on the **success page**, which
   lists this checkout's purchases (scoped to their account) each with a
   **Download** button, plus a link to **My Purchases**. A product with no
   current published version shows "Unavailable" instead — an edge case that
   shouldn't arise in the normal flow.

   **Idempotency:** recording a purchase is safe to retry — it never creates a
   duplicate, and an already-owned item simply stays owned. A buyer cannot buy the
   same listing twice.

### 4.7 Downloading & installs

Downloads are **access-gated at the listing level** — buying a paid listing (or
it being free) unlocks **all of its published versions**, not one version at a
time. Each download request is still checked individually, and succeeds only
when one of these is true:

- the viewer is the **publisher** of the listing (any version, any status), or
- the version is **published** and the listing is **free**, or
- the version is **published** and the listing has been **bought** under the
  viewer's customer account — once anyone under the customer buys it, everyone
  under that customer (the customer and all its contacts) can download it.

Non-owners of paid listings can never download.

**Install counter:** every successful download is recorded and the listing's
**install count** is incremented. This is best-effort telemetry done _after_
the file starts streaming, so it never slows or blocks the download, and a
counting failure never fails the download.

### 4.8 Reviews & ratings

- Each logged-in user can leave **one review per listing**, which they can
  edit or delete afterwards.
- A review requires a **star rating (1–5)**; the **comment is optional**, and it
  may optionally reference a specific **published** version.
- The listing's **average rating** and **rating count** are maintained
  automatically as reviews are added, changed, or removed.
- Guests are prompted to log in to review.

### 4.9 Publishing & versions (contributors)

Publishing is only available when the workspace **allows publishing**.
**Creating** a listing or a version is refused otherwise ("Publishing is not
allowed in this workspace"). **Editing** is always scoped to the caller's own
listings — a contributor can only edit listings they publish.

#### 4.9.1 Creating & editing a listing

A listing is created/edited from a single form. Fields and their rules:

| Field                                 | Required | Editable | Rules                                                                                                               |
| ------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| Type                                  | Yes      | Yes      | App or Skill                                                                                                        |
| Name                                  | Yes      | Yes      | ≤ 120 characters.<br>Slug/URL is set from the name **at create only** — renaming later won't change the URL.        |
| Short description                     | Yes      | Yes      | 1–280 characters                                                                                                    |
| Long description                      | No       | Yes      | ≤ 20,000 characters                                                                                                 |
| Categories                            | Yes      | Yes      | at least one;<br>a listing can have many                                                                            |
| License                               | Yes      | Yes      | chosen from the workspace's licenses                                                                                |
| Cover style                           | Yes      | Yes      | a visual preset                                                                                                     |
| Icon                                  | Yes      | Yes      | an icon code                                                                                                        |
| Documentation / Issues / Contact URLs | No       | Yes      | must be a valid `http(s)` URL if given                                                                              |
| Price                                 | No       | Yes      | ≥ 0 and ≤ 999,999,999;<br>**defaults to 0 (free)** if omitted                                                       |
| Screenshots                           | No       | Yes      | up to **9** total, each **≤ 5 MB**;<br>JPEG/PNG/WebP/GIF/AVIF<br>(SVG is rejected for security);<br>**reorderable** |

**On create**, the system also:

- requires a **workspace default product** to be configured
  (otherwise creation is refused — it's the source of the tax rules);
- generates the **slug** (the listing's URL) from the name; if another listing in
  the workspace already uses that slug, a numeric suffix is appended
  (my-app, my-app-2, …) to keep it unique within the workspace;
- sets the **publisher** to the user's **customer** (so the listing is shared
  across everyone under it) and **created-by** to the **user** who created it;
- sets the **inATI flag** from the workspace default product — when true the seller enters
  the ATI price, when false the WT price; the price field is labelled to match
  (_"Price (incl. tax)"_ or _"Price (excl. tax)"_);
- sets the **sale currency**: it uses the customer's own currency; if the
  customer has none set, it falls back to the **global default currency (EUR)**.
  If neither can be resolved, the listing cannot be created;
- initialises the aggregates (rating 0, rating count 0, install count 0).

What is fixed vs. what can change after create:

- The **inATI flag** and **currency** are set at create and never change on
  edit.
- The **price amount** can be edited later.
- The **tax rate** is read live from the workspace default product (not stored on the
  listing), so if an admin changes the workspace default product or its tax setup, the
  listing's applied tax changes.

**On edit**, **updated-by** is set to the editing **contact**.

**Screenshots** are saved to match the form exactly: new files are uploaded, removed
screenshots are deleted, and the **order is preserved** — the publisher's
reordering in the form becomes the new sequence.

#### 4.9.2 Creating & editing a version

A **version** is the unit of release; the downloadable bundle lives on the
version, not the listing. Fields and rules:

| Field           | Required      | Editable          | Rules                                                                                                                                             |
| --------------- | ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version number  | Yes           | Yes               | ≤ 40 chars;<br>**1–3 numeric segments with an optional `-tag`** (e.g. `2`, `1.4`, `1.2.3`, `1.2.3-rc1`);<br>**must be unique** within the listing |
| Changelog       | No            | Yes               | ≤ 5,000 characters                                                                                                                                |
| Compatibility   | Yes           | Yes               | at least one compatibility target                                                                                                                 |
| Bundle file     | Yes on create | Yes               | a single file, **≤ 20 MB**; replaceable                                                                                                           |
| Status (intent) | Yes           | Yes (with limits) | the contributor picks **Draft** or **Publish**;<br>the _effective_ status is resolved by workspace policy (see lifecycle below)                   |

**How version numbers are handled.**

- The version the seller types (e.g. `1.2.3-rc2`) is not stored as text. It is
  broken into four parts — **major**, **minor**, **patch**, and an optional
  **pre-release tag** — and the version shown to users is rebuilt from those
  parts.
- To decide which version is newest, they are compared **major → minor → patch**
  numerically. If those are equal, a version **without** a tag is newer than one
  **with** a tag — so `1.2.3` is newer than `1.2.3-rc2`.

On save, the bundle is uploaded (when provided), the compatibility set is
diffed, **submission/publish dates are set** (see lifecycle), and the
listing's current/latest version pointers are recomputed.

**Version lifecycle:**

```
             ┌─────────┐
      ┌────▶ │  Draft  │
      │      └─────────┘
      │           │ submit
      │           ├──────────── requiresReview = OFF ───────────┐
      │           │ requiresReview = ON                         │
      │           ▼                                             ▼
      │      ┌───────────┐     approve (admin)          ┌───────────┐
      │      │ In review │ ───────────────────────────▶ │ Published │
      │      └───────────┘                              └───────────┘
      │          │   │                                       │
      │   reject │   │ unpublish                   unpublish │
      │  (admin) │   └────────────────┐         ┌────────────┘
      │          ▼                    ▼         ▼
      │     ┌──────────┐           ┌──────────────┐
      │     │ Rejected │           │ Unpublished  │
      │     └──────────┘           └──────────────┘
      │          │                      │
      │          └─────────┬────────────┘
      └────────────────────┘  save as draft
```

_Not drawn:_ a **Rejected** or **Unpublished** version can also be **submitted
again** (not just saved as Draft) to re-enter the review/publish flow.

State rules, exactly as enforced:

- **Save as Draft** keeps the version a **Draft**.
- **Submit** resolves by workspace policy: if the workspace **requires review**,
  the version becomes **In review**; otherwise it goes straight to
  **Published**.
- A **Published** or **In-review** version **cannot be saved back to Draft** —
  it must be **unpublished** first. A **Rejected** or **Unpublished** version,
  however, **can** be saved back to Draft.
- **Unpublish** is allowed only from **Published** or **In review**, and moves
  the version to **Unpublished**.
- **Rejected** is a reviewer/admin decision made in the AOS (not a
  storefront action).
- **First publish date** is set the first time a version becomes Published
  and is **preserved** across later unpublish → re-publish cycles (the original
  release date sticks).

**Listing "current" vs "latest" version:**

- **Latest version** = the highest version number across _all_ versions
  (including drafts) — used for owner preview.
- **Current version** = the highest version number among _published_ versions,
  or none if nothing is published. This is what buyers see and download, and it
  is the version badged **"Latest"** in the Versions tab.

### 4.10 My Purchases & My Contributions

- **My Purchases** — the listings owned by the user's customer, with purchase
  date and links to the order/invoice.
- **My Contributions** (login required) — the contributor area, covering: an
  overview of their listings, their listings (any status, where versions are
  managed), revenue from their listings, and their public profile.

---

## 5. Rules & states (reference)

### 5.1 Listing visibility

| Condition                                                     | Visible to                  |
| ------------------------------------------------------------- | --------------------------- |
| Has ≥1 **published** version, not archived, in this workspace | Everyone (incl. guests)     |
| Only draft / in-review / unpublished versions                 | **Owner only**, via preview |
| Archived                                                      | No one                      |

### 5.2 Download access (per version)

| Viewer                | Free + published | Paid + published, owned | Paid + published, not owned | Any non-published version |
| --------------------- | ---------------- | ----------------------- | --------------------------- | ------------------------- |
| **Publisher (owner)** | ✅               | ✅                      | ✅                          | ✅                        |
| **Logged-in buyer**   | ✅               | ✅                      | ❌                          | ❌                        |
| **Guest**             | ✅ (no login)    | —                       | ❌                          | ❌                        |

### 5.3 Version status meanings

| Status      | Visible to buyers? | Downloadable by buyers?      |
| ----------- | ------------------ | ---------------------------- |
| Draft       | No                 | No                           |
| In review   | No                 | No                           |
| Published   | Yes                | Yes (free, or owned-if-paid) |
| Unpublished | No                 | No                           |
| Rejected    | No                 | No                           |

---

## 6. Pricing & currency

Each listing sets only three price-related fields: its **price**, whether that
price **includes tax** (inATI), and its **currency**. The **tax rate** is not
stored on the listing — it comes from the workspace default product. Marketplace
prices are computed the same way AOS prices a sales-order line, so
what a buyer sees is what they are invoiced.

**Free vs Paid** is decided by the final all-tax-included price: **≤ 0 is Free**,
otherwise Paid. Free listings skip payment entirely; paid listings require
checkout and ownership before download.

**Currency shown**: the **user's** currency if a conversion to it exists, else
the **global default currency (EUR)**, else the listing's own currency as-is.

<details>
<summary><strong>How the price is computed, in detail</strong></summary>

The computation mirrors the AOS sales-order pricing path, step by step:

1. **Resolve the price fields** (price, inATI, currency): use the per-company
   entry on the product matching the selling company, or the product's base
   values when there is no company-specific entry.
2. **Resolve the tax setup** from the workspace default product's account
   management (then its product family), filtered to the selling company. A
   product-level entry with no tax set is skipped as an accounting-only override.
3. **Apply the buyer's fiscal position** (if any): each tax is remapped through
   the tax-equivalence rules — e.g. a domestic tax swapped for an EU/export one.
   One tax can map to several.
4. **Pick each tax rate**: use the active tax line, otherwise the tax line whose
   date window contains today (evaluated in the company's timezone). Summing the
   picked rates gives the total tax rate.
5. **Compute WT and ATI**:
   - tax-inclusive — `WT = price / (1 + rate)`, `ATI = price`
   - tax-exclusive — `WT = price`, `ATI = WT + WT * rate`
6. **Convert into a display currency.** The listing's own currency is the
   source amount; the WT and ATI figures are converted to the first target that
   has a usable rate:

   1. the **user's currency** — the currency on the user's customer (a contact
      uses its customer's currency);
   2. the **global default currency (EUR)** — used when there is no logged-in
      user (a guest) or no rate to the user's currency exists;
   3. the **listing's own currency** — left as-is when neither conversion is
      possible.

   Rates come from the same currency-conversion lines AOS uses.
   For a source → target pair it first looks for a **direct** rate valid for
   today's date; if there isn't one, it takes the **reverse** line and inverts
   the rate. Date-validity filtering applies to both directions.

7. **Round** the WT and ATI amounts to the number of decimal places defined by
   the display currency.

**Known simplifications vs AOS:**

- **No price lists.** AOS applies a buyer's sale price list (discounts, markups);
  the marketplace shows the catalogue price, so a buyer who has a price list
  would be invoiced differently than the displayed price.
- **No unit conversion.** Listings always sell quantity 1 in the product's
  natural unit.
- **Rounding** is at the display currency's decimals rather than the unit-price
  decimal setting, and **arithmetic** is float64 rather than BigDecimal — so a
  sub-cent difference from AOS is theoretically possible. To stay safe, checkout
  doesn't require an exact match: the amount the provider captured must equal the
  quoted total within a **tolerance of half the currency's smallest unit** (e.g.
  €0.005); anything larger is rejected as a mismatch.

</details>

---

## 7. Workspace configuration

Set by an admin in the AOS; each affects storefront behaviour:

| Setting                                              | Effect                                                                                                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Branding (hero title / description / background)** | Presentation of the landing area.                                                                                                                                          |
| **Allow publishing**                                 | If off, contributors cannot create listings or versions.                                                                                                                   |
| **Requires review**                                  | If on, submitted versions go to _In review_ instead of publishing immediately.                                                                                             |
| **Online payment enabled**                           | Required for paid checkout to function.                                                                                                                                    |
| **Payment options**                                  | Which of Stripe / PayPal / Paybox are offered at checkout.                                                                                                                 |
| **Workspace default product**                        | The internal product that supplies the tax rules for all listings, and seeds each new listing's tax-inclusive (inATI) flag.<br>Required before any listing can be created. |
| **Company**                                          | The company context used for company-specific pricing/tax.                                                                                                                 |

---

## 8. Permissions summary

| Action                                   | Guest | Member     | Publisher        | Notes                      |
| ---------------------------------------- | ----- | ---------- | ---------------- | -------------------------- |
| Browse / search / view published listing | ✅    | ✅         | ✅               |                            |
| Download free published version          | ✅    | ✅         | ✅               | no login required          |
| Favourite a listing                      | ❌    | ✅         | ✅               | per-user                   |
| Buy a paid listing                       | ❌    | ✅         | ✅               |                            |
| Download paid version                    | ❌    | owned only | ✅ (own listing) |                            |
| Write / edit a review                    | ❌    | ✅         | ✅               | one per listing            |
| Create a listing / upload versions       | ❌    | ❌         | ✅               | needs _Allow publishing_   |
| Preview own unpublished listing          | ❌    | ❌         | ✅               |                            |
| View My Purchases / My Contributions     | ❌    | ✅ / —     | ✅               | contributions = publishers |

---

## 9. Current limitations & gotchas

- **Search is name + description only.** It does not match category, version
  number, or any code/identifier.
- **No "primary" category.** A listing can belong to many categories; there is
  no canonical one.
- **Install count = download count.** It increments on every successful download
  with no de-duplication per user, and is best-effort: under failure it can
  under-count. Treat it as a popularity signal, not an exact figure.
- **Rejection is AOS only.** There is no storefront UI for a reviewer to
  reject a submission; "Rejected" is set in the AOS.
- **A free listing is never "owned."** Ownership records exist only for paid
  purchases, so free listings won't appear under My Purchases.
- **No-payment checkout fails silently.** If online payment is off or no provider
  is configured, the checkout page still renders the cart and total but shows no
  payment buttons and no message — the buyer is left with no way to pay and no
  explanation. (The "Online payment is not available." / "Payment options are
  not configured." messages exist only as server-side guards that the UI never
  reaches, since no button renders to trigger them.)
- **Paid-but-uninvoiced purchases aren't surfaced.** If invoice/order creation
  fails after a successful payment (e.g. no invoicing address), the buyer keeps
  access but the failure is only written to the server console — there's no
  automated retry or AOS alert, so it must be caught and reconciled
  manually.

---

_This document describes observed product behaviour and is intended as a living
spec — update it alongside functional changes._
