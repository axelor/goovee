# 1.8.2 (2026-07-20)

## Fixes

### Events

- Fix duplicated base path in notification "View" links – #115320
  <details>
    <summary>Details</summary>

  Under a base path deployment, the "View" link on an unread notification pointed to a URL where the base path was repeated and led to a not-found page. Invoice, event, news, forum and ticketing notifications now link to the correct page.
  </details>

- Speed up the events list and file routes, add a detail loading skeleton – #114472
  <details>
    <summary>Details</summary>

  Events pages do less redundant work when loading. The events list query now resolves the accessible categories first and then filters events, avoiding a database join explosion from the privacy filters while keeping the same visibility. The event image and comment-attachment routes no longer recompute the whole event (with its backend pricing call) just to read one id; they use a minimal access-checked lookup instead. Opening an event now shows a loading skeleton immediately while its content is fetched. What users can access, see and pay is unchanged.
  </details>

### Forum

- Fix duplicated base path in notification "View" links – #115320
  <details>
    <summary>Details</summary>

  Under a base path deployment, the "View" link on an unread notification pointed to a URL where the base path was repeated and led to a not-found page. Invoice, event, news, forum and ticketing notifications now link to the correct page.
  </details>

### Invoices

- Fix duplicated base path in notification "View" links – #115320
  <details>
    <summary>Details</summary>

  Under a base path deployment, the "View" link on an unread notification pointed to a URL where the base path was repeated and led to a not-found page. Invoice, event, news, forum and ticketing notifications now link to the correct page.
  </details>

### News

- Fix duplicated base path in notification "View" links – #115320
  <details>
    <summary>Details</summary>

  Under a base path deployment, the "View" link on an unread notification pointed to a URL where the base path was repeated and led to a not-found page. Invoice, event, news, forum and ticketing notifications now link to the correct page.
  </details>

- Speed up news pages by memoizing the category lookup per request – #114594
  <details>
    <summary>Details</summary>

  Reduced redundant database work on the news pages. The news category lookup — previously repeated for each news block on a homepage or category page — is now request-memoized, so it runs once per request. What users can access and see is unchanged.
  </details>

### E-Shop

- Speed up shop product detail pages, home and product images – #114538
  <details>
    <summary>Details</summary>

  Shop pages now do less redundant work when loading. Product detail pages no longer run the full product query twice: page metadata uses a lightweight title/description lookup instead of replaying the complete product pipeline used for rendering, scoped to the same workspace catalog as the full page. The category list used across a shop page is now fetched once per request instead of repeatedly. The shop home page loads its featured categories in parallel instead of one after another, and product images are cached by the browser so a given image loads once instead of on every scroll and navigation. What users can access, see and pay is unchanged.
  </details>

### Helpdesk

- Fix duplicated base path in notification "View" links – #115320
  <details>
    <summary>Details</summary>

  Under a base path deployment, the "View" link on an unread notification pointed to a URL where the base path was repeated and led to a not-found page. Invoice, event, news, forum and ticketing notifications now link to the correct page.
  </details>
