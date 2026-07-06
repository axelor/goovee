# 2.0.1 (2026-07-06)

## Fixes

### Core Platform

- Delay and retry HUB PISP payment link fetch on webhook – #115301
  <details>
    <summary>Details</summary>

  The payment link is not immediately queryable on the BPCE PS side when the webhook fires, so the handler's first GET payment-link returned 400 and the notification was lost (BPCE never redelivers), delaying payment confirmation until the expiry backstop (~30 min). The webhook handler now waits 2 seconds before each GET, as prescribed by BPCE, and retries on 400 up to 3 attempts before falling back to the expiry backstop.
  </details>

### Forum

- Stop emailing forum post authors about their own posts – #114362
  <details>
    <summary>Details</summary>

  Forum post authors no longer receive an email notification for their own posts. Other group members are still notified based on their notification settings.
  </details>

- Validate forum server-action inputs and enforce group access – #114338
  <details>
    <summary>Details</summary>

  The forum addPost, fetchPosts, and fetchGroupsByMembers server actions now validate their inputs with zod like the other forum actions. addPost also verifies the user can access the target group before creating a post, and fetchGroupsByMembers whitelists the orderBy shape instead of forwarding an arbitrary object to the ORM.
  </details>

### E-Shop

- Fix empty shop catalogue when prices are fetched from the web service after login – #114662
  <details>
    <summary>Details</summary>

  For workspaces configured to fetch prices from the web service after login, the product listing, product detail, cart, order creation and quotation requests now correctly load products and prices instead of showing an empty catalogue.
  </details>

### Content

- Fix website seeding script failing on AOSMetaJsonField create – #114987

## Changes

### Core Platform

- Centralize sub-app access checks and speed up sub-app pages – #114537
  <details>
    <summary>Details</summary>

  Access to each sub-app is now verified by a single consistent check wherever the sub-app is opened, replacing the separate checks each area used before. Sub-app pages also load faster: the information needed to show them is gathered more efficiently and reused while a page is built instead of being fetched repeatedly, and each area now loads only the settings it needs. None of this changes what users can access, see, or pay — the portal simply does less redundant work and responds more quickly.
  </details>

- Introduce a common AOS REST client and fix ticket version-mismatch detection – #114533
  <details>
    <summary>Details</summary>

  Centralized every AOS REST call behind a single per-instance client, so authentication, the base URL, the response envelope and error handling live in one place; the events, invoices, shop, product, ticketing and website calls now go through it. A ticket update edited from two places at once now reports the version mismatch regardless of the AOS platform version or the AOS user's role, so the refresh prompt is shown again.
  </details>

- Send guests to login instead of a not-found page for an unavailable sub-app – #114514
  <details>
    <summary>Details</summary>

  When a signed-out visitor opens a sub-app that exists but isn't available to them, they are now taken to the login page — and returned to the page they wanted after signing in — instead of a page-not-found. A signed-in visitor who isn't allowed the sub-app now sees an access-denied page. A sub-app that genuinely doesn't exist or isn't enabled still shows page-not-found. This is consistent across every sub-app.
  </details>

### Events

- Introduce a common AOS REST client and fix ticket version-mismatch detection – #114533
  <details>
    <summary>Details</summary>

  Centralized every AOS REST call behind a single per-instance client, so authentication, the base URL, the response envelope and error handling live in one place; the events, invoices, shop, product, ticketing and website calls now go through it. A ticket update edited from two places at once now reports the version mismatch regardless of the AOS platform version or the AOS user's role, so the refresh prompt is shown again.
  </details>

### Invoices

- Introduce a common AOS REST client and fix ticket version-mismatch detection – #114533
  <details>
    <summary>Details</summary>

  Centralized every AOS REST call behind a single per-instance client, so authentication, the base URL, the response envelope and error handling live in one place; the events, invoices, shop, product, ticketing and website calls now go through it. A ticket update edited from two places at once now reports the version mismatch regardless of the AOS platform version or the AOS user's role, so the refresh prompt is shown again.
  </details>

### E-Shop

- Introduce a common AOS REST client and fix ticket version-mismatch detection – #114533
  <details>
    <summary>Details</summary>

  Centralized every AOS REST call behind a single per-instance client, so authentication, the base URL, the response envelope and error handling live in one place; the events, invoices, shop, product, ticketing and website calls now go through it. A ticket update edited from two places at once now reports the version mismatch regardless of the AOS platform version or the AOS user's role, so the refresh prompt is shown again.
  </details>

### Helpdesk

- Introduce a common AOS REST client and fix ticket version-mismatch detection – #114533
  <details>
    <summary>Details</summary>

  Centralized every AOS REST call behind a single per-instance client, so authentication, the base URL, the response envelope and error handling live in one place; the events, invoices, shop, product, ticketing and website calls now go through it. A ticket update edited from two places at once now reports the version mismatch regardless of the AOS platform version or the AOS user's role, so the refresh prompt is shown again.
  </details>

### Content

- Introduce a common AOS REST client and fix ticket version-mismatch detection – #114533
  <details>
    <summary>Details</summary>

  Centralized every AOS REST call behind a single per-instance client, so authentication, the base URL, the response envelope and error handling live in one place; the events, invoices, shop, product, ticketing and website calls now go through it. A ticket update edited from two places at once now reports the version mismatch regardless of the AOS platform version or the AOS user's role, so the refresh prompt is shown again.
  </details>
