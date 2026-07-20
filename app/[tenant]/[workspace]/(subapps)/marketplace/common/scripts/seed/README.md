# Marketplace seed

Idempotent demo seeder + teardown for the marketplace subapp.

## What it seeds

- `AOSMarketplaceAxelorVersion` rows (upsert by `name`) — compatibility versions referenced by product versions.
- `AOSProductCategory` rows with `forMarketPlace=true` (upsert by `code`), scoped to the `--workspace`, with a `slug` derived from the name.
- `AOSProduct` rows (upsert by `code` — must start with `mkt-demo-`), each linked to the workspace's marketplace pricing defaults and the supplier partner.
- `AOSMarketplaceProductVersion` rows per product (upsert by `(product, versionNumber)`).
- `AOSMetaFile` for the shared bundle (`mkt-demo-bundle.zip`, checked in next to the script) — uploaded once and referenced by every seeded version's `bundleFile`. AOS requires a non-null bundleFile; demo contents don't matter.
- `AOSMetaFile` for the two shared screenshots (`public/pwa/screenshots/desktop-screenshot.png` + `mobile-screenshot.png`) — uploaded once.
- `AOSProductPicture` rows linking 0..9 of the shared screenshots to each product (cycling by product index in `seed.json`).
- `AOSMarketplaceReview` rows per product (upsert by `(product, author)`).
- Product `currentVersion` pointer refreshed to the latest published version after upserting versions.
- `averageRating` and `ratingCount` recomputed from review rows.

The whole seed run is wrapped in a `$transaction` — any failure rolls everything back.

## Prerequisites that must exist (fail-fast)

The script does **not** create these — the run errors out with a clear message if any are missing:

- The workspace passed via `--workspace=<url>` and its `PortalAppConfig.marketplaceDefault{SaleCurrency,Unit,ProductFamily}`.
- The default supplier partner passed via `--supplier=<email>` (matched on `AOSPartner.emailAddress.address`).
- Any reviewer email referenced in `reviews[].authorEmail`.

## File layout

```
common/scripts/seed/
  validators.ts        # Zod schema — source of truth for runtime validation
  seed.schema.json     # JSON Schema — for editor / IDE support inside seed.json
  seed.json            # the demo data (you author it)
  validate.ts          # cross-field rules (date / version ordering, uniqueness)
  lookups.ts           # fail-fast lookups (partner by email, category by code, …)
  upsert.ts            # upsertCategory / upsertCompatibilityVersion / upsertProduct / upsertVersion / upsertReview / upsertShared{Bundle,Screenshot}MetaFile / upsertScreenshots / refreshCurrentVersion / recomputeRatings
  run.ts               # CLI entry — validates seed.json then orchestrates the transaction
  reset.ts             # CLI entry — deletes everything matching `mkt-demo-%`
  mkt-demo-bundle.zip  # dummy bundle shared by every seeded version. Also contains `reviewer-emails.txt` — extract to see available partner emails.
  AUTHORING.md         # data-authoring guide for filling out seed.json
  README.md            # this file
```

> The `validators.ts` filename intentionally avoids the `seed.schema` basename so module resolution doesn't pick `seed.schema.json` over the `.ts` source under @swc-node/register.

## How to run — seed

```
pnpm marketplace:seed \
  --tenant=d \
  --workspace=http://localhost:3000/d/india \
  --supplier=info@apollo.fr
```

Flags:

- `--tenant` — tenant id. Defaults to `d` when `MULTI_TENANCY=false`.
- `--workspace` — the workspace URL the products belong to. Required.
- `--supplier` — default supplier email; per-product `supplierEmail` overrides this. Required.
- `--file` — path to the seed JSON. Defaults to `seed.json` next to `run.ts`.
- `--validate` — run only the schema + cross-field validation; no DB writes.
- `--help` — show usage.

## How to run — reset

```
pnpm marketplace:reset --tenant=d
```

Flags:

- `--tenant` — same defaults as above.
- `--yes` — skip the confirmation prompt.
- `--help` — show usage.

Deletes everything matching `mkt-demo-%` (products, their versions / reviews / downloads / purchases / pictures, plus the seeded MetaFile rows) inside one `$transaction`, then best-effort unlinks the matching files from tenant storage. Categories and Axelor compatibility versions are intentionally **not** touched — they're shared dictionary data.

## Authoring `seed.json`

Point the editor at the JSON Schema for autocomplete:

```jsonc
{
  "$schema": "./seed.schema.json",
  "categories": [{"code": "AI-AGENTS", "name": "AI Agents"}],
  "compatibilityVersions": [
    {
      "name": "v9.0.9",
      "title": "Axelor 9.0.9",
      "releaseDateTime": "2026-05-13T00:00:00Z",
    },
  ],
  "products": [
    {
      "code": "mkt-demo-bpm-generator",
      "slug": "bpm-workflow-generator",
      "name": "BPM Workflow Generator",
      "description": "Auto-generates BPM workflows from a JSON spec.",
      "type": "skill",
      "iconCode": "icon-7",
      "coverStyle": "gradient-3",
      "categoryCode": "AI-AGENTS",
      "price": 0,
      "versions": [
        {
          "versionNumber": "1.0.0",
          "status": "published",
          "submittedAt": "2024-09-04T10:00:00Z",
          "releasedAt": "2024-09-09T15:00:00Z",
          "compatibilityVersions": ["v9.0.9"],
        },
      ],
      "reviews": [
        {
          "authorEmail": "alice@example.com",
          "rating": 5,
          "comment": "Saves me hours.",
        },
        {"authorEmail": "bob@example.com", "rating": 4},
      ],
    },
  ],
}
```

See `AUTHORING.md` for the full field reference, cardinality targets, and cross-field rules.

## Notes

- **Idempotency** — re-running the seeder updates existing rows in place. Re-running reset + seed leaves storage in a fresh state. Match keys are documented inline in `upsert.ts`.
- **Bundle file** is the single `mkt-demo-bundle.zip` checked in next to this script. Every seeded version's `bundleFile` points at the same MetaFile row.
- **Screenshots** aren't in the JSON; the seeder links 0..9 of the two shared PWA screenshots per product (cycling by product index).
- **Code prefix** — `mkt-demo-` is mandatory for product `code`. The schema rejects anything else so reset can target seeded rows only.
