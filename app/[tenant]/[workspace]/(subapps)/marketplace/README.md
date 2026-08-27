# Marketplace subapp

A storefront for Axelor add-ons — **skills** and **apps** — inside a portal
workspace. Members browse, buy, download, and review listings; contributors
publish and version their own.

Mounted at `/<tenant>/<workspace>/marketplace`.

## Docs

- **[SPEC.md](./SPEC.md)** — _what it does._ Functional spec for product, design,
  support, and QA: roles, catalogue, listing pages, pricing, checkout, the
  publishing/version lifecycle, configuration, permissions, and limitations.

For _how it's built_, the code is the source of truth — start in `common/`
(`actions/` for server entry points, `orm/` for queries and access filters,
`ui/` for components). Pricing has a canonical narrative in the header comment
of `common/utils/price.ts`.
