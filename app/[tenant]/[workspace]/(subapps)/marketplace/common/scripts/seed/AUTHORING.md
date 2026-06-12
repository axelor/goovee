# Marketplace seed — data authoring guide

Hand this file (plus `seed.schema.json` in the same directory) to whoever
is writing `seed.json`. It explains **what** to put in, **how much**, and
**the cross-field rules** that the schema alone can't express.

The runtime is `common/scripts/seed/run.ts`; the validation schema is
`seed.schema.json` (mirror of `seed.schema.ts`).

---

## Goal

Populate the marketplace with realistic-looking demo content so every
surface exercises non-trivial data:

- **Listings** (Skills hub, Apps Studio) — categories, sort, pagination.
- **Product detail** — Overview, Versions tab, Reviews tab (with pagination), Support tab.
- **Cart & checkout** — paid products that can be added, paid products with multi-version (to exercise "in cart"), free products that skip checkout.
- **My contributions** — supplier-side dashboard (all seeded products are owned by one supplier).
- **Compatibility filter** on the detail page — multiple Axelor versions referenced.

---

## Cardinality targets

| Bucket                           | Count                                                               |
| -------------------------------- | ------------------------------------------------------------------- |
| **Skills** (open-source plugins) | 10–15                                                               |
| **Apps** (paid apps)             | 10–15                                                               |
| **Total products**               | ≈ 20–30                                                             |
| **Compatibility versions**       | 6–10 (covering at least 2 major Axelor lines, e.g. 8.5.x and 9.0.x) |
| **Marketplace categories**       | 5–8                                                                 |

Spread across the buckets:

| Coverage dimension          | What to include                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Free vs paid                | ~60% paid, ~40% free overall. Skills lean free; apps lean paid. At least 3 paid skills and 3 free apps so the mix isn't a cliché.                                                                                                                                                                                            |
| Single vs multiple versions | About half the products have one version. The other half have 2–4 versions.                                                                                                                                                                                                                                                  |
| Version status              | Most have all-published versions. A few products have one or two `draft` versions in addition to the published ones (to exercise "current points at newest published"). At least one product where the only version is `draft` (no current version → product won't appear in public listings; visible only to the supplier). |
| Review count per product    | Mix of: 0 reviews (3–5 products), 1–3 reviews (most products), 15–25 reviews (at least 2 products to exercise pagination — the marketplace's review tab paginates at 4 per page).                                                                                                                                            |
| Review style                | Mostly rating + comment. **At least 30% of reviews are rating-only** (omit `comment`) to test the rating-only display path. Spread ratings 1–5 so the histogram looks plausible.                                                                                                                                             |
| Compatibility breadth       | Some versions list **no** compatibility (omit `compatibilityVersions`). Most list 1–3. A few list 5+.                                                                                                                                                                                                                        |
| Categories per product      | Each product picks exactly one `categoryCode`. Distribute products across all categories — don't cluster everything into one.                                                                                                                                                                                                |
| `description`               | **One-liner only.** ~60–140 characters. No line breaks, no markup. It's shown as a single-line, line-clamped string on cards.                                                                                                                                                                                                |
| `longDescription`           | **HTML, as produced by a rich-text editor.** Use real tags (`<p>`, `<h3>`, `<ul>`/`<li>`, `<strong>`, `<em>`, `<a href="…">`, optionally `<code>` or `<pre>`). 1–4 paragraphs is plenty. Don't include `<html>` / `<body>` / inline styles / scripts — just the body fragment.                                               |
| Optional URLs               | About half the products have `documentationUrl`, `supportIssuesUrl`, `supportContactUrl`. Realistic-looking dummy hosts (`docs.example.com`, etc.).                                                                                                                                                                          |

---

## Top-level shape

```jsonc
{
  "$schema": "./seed.schema.json",
  "categories": [
    /* Category[] */
  ],
  "compatibilityVersions": [
    /* CompatibilityVersion[] */
  ],
  "products": [
    /* Product[] */
  ],
}
```

`categories` and `compatibilityVersions` are optional in the schema, but
**include them** — the seeder upserts them by stable key before products
are processed, and any product referencing a missing one fails fast.

---

## Available partner emails

The seed needs real `AOSPartner` emails for two things:

- **`product.supplierEmail`** — the seller who owns the product. Pick
  from the **Customers** section (rows with `is_customer = true`).
- **`reviews[].authorEmail`** — the reviewer. Pick from **anywhere**
  (customers + contacts both work).

A snapshot of the available emails (grouped by Customers / Contacts) is
shipped inside `mkt-demo-bundle.zip` next to this script — unzip to read
`reviewer-emails.txt`:

```
unzip -p mkt-demo-bundle.zip reviewer-emails.txt | less
```

The same zip is uploaded as the dummy bundle attached to every seeded
version (AOS requires a non-null `bundleFile`; the contents don't
matter for the demo).

If you pick an email that isn't in the snapshot, the seeder will fail
fast with `Partner with email '…' not found.` — a typo never silently
slips through.

---

## Field reference

### Category

| Field        | Type   | Required | Constraints / notes                                                                            |
| ------------ | ------ | -------- | ---------------------------------------------------------------------------------------------- |
| `code`       | string | ✅       | `^[A-Z][A-Z0-9-]+$` (uppercase, digits, dashes; starts with a letter). Used as the upsert key. |
| `name`       | string | ✅       | Display name.                                                                                  |
| `iconCode`   | string | optional | AOS icon code (e.g. `'fa-code'`). Leave out for now.                                           |
| `colorTheme` | string | optional | Same.                                                                                          |

### CompatibilityVersion

| Field             | Type                 | Required | Constraints                                                                                  |
| ----------------- | -------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `name`            | string               | ✅       | Pattern `^v\d+\.\d+\.\d+$`. Upsert key. Example: `"v9.0.9"`.                                 |
| `title`           | string               | ✅       | Display label. Convention: `"Axelor 9.0.9"`.                                                 |
| `releaseDateTime` | ISO date-time string | optional | Use realistic dates spread over the last 12 months so the "released on" sort is non-trivial. |

### Product

| Field               | Type      | Required | Constraints / notes                                                                                                                                                                                                                                                                   |
| ------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `code`              | string    | ✅       | Pattern `^mkt-demo-[a-z0-9-]+$`. **Must start with `mkt-demo-`** — it's the upsert key and the prefix that future reset scripts will target.                                                                                                                                          |
| `slug`              | string    | ✅       | Pattern `^[a-z0-9-]+$`. Used in the URL `/marketplace/products/<slug>`. Must be unique across products (the live app stores it in `AOSProduct.slug` — a duplicate will silently make one product unreachable).                                                                        |
| `name`              | string    | ✅       | Display name.                                                                                                                                                                                                                                                                         |
| `supplierEmail`     | email     | optional | Override the default supplier (CLI `--supplier`) for this product. Pick from the **customer** section of the email list (see "Available partner emails" below). Leave out unless you want per-product variation.                                                                      |
| `description`       | string    | optional | ≤ 280 chars but aim for **60–140**. **One-liner, plain text, no line breaks, no markup.** Rendered as a single line-clamped string on product cards.                                                                                                                                  |
| `longDescription`   | string    | optional | **HTML fragment**, as produced by a rich-text editor. Use semantic tags (`<p>`, `<h3>`, `<ul>`/`<li>`, `<strong>`, `<em>`, `<a>`, optional `<code>`/`<pre>`). Shown on the detail page Overview tab via `<InnerHTML>`. No `<html>`/`<body>` wrappers, no inline `style=`, no scripts. |
| `type`              | enum      | ✅       | `'skill'` (Skills hub) or `'app'` (Apps Studio).                                                                                                                                                                                                                                      |
| `iconCode`          | string    | ✅       | Pattern `^icon-(1[0-2]                                                                                                                                                                                                                                                                | [1-9])$`— i.e.`icon-1`…`icon-12`. Pick to match the product theme (e.g. cog for productivity, lightning for AI). |
| `coverStyle`        | string    | ✅       | Pattern `^gradient-(10                                                                                                                                                                                                                                                                | [1-9])$`—`gradient-1`…`gradient-10`. Spread these across products so the listing grid looks varied.              |
| `categoryCode`      | string    | ✅       | Must equal a `Category.code` either present in `categories[]` of this seed or already in the DB.                                                                                                                                                                                      |
| `price`             | number    | ✅       | `≥ 0`. `0` = free product (skips checkout entirely). Paid example values: `9.99`, `19`, `49.50`, `99`, `199`, `499`. Use realistic round-ish numbers; mix decimals and integers.                                                                                                      |
| `installCount`      | int       | optional | Fake install count (≥ 0) so the listing has variety. Spread plausibly: a few new products at 0–20, many in the hundreds (e.g. 120, 340, 880), a couple of "popular" ones in the thousands or tens of thousands (e.g. 3,500, 12,400). Don't make every product the same.               |
| `documentationUrl`  | URL       | optional | Realistic-looking dummy URL.                                                                                                                                                                                                                                                          |
| `supportIssuesUrl`  | URL       | optional | Same.                                                                                                                                                                                                                                                                                 |
| `supportContactUrl` | URL       | optional | Same.                                                                                                                                                                                                                                                                                 |
| `versions`          | Version[] | ✅       | At least one. See variation rules below.                                                                                                                                                                                                                                              |
| `reviews`           | Review[]  | optional | See variation rules.                                                                                                                                                                                                                                                                  |

> **Screenshots** aren't in the JSON. The seeder hardcodes two shared
> images (`public/pwa/screenshots/desktop-screenshot.png` and
> `mobile-screenshot.png`) and links a varying number per product
> (0–9, cycling by index) so the Overview tab shows different counts
> across the listing. No action required in `seed.json`.

### Version

| Field                   | Type         | Required      | Constraints                                                                                                                                                                             |
| ----------------------- | ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `versionNumber`         | string       | ✅            | Pattern `^\d+\.\d+\.\d+$`. Semver. Per product, must be unique across versions.                                                                                                         |
| `changelog`             | string       | optional      | Plain text or markdown-ish. ≤ a few short paragraphs.                                                                                                                                   |
| `status`                | enum         | ✅            | `'draft'` or `'published'`.                                                                                                                                                             |
| `submittedAt`           | ISO datetime | conditionally | **Required** when `status: 'published'`; **must be omitted** when `status: 'draft'`. When the supplier submitted the version for review. Must be ≤ `releasedAt`.                        |
| `releasedAt`            | ISO datetime | conditionally | **Required** when `status: 'published'`; **must be omitted** when `status: 'draft'`. The release / approval date — shown as "Released on" in the UI and used to order the versions tab. |
| `compatibilityVersions` | string[]     | optional      | Each entry must equal a `CompatibilityVersion.name` declared above or already in the DB.                                                                                                |

> **Bundle file** is not in the JSON. AOS requires every version to
> carry a `bundleFile`, but the seed uses a single shared zip
> (`mkt-demo-bundle.zip`, checked in next to the script) for every
> seeded version. No action needed in `seed.json`.

### Review

| Field                   | Type    | Required | Constraints                                                                                                                                                                                                      |
| ----------------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authorEmail`           | email   | ✅       | **Must match an existing AOSPartner's `emailAddress.address`**. Use **any** email from the list (customer **or** contact). The seeder fails fast if the email isn't found. See "Available partner emails" below. |
| `rating`                | int 1–5 | ✅       |                                                                                                                                                                                                                  |
| `comment`               | string  | optional | **Omit on ~30% of reviews** to seed rating-only entries. Realistic short comments are fine (1–3 sentences).                                                                                                      |
| `reviewedVersionNumber` | string  | optional | Must equal one of the product's `versions[].versionNumber`. If omitted, the seeder uses the latest **published** version.                                                                                        |

---

## Cross-entity validation rules

The schema can't enforce these — the seeder does, and a violating
`seed.json` will fail with a clear message:

1. **`categoryCode` must resolve.** Either present in `categories[]` of this file, or already in the DB with `forMarketPlace=true`. The seeder fails listing existing codes if missing.
2. **`compatibilityVersions[name]` must resolve.** Either in this file's `compatibilityVersions[]` or in the DB. Order of seeding inside the script puts compat versions before products, so cross-file references work naturally.
3. **`authorEmail` must resolve.** Reviewer must exist as an `AOSPartner`. Mention this to whoever runs the seeder — they may need to ensure the partner data exists first.
4. **Bundle file** is taken from `mkt-demo-bundle.zip` next to the script — no per-version path in the JSON.
5. **Product `slug` must be unique** across all seeded products. The seeder doesn't check this explicitly (the DB enforces it via the AOS column), but the resulting error is uglier than a self-check, so just keep them unique.
6. **`code` must be unique** across all seeded products. Same logic.
7. **Versions per product must have unique `versionNumber`** (DB-enforced).
8. **Reviews per product must have unique `authorEmail`** — only one review per (author, product) pair (the upsert key). If you put two reviews from the same author on the same product, the second overwrites the first.

### Date and version ordering

The seeder enforces these rules in `validate.ts` and reports **all**
violations at once before touching the DB. The data must be _historically
plausible_ — a casual reader of "My contributions" or the Versions tab
should never spot a date that contradicts the status or the version
number.

1. **Status drives dates.**

   - `status: 'draft'` → **must omit** both `submittedAt` and `releasedAt`. A draft has not yet been submitted.
   - `status: 'published'` → **must include both** `submittedAt` and `releasedAt`. An admin can't approve what was never submitted.

2. **`submittedAt` ≤ `releasedAt`.** A version can't be approved before it was submitted. For realistic spacing, leave a gap of a few hours to a few days between the two.

3. **Higher semver = later `releasedAt`.** Within a single product, sorting the published versions by semver ascending must give the same order as sorting by `releasedAt` ascending. E.g.:

   ```
   v1.7.0  released 2024-03-15  ✅
   v1.7.1  released 2024-04-02  ✅  patch came later
   v1.8.0  released 2024-09-10  ✅  minor bump even later
   v2.0.0  released 2025-02-01  ✅  major bump latest
   ```

   The following would be **rejected**:

   ```
   v1.8.0  released 2024-06-01      ← violates ordering
   v1.7.0  released 2024-09-15  ❌
   ```

4. **`currentVersion` is auto-derived** by `refreshCurrentVersion` after upsert: it picks the published version with the **latest `releasedAt`**. So your `releasedAt` dates are also what determines which version the public-facing detail page treats as current. If you want a specific version to be "current," make sure its `releasedAt` is the most recent among published versions on that product.

5. **Compatibility version `releaseDateTime`** (top-level array) should also follow a believable timeline (Axelor releases roughly every 2 weeks per minor line). Order isn't enforced across the array, but pick dates that match the implied release cadence — e.g. `v9.0.7` somewhere mid-2024 and `v9.0.9` mid-2025.

6. **Don't put `releasedAt` in the future.** Use historical dates so "Released X days ago" makes sense. Same for `submittedAt`.

7. **Spread dates plausibly across products.** Different products release on different cadences. Don't make every product's `v1.0.0` land on the same day.

### `currentVersion` rule (enforced by the seeder, not the schema)

The seeder calls `refreshCurrentVersion` after each product's versions
are upserted. It picks the **newest published version** as
`product.currentVersion` (newest by `approvalDateTime`, which the seeder
sets to "now" at insert time — so the **last published version in the
JSON array order wins**).

Implication for you: **for any product that should be publicly visible,
make sure at least one of its versions has `status: "published"`.** A
product whose only version is `draft` will not appear in the public
listing (`getPublishedProductFilter` requires a published version on the
product). It will still appear in "My contributions" for the supplier.

Use this to your advantage:

- Most products → at least one published version.
- 1 product → only `draft` versions (testing the "draft-only product is hidden" path).
- A few products → mix of `draft` + `published` versions (testing "draft sits above published in the versions tab, current still points at the latest published").

---

## Variation matrix to aim for (rough breakdown)

Use this as a checklist. Numbers are flexible, but try to hit each row.

| #   | Variation                                                                  | Target products |
| --- | -------------------------------------------------------------------------- | --------------- |
| 1   | Skill, free, single version, 0 reviews                                     | 1–2             |
| 2   | Skill, free, multi-version (2–4 versions), few reviews                     | 2–3             |
| 3   | Skill, paid, single version, few reviews                                   | 2               |
| 4   | Skill, paid, multi-version, many reviews (15–25, mixed comment/no-comment) | 1               |
| 5   | App, free, single version, few reviews                                     | 2               |
| 6   | App, paid, single version, 0 reviews                                       | 1               |
| 7   | App, paid, multi-version, few reviews                                      | 3–4             |
| 8   | App, paid, multi-version, **many reviews** (15–25)                         | 1               |
| 9   | Any type, all versions `draft` (hidden product)                            | 1               |
| 10  | Any type, mix of `draft` + `published` versions                            | 1–2             |
| 11  | Version with empty `compatibilityVersions`                                 | 2–3 (sprinkled) |
| 12  | Version with 5+ compatibility versions listed                              | 1–2             |

---

## Style guidance for names / descriptions

- Product names should sound like realistic Axelor add-ons: "BPM Workflow Generator", "Stock Forecast Toolkit", "ERP Health Inspector", "Tax Routing Assistant".
- `description` is **one sentence**, ≤ 140 chars, no markup. It describes what the add-on does, plainly.
- `longDescription` is a **rich-text-editor HTML fragment**. Mix tags so the styling is non-trivial: a short intro paragraph, a `<h3>` section header, a bullet list of capabilities, a closing paragraph with a `<a>` link. Don't repeat the `description` verbatim.
- Avoid in-jokes or filler text ("Lorem ipsum", "TODO"). The seed is for demos, the data is read by humans.

---

## Example product (showing all the pieces)

```jsonc
{
  "code": "mkt-demo-bpm-workflow-generator",
  "slug": "bpm-workflow-generator",
  "name": "BPM Workflow Generator",
  "description": "Generate BPMN workflows from a YAML spec — no clicking around in the editor.",
  "longDescription": "<p>A code-first complement to the BPM Studio. Define your process in a YAML file, run a single command, and the toolkit emits the BPMN XML and registers it against your workflow engine.</p><h3>What it does</h3><ul><li>Compiles YAML process definitions into valid BPMN 2.0 XML.</li><li>Validates against the schema before installing — bad definitions fail loud at build time.</li><li>Supports timer events, sub-processes, and inclusive gateways.</li></ul><p>Pairs well with <a href=\"https://docs.example.com/bpm-studio\">BPM Studio</a> for hand-tuning the generated diagrams afterwards.</p>",
  "type": "skill",
  "iconCode": "icon-7",
  "coverStyle": "gradient-3",
  "categoryCode": "PRODUCTIVITY",
  "price": 0,
  "documentationUrl": "https://docs.example.com/bpm-workflow-generator",
  "supportIssuesUrl": "https://github.com/example/bpm-workflow-generator/issues",
  "versions": [
    {
      "versionNumber": "1.0.0",
      "status": "published",
      "changelog": "Initial release.",
      "submittedAt": "2024-09-04T10:00:00Z",
      "releasedAt": "2024-09-09T15:00:00Z",
      "compatibilityVersions": ["v9.0.0"],
    },
    {
      "versionNumber": "1.1.0",
      "status": "published",
      "changelog": "Adds support for sub-processes and timer events.",
      "submittedAt": "2025-02-10T11:30:00Z",
      "releasedAt": "2025-02-14T17:00:00Z",
      "compatibilityVersions": ["v9.0.9"],
    },
    {
      "versionNumber": "2.0.0",
      "status": "draft",
      "changelog": "WIP rewrite on the new BPMN runtime.",
    },
  ],
  "reviews": [
    {
      "authorEmail": "l.michel@apollo.fr",
      "rating": 5,
      "comment": "Saves me hours every sprint.",
    },
    {"authorEmail": "d.garcia@apollo.fr", "rating": 4},
    {
      "authorEmail": "l.david@apollo.fr",
      "rating": 5,
      "comment": "Stable, well-documented, just works.",
    },
  ],
}
```

Notes on this example:

- Always use plain `X.Y.Z` for `versionNumber` — pre-release suffixes like `2.0.0-beta` fail schema validation.
- Two `published` versions present, so `currentVersion` resolves to `1.1.0` (the published version with the latest `releasedAt` — `2.0.0` is `draft`, doesn't qualify).
- Dates obey all the ordering rules: each version's `submittedAt` is a few days before its `releasedAt`, and the higher semver (`1.1.0`) is released later than the lower (`1.0.0`). The `2.0.0` draft correctly has no dates.
- One review is rating-only (`d.garcia@apollo.fr`).
- The bundle reuses `images/logo.png` for every version — fine, the seeder just needs any file.

---

## Out of scope (don't include)

- `purchases[]` / buyer relationships — not in the schema.
- Cart / checkout state — purely runtime, never persisted via seed.
- Pricing tax overrides — workspace defaults handle this.
- Currency overrides per product — workspace default is the only currency.
- AOS Java fixtures (sale-order workflow seeds, etc.) — handled outside this seeder.
