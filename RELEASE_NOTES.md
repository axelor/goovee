# 1.7.4 (2026-07-06)

## Fixes

### E-Shop

- Fix empty shop catalogue when prices are fetched from the web service after login – #114662
  <details>
    <summary>Details</summary>

  For workspaces configured to fetch prices from the web service after login, the product listing, product detail, cart, order creation and quotation requests now correctly load products and prices instead of showing an empty catalogue.
  </details>
