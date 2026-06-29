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
- when a user **publishes** a listing, everyone under that customer with
  **full marketplace access** can manage it — a **Restricted** contact is a
  buyer only (see [§2](#2-roles--personas)).

Individual _audit_ — who created or last edited a listing, who wrote a review —
is tracked at the **user** level (the actual person who logged in), while
_ownership_ is tracked at the **customer** level.

---

## 2. Roles & personas

| Persona                     | Can do                                                                                                                                                                     | Notes                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visitor (guest)**         | Browse, search, open any published listing, read reviews                                                                                                                   | No login required to look around.<br>Any action that changes data (buy, favourite, review, download a paid item) redirects to login first.                                                                                                                                                                                                                      |
| **Member / Buyer**          | Everything a visitor can, plus:<br>favourite, buy, download, write/edit a review, report another user's review, see their purchases & favourites                           | A logged-in **user** (a customer or one of its contacts).<br>Purchases belong to the **customer**, so they're shared with everyone under it.                                                                                                                                                                                                                    |
| **Contributor / Publisher** | Everything a member can, plus:<br>create listings, upload versions/bundles, manage the version lifecycle, see their contributions & revenue                                | Only when the workspace **allows publishing**, and only with **full marketplace access**: the customer account itself, a **contact admin**, or a contact whose marketplace role is **Total**. A **Restricted** contact remains a buyer.<br>The listing is published under the user's **customer**, so every full-access user under that customer can manage it. |
| **Workspace admin**         | Configure the storefront:<br>branding, whether publishing is allowed, whether submissions need review, payment options, and the workspace default product used for pricing | Configured in AOS, not in the storefront UI.<br>See [§7](#7-workspace-configuration).                                                                                                                                                                                                                                                                           |

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
  Each contact has a marketplace access level — **Total** (full publisher
  rights) or **Restricted** (buyer only) — set per app in the workspace's
  **Members** administration; a **contact admin** always counts as Total.
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
- **About the author** — the publisher's identity, with a link through to the
  seller's profile in the **Directory**. The link appears only when the seller
  is a (non-archived) customer that is listed in the Directory; otherwise the
  author is shown without a profile link.

**Preview mode:** a contributor in a publishing-enabled workspace can open their
_unpublished_ listing in a preview that surfaces its current draft status; all
actions are inert in preview. Preview is **seller-only** — only a full-access
seller in a publishing-enabled workspace can use it. Every other preview request
(a guest, a Restricted contact, or any user when publishing is off) returns
**"not found"**.

### 4.4 Favourites

A logged-in user can toggle a listing as a favourite from its listing page.
Favourites are **per-user** — not shared with the customer's other contacts.
Guests are redirected to login.

The user's favourites are collected on a dedicated **Favourites** list under
[My Account](#410-my-account), which shows each saved listing with its price,
rating, and install count, and a link through to the listing. The list:

- **searches** by listing **name or description** (the same two fields as the
  catalogue search), with a clear button;
- **filters** by **type** (All / App / Skill) and **price** (All / Free / Paid),
  the same filters the catalogue offers;
- is **paginated**.

Only still-available favourites appear — a favourited listing that is archived
or has lost its published version drops out of the list (the catalogue
visibility rule from [§5.1](#51-listing-visibility)). A row can be
**un-favourited in place**: the heart toggles immediately and the listing stays
in view so it can be re-added; it only leaves the list on the next load.

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

1. **Cart** holds the chosen paid items. The cart is stored in the browser and
   **scoped to the signed-in user**, so two accounts sharing a browser never see
   each other's items (items can only be added while signed in). It is reached
   from a cart icon shared with the other apps in the workspace: when more than
   one app has a cart the icon opens a chooser, otherwise it links straight to
   the one cart.
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
   3. **Grants access** — records a **marketplace order** grouping this checkout's
      purchases and the per-listing ownership rows (for the customer), and marks
      the payment as processed, in one transaction. Each ownership row
      **captures the price the buyer was charged** — the without-tax and
      tax-inclusive amounts, the tax rate, and the charged currency — so it is a
      self-contained record for revenue reporting (see [§4.10](#410-my-account)).
   4. **Creates the sale order + invoice** — produced **after the response**. A
      failure leaves the order **pending** (see below) and never affects access.

   **Invoicing address selection.** The address is taken from the **customer**
   account (not the individual contact): among the customer's **non-archived**
   addresses marked as _invoicing_ addresses, it uses the one flagged
   **default**, or — if none is flagged — the **first** invoicing address on
   file. If the customer has **no** usable invoicing address, the order is left
   **pending** rather than invoiced (see below).

   **Access is granted independently of invoicing.** The buyer keeps access even
   if the sale order/invoice is delayed or fails; a pending order shows as
   **"Order pending" / "Invoice pending"** in their purchases until it completes
   (see [§9](#9-current-limitations--gotchas)).

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
- **A user cannot review their own listing.** The publishing customer and all of
  its contacts are blocked from reviewing listings published under that customer —
  the write-a-review card is hidden for them, and the server rejects the attempt.
- The listing's **average rating** and **rating count** are maintained
  automatically as reviews are added, changed, or removed.
- Guests are prompted to log in to review.

**Reporting a review.** A logged-in user can **report** another user's review,
picking one fixed **reason** — Spam, Offensive, Inappropriate, or Other (no free
text). **Guests cannot report**, and **a user cannot report their own review**.
**Publishers can report** reviews on their listings but can never hide them
(moderation is admin-only, below). A user gets **one report per review** —
re-reporting is refused ("already reported"), though a different user can still
report it. Reporting flags the review for an admin; it does not hide it.

**Moderation.** Reviews are **post-moderated**: they go live immediately, and an
admin hides violations afterwards from the AOS, not the storefront (like version
rejection, see [§9](#9-current-limitations--gotchas)). Per review the admin can:

- **Hide** (a **reason is required**, kept as an internal note) — the comment
  stops showing to other buyers; the rating is unaffected. Hiding also resolves
  the review's open reports.
- **Restore** — a hidden review becomes visible again.
- **Dismiss reports** — clears the open reports and leaves the review visible.
  Reports are kept as history, so a user who already reported a review cannot
  report it again.

A hidden review keeps its **rating** but not its comment: other buyers see it as
a **rating-only review**, while the **author** still sees their own, marked
**"hidden by a moderator"** — the reason is internal and not shown to them. The
rating **keeps counting** toward the listing's average and count — hiding removes
only the comment from display.

### 4.9 Publishing & versions (contributors)

Every contributor operation requires the workspace to **allow publishing** —
creating, editing, and unpublishing a listing or version, loading a listing to
edit, opening the contributor area, and previewing an unpublished listing. When
publishing is off, these are all refused ("Publishing is not allowed in this
workspace"; the contributor area itself returns "not found"). The same
operations also require the caller to have **full marketplace access** — the
customer itself, a contact admin, or a contact with the **Total** role; a
**Restricted** contact is refused the same way, while buying, downloading and
reviewing stay open to them. Beyond those gates, every operation is scoped to
the caller's own listings — a contributor can only act on listings they
publish.

#### 4.9.1 Creating & editing a listing

A listing is created/edited from a single form. Fields and their rules:

| Field                                 | Required | Editable | Rules                                                                                                               |
| ------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| Type                                  | Yes      | No       | App or Skill;<br>fixed at create — like the slug, it cannot be changed on edit                                      |
| Name                                  | Yes      | Yes      | ≤ 120 characters.<br>Slug/URL is set from the name **at create only** — renaming later won't change the URL.        |
| Short description                     | Yes      | Yes      | 1–280 characters                                                                                                    |
| Long description                      | No       | Yes      | ≤ 20,000 characters                                                                                                 |
| Categories                            | Yes      | Yes      | at least one;<br>a listing can have many                                                                            |
| License                               | Yes      | Yes      | chosen from the licenses catalogue (shared tenant-wide, not per-workspace)                                          |
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
- The **tax rate** is not stored on the listing — it is read live from the
  product the listing was bound to at create (the workspace default product at
  that time). Editing **that product's** tax setup changes the listing's applied
  tax live. **Re-pointing the workspace default product to a different product
  does nothing to existing listings** — they stay bound to the product they were
  created with.

**On edit**, **updated-by** is set to the editing **user**.

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
  **with** a tag — so `1.2.3` is newer than `1.2.3-rc2`. Two tagged versions
  compare by tag, lexicographically.

On save, the bundle is uploaded (when provided), the compatibility set is
diffed, the **submission date is set at create** and the **publish date on
first publish** (see lifecycle), and the listing's current/latest version
pointers are recomputed.

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
  storefront action). The reviewer must give a **reason**; the author sees the
  **latest** reason when editing the rejected version, alongside what saving
  will do next. Every rejection is kept as history in the AOS, but the
  storefront surfaces only the most recent one.
- **First publish date** is set the first time a version becomes Published
  and is **preserved** across later unpublish → re-publish cycles (the original
  release date sticks).

**Listing "current" vs "latest" version:**

- **Latest version** = the highest version number across _all_ versions
  (including drafts) — used for owner preview.
- **Current version** = the highest version number among _published_ versions,
  or none if nothing is published. This is what buyers see and download, and it
  is the version badged **"Latest"** in the Versions tab.

### 4.10 My Account

A logged-in user's marketplace activity lives under **My Account**, a hub that
links to the sections below and through to the user's own profile in the
**Directory**. The buyer sections are available to every logged-in user; the
contributor section appears only when the workspace allows publishing.

- **My Purchases** — the listings owned by the user's customer, with purchase
  date and links to the order/invoice, or **"Order pending" / "Invoice pending"**
  until those exist. Paginated.
- **Favourites** — the user's saved listings (see [§4.4](#44-favourites)).
- **My Contributions** — the contributor area, available **only when the
  workspace allows publishing**, and only to users with **full marketplace
  access** (a **Restricted** contact never sees it). The hub omits this entry
  for non-publishers and Restricted contacts, and the page returns "not found"
  if opened directly without either permission.
  It covers an **Overview**, the contributor's **listings** (any status, where
  versions are managed), and a **Revenue** tab that is not implemented yet
  (it shows "Coming soon").

#### 4.10.1 Contributions overview

The Overview summarises activity across the contributor's own listings:

- **Headline figures** — **revenue**, **sales**, **installs**, and **average
  rating** for the **last full calendar month**, across all of the contributor's
  listings. Each card names the **month it covers** in parentheses by the number
  (e.g. "(May)") and a **trend** comparing that month to the one before — an up /
  down / flat indicator labelled with the compared month (e.g. "+12% vs Apr"). With no
  earlier month to compare against, the trend reads as **"Baseline"** instead.
  (Sales count purchases in the month; installs count downloads in the month;
  rating is the average of reviews left that month; revenue is summed by purchase
  date.)
- **Revenue** — the headline figure (last full month) and a **12-month chart**
  are shown in the **contributor's own currency**. Because each purchase stores
  the price in the _buyer's_ charged currency (see [§4.6](#46-buying--checkout)),
  amounts are **converted** to the contributor's currency using the exchange
  rate for the **sale date** (the purchase date in the workspace company's
  timezone — the same as-of date checkout priced at), so the converted figure
  stays consistent with what was charged. A purchase with no available exchange
  rate is left out rather than counted at face value. Revenue is the
  **without-tax** (net) amount.
- **Pending actions** — versions of theirs that are **in review** or sitting as
  a **draft**, plus a rollup of **new reviews** left on their listings in the
  last 7 days. Capped to a handful, versions first.
- **Recent activity** — a merged, newest-first feed of **reviews**,
  **downloads**, and **purchases** across their listings, each with the actor's
  name and a relative time.

### 4.11 Product moderation

An admin can moderate an individual listing from the back-office, separately from
[archiving](#54-archived-records). Two reversible levels, each carrying a reason:

- **Frozen** — the listing stays fully visible and purchasable; only its
  **publisher** is locked out — they cannot edit it, add a version, or unpublish
  one. In [My Contributions](#410-my-account) its status shows **Frozen** (the
  reason on hover) and its edit control is disabled.
- **Taken down** — as frozen, **plus** removed from the storefront entirely:
  hidden from the catalogue and search **and** its detail page no longer opens
  (direct links 404). New purchases are blocked.

A buyer who already **purchased** a taken-down paid listing keeps downloading it
from [My Purchases](#410-my-account) — the download route still honours the
existing entitlement. A **free** listing has no entitlement to fall back on, so
taking it down makes it unavailable to everyone but the publisher. The
moderation reason is shown to the publisher (contributions), the admin, and — via
a dialog on the download button in My Purchases — to a buyer who already
purchased it; it never appears on the public storefront. Restoring returns the
listing to active and clears the moderation. See
[§5.5](#55-product-moderation-states).

---

## 5. Rules & states (reference)

### 5.1 Listing visibility

| Condition                                                     | Visible to                                                                                                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Has ≥1 **published** version, not archived, in this workspace | Everyone (incl. guests)                                                                                                                                       |
| Only draft / in-review / unpublished versions                 | **Owner only**, via preview                                                                                                                                   |
| Taken down by moderation                                      | Hidden from catalogue, search **and** its detail page (direct links 404); paid owners still download via My Purchases ([§5.5](#55-product-moderation-states)) |
| Archived                                                      | No one                                                                                                                                                        |

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

### 5.4 Archived records

Records can be **archived** in the AOS. The general rule: an archived record
stays attached to whatever already references it, but is **never selected for
new use** — it disappears from listings, pickers, and any step that creates a
new reference. Concretely:

- **Listings** — invisible to everyone (see [§5.1](#51-listing-visibility)).
- **Versions** — not shown in the Versions tab, not downloadable, and never
  elected as the listing's **current** or **latest** version.
- **Reviews** — no longer shown on the listing page.
- **Purchases** — hidden from My Purchases (the customer's access itself is
  unaffected).
- **Compatibility targets** — removed from the version form's picker; versions
  already labelled with them keep the label.
- **Invoicing addresses** — skipped when picking the address for a new order
  (see [§4.6](#46-buying--checkout)).

Two checks deliberately **do** see archived records, so identifiers stay
reserved: slug generation (an archived listing keeps its URL) and the
version-number duplicate check (an archived version's number can't be reused).

### 5.5 Product moderation states

Moderation is separate from [archiving](#54-archived-records): archive removes a
listing entirely, moderation is a reversible admin action with a recorded reason
(see [§4.11](#411-product-moderation)).

| State          | Catalogue / search | Detail page | Publisher can edit | New purchase | Download                                |
| -------------- | ------------------ | ----------- | ------------------ | ------------ | --------------------------------------- |
| **Active**     | ✅                 | ✅          | ✅                 | ✅           | ✅                                      |
| **Frozen**     | ✅                 | ✅          | ❌                 | ✅           | ✅                                      |
| **Taken down** | ❌ hidden          | ❌ 404      | ❌                 | ❌ blocked   | paid → owner via My Purchases; free → ✗ |

For **active** and **frozen**, download follows the normal [per-version access](#52-download-access-per-version)
(free → all, paid → purchasers + owner). For **taken down**, an existing paid
purchaser (and the publisher) still downloads from My Purchases, but a **free**
product — having no purchase entitlement — stops being downloadable to buyers.
Only [archiving](#54-archived-records) cuts off download for a paid purchaser too.
### 5.5 Review moderation states

| State       | Comment shown to other buyers | Comment shown to its author | Counts toward rating |
| ----------- | ----------------------------- | --------------------------- | -------------------- |
| **Visible** | Yes                           | Yes                         | Yes                  |
| **Hidden**  | No — shows as rating-only     | Yes, marked hidden          | Yes (telemetry)      |

A review is **Visible** when authored; an admin can move it to **Hidden** (and
back) from the AOS (see [§4.8](#48-reviews--ratings)).

---

## 6. Pricing & currency

Each listing sets only three price-related fields: its **price**, whether that
price **includes tax** (inATI), and its **currency**. The **tax rate** is not
stored on the listing — it comes from the workspace default product.

Marketplace prices are computed exactly the way AOS prices a sales-order line,
so what a buyer sees is what they are invoiced. The full step-by-step rules — tax
resolution, fiscal position, WT/ATI, currency conversion — are documented in
[Product pricing](../../../../../lib/core/product/PRICING.md). On top of those
rules the marketplace applies the policy below.

- **The listing owns its price.** Its own price, inATI and currency are used
  as-is; only the **tax setup comes from the workspace default product**, using
  that product's tax configuration for the **workspace's company** (the Company
  setting in [§7](#7-workspace-configuration)). (AOS's per-company product price
  overrides don't apply to a listing.)
- **Free vs Paid** is decided by the listing's price: **≤ 0 (or unset) is
  Free**, otherwise Paid. Checkout applies the same test to the final ATI amount;
  tax and currency conversion preserve the sign, so the two tests always agree.
  Free listings skip payment entirely; paid listings require checkout and
  ownership before download.
- **Which currency is shown.** The price is shown in the first currency that has
  a usable exchange rate:

  1. the **user's currency** — the currency on the user's customer (a contact
     uses its customer's currency);
  2. the **global default currency (EUR)** — for a guest, or when no rate to the
     user's currency exists;
  3. the **listing's own currency** — left as-is when neither conversion is
     possible.

  A broken tax setup likewise degrades to a 0% rate rather than failing the page.

- **Quantity 1, no unit conversion.** Listings always sell a single item in the
  product's natural unit; a buyer cannot choose a different unit or quantity.
- **Rounding & tolerance.** Displayed amounts are rounded to the currency's
  number of decimal places. Because that rounding can differ from AOS by a
  fraction of the currency's smallest unit, checkout doesn't require an exact
  match: the amount the provider captured must equal the quoted total within
  **half the currency's smallest unit** (e.g. €0.005); anything larger is
  rejected as a mismatch.

**Beyond today's behaviour.** The pricing core supports more than the
marketplace uses today — chiefly **time-bound price-list discounts** (for one
buyer, or marketplace-wide) and **unit conversion**. The marketplace applies
neither to listings yet. To build such a feature on the core, see the
[pricing composition guide](../../../../../lib/core/product/COMPOSITION.md).

---

## 7. Workspace configuration

Set by an admin in the AOS; each affects storefront behaviour:

| Setting                                              | Effect                                                                                                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Branding (hero title / description / background)** | Presentation of the landing area.                                                                                                                                          |
| **Allow publishing**                                 | If off, every contributor action is blocked — creating, editing, unpublishing, and previewing listings/versions — and the contributor area is hidden.                      |
| **Requires review**                                  | If on, submitted versions go to _In review_ instead of publishing immediately.                                                                                             |
| **Online payment enabled**                           | Required for paid checkout to function.                                                                                                                                    |
| **Payment options**                                  | Which of Stripe / PayPal / Paybox are offered at checkout.                                                                                                                 |
| **Workspace default product**                        | The internal product that supplies the tax rules for all listings, and seeds each new listing's tax-inclusive (inATI) flag.<br>Required before any listing can be created. |
| **Company**                                          | The company context used for company-specific pricing/tax.                                                                                                                 |

---

## 8. Permissions summary

| Action                                        | Guest | Member     | Publisher         | Notes                                                                                                                            |
| --------------------------------------------- | ----- | ---------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Browse / search / view published listing      | ✅    | ✅         | ✅                |                                                                                                                                  |
| Download free published version               | ✅    | ✅         | ✅                | no login required                                                                                                                |
| Favourite a listing                           | ❌    | ✅         | ✅                | per-user                                                                                                                         |
| Buy a paid listing                            | ❌    | ✅         | ✅                |                                                                                                                                  |
| Download paid version                         | ❌    | owned only | ✅ (own listing)  |                                                                                                                                  |
| Write / edit a review                         | ❌    | ✅         | ✅ (others' only) | one per listing; not on own listing                                                                                              |
| Create / edit / unpublish listings & versions | ❌    | ❌         | ✅                | needs _Allow publishing_ + full marketplace access (not a Restricted contact); blocked while the listing is frozen or taken down |
| Preview own unpublished listing               | ❌    | ❌         | ✅                | needs _Allow publishing_ + full marketplace access                                                                               |
| View My Account (Purchases, Favourites)       | ❌    | ✅         | ✅                | any logged-in user                                                                                                               |
| View My Contributions                         | ❌    | ❌         | ✅                | needs _Allow publishing_ + full marketplace access                                                                               |
| Action                                        | Guest | Member     | Publisher         | Notes                                                                         |
| --------------------------------------------- | ----- | ---------- | ----------------- | ----------------------------------------------------------------------------- |
| Browse / search / view published listing      | ✅    | ✅         | ✅                |                                                                               |
| Download free published version               | ✅    | ✅         | ✅                | no login required                                                             |
| Favourite a listing                           | ❌    | ✅         | ✅                | per-user                                                                      |
| Buy a paid listing                            | ❌    | ✅         | ✅                |                                                                               |
| Download paid version                         | ❌    | owned only | ✅ (own listing)  |                                                                               |
| Write / edit a review                         | ❌    | ✅         | ✅ (others' only) | one per listing; not on own listing                                           |
| Report another user's review                  | ❌    | ✅         | ✅ (others' only) | one per review; not your own                                                  |
| Create / edit / unpublish listings & versions | ❌    | ❌         | ✅                | needs _Allow publishing_ + full marketplace access (not a Restricted contact) |
| Preview own unpublished listing               | ❌    | ❌         | ✅                | needs _Allow publishing_ + full marketplace access                            |
| View My Account (Purchases, Favourites)       | ❌    | ✅         | ✅                | any logged-in user                                                            |
| View My Contributions                         | ❌    | ❌         | ✅                | needs _Allow publishing_ + full marketplace access                            |

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
  reject a submission; "Rejected" is set in the AOS. The storefront shows the
  author the **latest** rejection reason, but not the full rejection history.
- **Product moderation is back-office only.** Freezing, taking down and restoring
  a listing are AOS actions; there is no storefront UI for the moderator. The
  moderation reason is shown to the publisher (in contributions), the admin, and
  to a buyer who purchased the product (via a dialog in My Purchases) — never on
  the public storefront.
- **Review moderation is AOS only.** Buyers can _report_ a review from the
  storefront, but hiding, restoring, and dismissing reports are done by an admin
  in the AOS — there is no storefront moderation UI. A hidden review still counts
  toward the rating (only its comment is removed), and a user who already reported
  a review can't report it again.
- **A free listing is never "owned."** Ownership records exist only for paid
  purchases, so free listings won't appear under My Purchases.
- **No-payment checkout fails silently.** If online payment is off or no provider
  is configured, the checkout page still renders the cart and total but shows no
  payment buttons and no message — the buyer is left with no way to pay and no
  explanation. (The "Online payment is not available." / "Payment options are
  not configured." messages exist only as server-side guards that the UI never
  reaches, since no button renders to trigger them.)
- **Order/invoice creation is best-effort, with no automatic retry.** The sale
  order + invoice are created after checkout responds, so they can briefly lag,
  and an order stays **pending** if creation fails. There is no automatic retry;
  a pending order is recovered from the AOS, not the storefront.
- **Archiving a review doesn't fix the aggregates.** The review disappears from
  the listing page, but the average rating and rating count are only recomputed
  when a review is saved or deleted through the storefront — an AOS-side archive
  leaves the old rating baked into the average.
- **Version-number uniqueness is app-level only.** Unlike slugs (backed by a
  database constraint), the "must be unique within the listing" rule for version
  numbers is enforced only by the save-time check — two simultaneous saves of
  the same number could both get through.
- **Contributions revenue can under-report across currencies.** The overview
  converts each purchase to the contributor's currency at its purchase-date
  rate; a purchase whose charged currency has no exchange rate to the
  contributor's currency is **left out** of the revenue total and chart (rather
  than counted at face value), so revenue can be lower than the raw takings.

---

_This document describes observed product behaviour and is intended as a living
spec — update it alongside functional changes._
