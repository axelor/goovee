# 1.8.0 (2026-06-17)

## Features

### Core Platform

- Add AOS API key authentication for outbound webservice calls – #111996
  <details>
    <summary>Details</summary>

  Outbound Next.js → AOS calls now support API key authentication (AOS 9 / AOP 8.0+). Set AOS_API_KEY in your environment to use the API-KEY header; falls back to Basic Auth when unset. Basic Auth is retained for incoming AOS webhook validation.
  </details>

- Add pre-upload staged-upload mechanism – #113755
  <details>
    <summary>Details</summary>

  Files can be uploaded before the record that will own them exists. Staging a file returns an opaque single-use token, redeemed when the owning record is saved to link the file server-side without trusting a client-supplied id. Uploads are scoped to the staging user and a declared purpose, size-limited per purpose (enforced while the body streams to disk), and abandoned uploads expire and are reaped.
  </details>

- Add React taint protection for sensitive credentials – #RM-112141
  <details>
    <summary>Details</summary>

  Implemented experimental React taint API to prevent accidental serialization of sensitive server-side secrets to Client Components.
  </details>

- Display hyperlink title as hover tooltip on portal home page – #112429
  <details>
    <summary>Details</summary>

  Show the AOSPortalHyperlink.title field as a native tooltip on hover, and use it as the image alt for accessibility.
  </details>

- Optimize notification system with database-side filtering and type safety and input validation – #112410
  <details>
    <summary>Details</summary>

  Replace N+1 query pattern in webhook notification handler with database-side filtering using relation joins. Single findSubscribers() call now handles recipient filtering at the database level for all notification types (events, news, resources, forum, ticketing) with privacy access control. Add Zod input validation and improve type safety throughout the notification system. Performance improvement: reduces query count from 1000+ to typically 1-2 per webhook in scenarios with many activated users but few subscribers.
  </details>

- Show the logged-in user's avatar in the top header – #113772
  <details>
    <summary>Details</summary>

  The top-header account control now displays the logged-in user's profile picture instead of a generic icon. Falls back to the user's initials, and then a placeholder icon, when no avatar is set. The session now exposes the partner picture as the user image.
  </details>

- Support base path for subpath deployment – #113310
  <details>
    <summary>Details</summary>

  Goovee can now be deployed under any URL subpath (e.g. test.axelor.com/portal) by setting NEXT_PUBLIC_BASE_PATH at build time. All routing, API calls, payment callbacks, email links, push notifications, PWA manifest, service worker, and image/static asset URLs correctly include the configured base path. Authentication (better-auth) and client-side navigation are also base-path-aware. Note: when a base path is configured, three sets of external URLs must be updated to include the base path prefix — (1) workspace URLs stored in AOS (the portal looks up workspaces by matching on HOST+basePath, so a missing prefix causes all workspace lookups to fail); (2) OAuth callback URLs registered with identity providers (Google, Keycloak); (3) payment webhook URLs registered with payment providers.
  </details>

### Directory

- Add demo-data seeding script for directory company and contact profiles – #113659
  <details>
    <summary>Details</summary>

  Adds a tenant-scoped script that lists a curated set of existing customer companies and their contacts in the directory. It updates only directory fields (listing flag, visibility toggles, company description, display name, and a demo LinkedIn link for contacts), skips any email with no matching or wrong-type partner, never creates records, and is idempotent and transactional. Run with `pnpm directory:seed` and tear down with `pnpm directory:reset`.
  </details>

### Helpdesk

- Allow partial date filters in ticket search – #112615
  <details>
    <summary>Details</summary>

  Date filters now accept just 'from' or 'to' values. Previously both dates were required.
  </details>

## Fixes

### Core Platform

- Ensure data consistency with database transactions – #111991
  <details>
    <summary>Details</summary>

  Multi-step write operations across ticketing, events, forum, invoices, resources, addresses, and authentication now run atomically — if any step fails, all changes are rolled back.
  </details>

- Skip payment method dialog when only card payment is available – #113213
  <details>
    <summary>Details</summary>

  When bank transfer is not configured for an app, clicking 'Pay with Stripe' no longer shows a single-option selection dialog. The card payment flow is now triggered directly.
  </details>

- Staged-upload concurrency is enforced globally across all files – #114285
  <details>
    <summary>Details</summary>

  The upload concurrency limit now applies across every file the hook holds rather than per upload() call, and retries respect the same limit instead of starting immediately. A file whose upload fails to start no longer stays stuck.
  </details>

### Directory

- Require the directory opt-in flag for any contact detail returned – #114312
  <details>
    <summary>Details</summary>

  Directory access masking now fails safe: a gated field (email, phone, website, address, or a contact's details) can only be returned when its directory opt-in flag is also selected, so it is always checked before display. Masking behaviour and what each page shows are unchanged.
  </details>

### E-Shop

- Fix payment context marked as processed even when order creation fails – #112064
  <details>
    <summary>Details</summary>

  Payment context is now only marked as processed after order creation succeeds. If order creation fails, the context remains unprocessed, allowing the user to retry without data inconsistency.
  </details>

### Helpdesk

- Validate ticket status belongs to project before update – #112079
  <details>
    <summary>Details</summary>

  When updating a ticket's status (via closeTicket, cancelTicket, or direct status updates), the system now validates that the selected status actually belongs to the ticket's project. Previously, we would fetch the cancelled/done status globally without checking if it belonged to the project, unlike the UI which filters statuses by project. This ensures consistency and prevents setting invalid statuses.
  </details>

## Changes

### Core Platform

- Add Zod input validation and improve type safety in events – #112085
  <details>
    <summary>Details</summary>

  All events server actions now validate inputs with Zod schemas. ORM and action signatures simplified: workspace objects replaced with workspaceURL string, event objects replaced with eventId string. ORM-derived types replace any across events components and pages. Payment components are now generic over their action payload type so server action return types flow to onApprove without casts. formatNumber now returns string|null for nullable inputs.
  </details>

- Add Zod input validation to core payment SSE and website routes – #112090
  <details>
    <summary>Details</summary>

  Added Zod schema validation to payment SSE and website routes for improved type safety.
  </details>

- Eliminate client-side fetch for public environment variables – #113839
  <details>
    <summary>Details</summary>

  GOOVEE*PUBLIC*\* variables are now read server-side in the root layout and passed directly to the Environment provider as a prop. Removes the axios fetch to /api/config on every page load, the blank render gate while the request resolved, and the /api/config route itself. The runtime-injection guarantee is preserved: process.env is read at request time, not build time. The client-side environment store and getEnv() accessor were also removed: client code now reads public variables via useEnvironment() and server code reads process.env directly.
  </details>

- Migrate auth operations to credentials plugin with rate limiting – #111994
  <details>
    <summary>Details</summary>

  Migrate email-based registration and password reset flows to use credentials plugin for centralized authentication with built-in rate limiting. This improves security by delegating credential management to a dedicated service and prevents brute-force attacks through automatic rate limiting.
  </details>

- Migrate PayPal checkout to PayPal SDK v6 (react-paypal-js v9) – #111993
  <details>
    <summary>Details</summary>

  PayPal checkout now runs on the new PayPal JS SDK v6 via @paypal/react-paypal-js v9, replacing the legacy PayPalScriptProvider/PayPalButtons with PayPalProvider and PayPalOneTimePaymentButton.
  </details>

- Reduce speculative <Link> prefetch load and cheapen the auth hot-path – #113302
  <details>
    <summary>Details</summary>

  Introduces an app-wide Link wrapper that defaults prefetch to off, so dynamic DB-hitting routes no longer fire a speculative RSC request per link in the viewport. Prefetch becomes an explicit opt-in for high-intent CTAs. Also lowers the per-request auth cost: the proxy reads the tenant id from the encrypted session cookie instead of running full session enrichment on every matched request.
  </details>

- Schedule background side effects with next/server after() – #112763
  <details>
    <summary>Details</summary>

  Replace fire-and-forget promise chains with after() across server actions and API routes. Fixes async forEach in ticketing mail utilities, schedules ticket notifications only after the mutation has committed, and adds error handling to all background tasks.
  </details>

- Serve translations from in-memory bundles with ETag revalidation – #112711
  <details>
    <summary>Details</summary>

  Server-side translations are now served from an in-memory per-tenant bundle cache instead of issuing one database query per translated key. Translation edits become visible within a minute plus a reload, instead of up to 24 hours, and unchanged translation bundles revalidate with a bodyless 304 response instead of a full re-download on every app boot.
  </details>

- Upgrade @goovee/orm to 0.0.7 – #109696
  <details>
    <summary>Details</summary>

  Upgraded @goovee/orm from 0.0.6 to 0.0.7, which fixes Date value handling in query filters. Invoice access-token expiry is now filtered directly in the query instead of in application code.
  </details>

- Upgrade Nodemailer to v8.0.6 with proper types and configuration handling – #111992
  <details>
    <summary>Details</summary>

  Upgraded Nodemailer from v6.9.16 to v8.0.6 with improved type safety, proper SMTPPool configuration support, and graceful email configuration handling. Removed all `any` types and implemented factory pattern for initialization.
  </details>

- Upload account profile and company pictures up front via staged uploads – #114317
  <details>
    <summary>Details</summary>

  Account profile pictures and company pictures now upload at pick time, streamed server-side rather than sent through the form action. A 15MB image-only cap is enforced while streaming, so larger phone photos no longer hit the request size limit; non-image or oversized files show an error toast.
  </details>

- Upload comment attachments up front via staged uploads – #113763
  <details>
    <summary>Details</summary>

  Comment attachments upload at pick time with per-file progress and retry. Large files no longer hit the request size limit; the 20MB cap is enforced server-side while streaming. Files rejected at pick show an error toast. Covers ticketing, news, events, quotations and forum comments.
  </details>

### Directory

- Add Zod input validation to server actions – #112086
- Upload account profile and company pictures up front via staged uploads – #114317
  <details>
    <summary>Details</summary>

  Account profile pictures and company pictures now upload at pick time, streamed server-side rather than sent through the form action. A 15MB image-only cap is enforced while streaming, so larger phone photos no longer hit the request size limit; non-image or oversized files show an error toast.
  </details>

### Events

- Add Zod input validation and improve type safety in events – #112085
  <details>
    <summary>Details</summary>

  All events server actions now validate inputs with Zod schemas. ORM and action signatures simplified: workspace objects replaced with workspaceURL string, event objects replaced with eventId string. ORM-derived types replace any across events components and pages. Payment components are now generic over their action payload type so server action return types flow to onApprove without casts. formatNumber now returns string|null for nullable inputs.
  </details>

- Schedule background side effects with next/server after() – #112763
  <details>
    <summary>Details</summary>

  Replace fire-and-forget promise chains with after() across server actions and API routes. Fixes async forEach in ticketing mail utilities, schedules ticket notifications only after the mutation has committed, and adds error handling to all background tasks.
  </details>

- Strengthen type safety across invoices, orders, and quotations subapps – #112617
  <details>
    <summary>Details</summary>

  Remove any types across invoices, orders, and quotations. Add email guards in invoices, shop, and events payment actions to fail fast instead of passing undefined to payment providers.
  </details>

- Strengthen type safety across ORM, actions, and UI components in events – #113094
  <details>
    <summary>Details</summary>

  Events subapp ORM functions, server actions, utilities, and UI components are now fully typed.
  </details>

- Upload comment attachments up front via staged uploads – #113763
  <details>
    <summary>Details</summary>

  Comment attachments upload at pick time with per-file progress and retry. Large files no longer hit the request size limit; the 20MB cap is enforced server-side while streaming. Files rejected at pick show an error toast. Covers ticketing, news, events, quotations and forum comments.
  </details>

### Forum

- Add Zod input validation and improve type safety in forum – #112088
  <details>
    <summary>Details</summary>

  Forum server actions now validate inputs with Zod schemas centralised in forum/common/validators.ts. Inline type definitions replaced with typed schemas and manual presence checks removed.
  </details>

- Schedule background side effects with next/server after() – #112763
  <details>
    <summary>Details</summary>

  Replace fire-and-forget promise chains with after() across server actions and API routes. Fixes async forEach in ticketing mail utilities, schedules ticket notifications only after the mutation has committed, and adds error handling to all background tasks.
  </details>

- Strengthen type safety across forum subapp – #112856
  <details>
    <summary>Details</summary>

  Remove any types across forum components, ORM functions, and server actions. Add proper type annotations for posts, groups, attachments, and pagination throughout the forum subapp.
  </details>

- Upload comment attachments up front via staged uploads – #113763
  <details>
    <summary>Details</summary>

  Comment attachments upload at pick time with per-file progress and retry. Large files no longer hit the request size limit; the 20MB cap is enforced server-side while streaming. Files rejected at pick show an error toast. Covers ticketing, news, events, quotations and forum comments.
  </details>

- Upload forum post attachments up front via staged uploads – #113761
  <details>
    <summary>Details</summary>

  Forum post images and documents now upload at pick time with per-file progress and retry, and multiple documents can be attached alongside images. The 20MB per-file cap is enforced server-side while streaming, so large files no longer hit the request size limit.
  </details>

### Invoices

- Add Zod input validation and improve type safety in invoices – #112084
  <details>
    <summary>Details</summary>

  Invoice server actions now validate inputs with Zod schemas centralised in invoices/common/validators.ts. Inline type definitions and manual presence checks replaced with typed schemas across all payment actions (PayPal, Stripe, Paybox, Up2Pay, HUB PISP).
  </details>

- Schedule background side effects with next/server after() – #112763
  <details>
    <summary>Details</summary>

  Replace fire-and-forget promise chains with after() across server actions and API routes. Fixes async forEach in ticketing mail utilities, schedules ticket notifications only after the mutation has committed, and adds error handling to all background tasks.
  </details>

- Strengthen type safety across invoices, orders, and quotations subapps – #112617
  <details>
    <summary>Details</summary>

  Remove any types across invoices, orders, and quotations. Add email guards in invoices, shop, and events payment actions to fail fast instead of passing undefined to payment providers.
  </details>

### News

- Add Zod input validation and improve type safety in news – #112087
  <details>
    <summary>Details</summary>

  News server actions now validate inputs with Zod schemas centralised in news/common/validators.ts. Inline type definitions replaced with typed schemas for findSearchNews and findRecommendedNews.
  </details>

- Improve type safety in news subapp – #112855
  <details>
    <summary>Details</summary>

  Replaced any types with explicit TypeScript types across news components, pages, and utilities.
  </details>

- Schedule background side effects with next/server after() – #112763
  <details>
    <summary>Details</summary>

  Replace fire-and-forget promise chains with after() across server actions and API routes. Fixes async forEach in ticketing mail utilities, schedules ticket notifications only after the mutation has committed, and adds error handling to all background tasks.
  </details>

- Upload comment attachments up front via staged uploads – #113763
  <details>
    <summary>Details</summary>

  Comment attachments upload at pick time with per-file progress and retry. Large files no longer hit the request size limit; the 20MB cap is enforced server-side while streaming. Files rejected at pick show an error toast. Covers ticketing, news, events, quotations and forum comments.
  </details>

### Orders

- Flatten orders routing to use search params and remove type path segment – #113282
  <details>
    <summary>Details</summary>

  Orders list and detail pages now use the same flat URL structure as invoices. Tab state is handled via search param instead of a path segment.
  </details>

- Strengthen type safety across invoices, orders, and quotations subapps – #112617
  <details>
    <summary>Details</summary>

  Remove any types across invoices, orders, and quotations. Add email guards in invoices, shop, and events payment actions to fail fast instead of passing undefined to payment providers.
  </details>

### Quotations

- Schedule background side effects with next/server after() – #112763
  <details>
    <summary>Details</summary>

  Replace fire-and-forget promise chains with after() across server actions and API routes. Fixes async forEach in ticketing mail utilities, schedules ticket notifications only after the mutation has committed, and adds error handling to all background tasks.
  </details>

- Strengthen type safety across invoices, orders, and quotations subapps – #112617
  <details>
    <summary>Details</summary>

  Remove any types across invoices, orders, and quotations. Add email guards in invoices, shop, and events payment actions to fail fast instead of passing undefined to payment providers.
  </details>

- Upload comment attachments up front via staged uploads – #113763
  <details>
    <summary>Details</summary>

  Comment attachments upload at pick time with per-file progress and retry. Large files no longer hit the request size limit; the 20MB cap is enforced server-side while streaming. Files rejected at pick show an error toast. Covers ticketing, news, events, quotations and forum comments.
  </details>

### Documents

- Add Zod input validation and improve type safety – #112082
  <details>
    <summary>Details</summary>

  Resources server actions now validate inputs with Zod schemas. Action signatures simplified: workspace objects replaced with workspaceURL string across ORM calls and components.
  </details>

- Strengthen type safety across resources ORM, actions, and UI components – #112854
  <details>
    <summary>Details</summary>

  Added shared types, tightened ORM and action signatures, and removed unsafe casts in the resources subapp.
  </details>

- Upload DMS resource files up front via staged uploads – #113762
  <details>
    <summary>Details</summary>

  Resource files now upload at pick time with per-file progress and retry, and are redeemed when the documents are created. The 20MB per-file cap is enforced server-side while streaming, and a validation failure no longer re-uploads the files. A file rejected at pick (e.g. over the size limit) shows an error toast.
  </details>

### E-Shop

- Add Zod input validation and improve type safety in shop – #112083
  <details>
    <summary>Details</summary>

  Shop server actions now validate inputs with Zod schemas centralised in shop/common/validators.ts. findProduct and findAddress guard against invalid IDs. computeTotal cart parameter widened to a structural type.
  </details>

- Strengthen type safety across invoices, orders, and quotations subapps – #112617
  <details>
    <summary>Details</summary>

  Remove any types across invoices, orders, and quotations. Add email guards in invoices, shop, and events payment actions to fail fast instead of passing undefined to payment providers.
  </details>

- Strengthen type safety and fix attrs LOB resolution in shop – #112857
  <details>
    <summary>Details</summary>

  Centralized shop types into common/types/index.ts, removed explicit any usages across the subapp, and fixed attrs not being awaited in findModelRecord and findModelRecords.
  </details>

### Helpdesk

- Schedule background side effects with next/server after() – #112763
  <details>
    <summary>Details</summary>

  Replace fire-and-forget promise chains with after() across server actions and API routes. Fixes async forEach in ticketing mail utilities, schedules ticket notifications only after the mutation has committed, and adds error handling to all background tasks.
  </details>

- Upload comment attachments up front via staged uploads – #113763
  <details>
    <summary>Details</summary>

  Comment attachments upload at pick time with per-file progress and retry. Large files no longer hit the request size limit; the 20MB cap is enforced server-side while streaming. Files rejected at pick show an error toast. Covers ticketing, news, events, quotations and forum comments.
  </details>

### Content

- Add Zod input validation to core payment SSE and website routes – #112090
  <details>
    <summary>Details</summary>

  Added Zod schema validation to payment SSE and website routes for improved type safety.
  </details>

- Add Zod input validation to server actions – #112089

## Security

### Core Platform

- Implement HMAC-SHA256 signature verification for notification webhook – #111990
  <details>
    <summary>Details</summary>

  Replaced Basic authentication with HMAC-SHA256 signature-based authentication for notification webhooks. The shared secret is no longer transmitted over the network, improving security. Requires setting NOTIFICATION_WEBHOOK_SECRET environment variable and coordinating the secret with the Axelor backend.
  </details>
