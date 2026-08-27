# 2.1.3 (2026-08-27)

## Fixes

### Core Platform

- Stop translations erroring on a locale that ships no file – #117403
  <details>
    <summary>Details</summary>

  A visitor whose locale ships no file of its own — a browser reporting en_GB or de — made the sign-in page and the other pages outside a workspace request an address that was read as a workspace, which failed with a server error and returned a page that was then absorbed into the translations as tens of thousands of stray entries. Those pages now read their translations from the application. A locale naming a region also falls back to its language for the translations shipped with the application, which INCLUDE_LANGUAGE no longer withholds — that setting governs the translations a tenant holds.
  </details>

# 2.1.2 (2026-08-26)

## Fixes

### User Accounts

- Show the address book on an Axelor Portal 9.1 backend – #117361
  <details>
    <summary>Details</summary>

  The addresses page returned an error and listed nothing when the backend ran on the Axelor Portal 9.1 line, because it read a field Axelor Open Suite removed from addresses in 9.1. The address label is now held in the sub department field, which exists on both the 9.0 and the 9.1 line, so listing, creating and editing an address work on either. A label saved before this change stays on the removed field and is no longer shown; retyping it on the address restores it.
  </details>

# 2.1.1 (2026-08-14)

## Features

### Core Platform

- Open documents without waiting for the whole file – #116828
  <details>
    <summary>Details</summary>

  Documents are streamed, so one appears from its first page while the rest is still arriving. An interrupted transfer resumes where it stopped, and a document that has not changed is confirmed as unchanged rather than sent again. A name containing a space, a comma or an accent is no longer altered when the file is saved, and more kinds of file can be read in the browser instead of only downloaded: .txt, .md, .xml and .csv, video, and images such as .webp, .gif, .bmp and .tiff.
  </details>

### Documents

- Open documents without waiting for the whole file – #116828
  <details>
    <summary>Details</summary>

  Documents are streamed, so one appears from its first page while the rest is still arriving. An interrupted transfer resumes where it stopped, and a document that has not changed is confirmed as unchanged rather than sent again. A name containing a space, a comma or an accent is no longer altered when the file is saved, and more kinds of file can be read in the browser instead of only downloaded: .txt, .md, .xml and .csv, video, and images such as .webp, .gif, .bmp and .tiff.
  </details>

## Fixes

### Core Platform

- Deliver notifications to every recipient of a large audience – #116857
  <details>
    <summary>Details</summary>

  A notification sent to a large audience reached only part of it. Mail servers refuse more than a handful of simultaneous connections from one sender, and the portal opened a separate one for every message, so the rest were rejected and lost. Every recipient now receives them. The new optional MAIL_MAX_CONNECTIONS sets how many the portal may open; the default is ten, and some mail servers accept as few as three. A message that fails temporarily is retried for several minutes, so mail that was lost now arrives late; one that cannot be delivered is reported with its recipient. Whether mail can be reached is reported at startup.
  </details>

- Deliver push notifications that were previously dropped – #116883
  <details>
    <summary>Details</summary>

  A notification with a long text was refused by the push service and lost; it is now shortened and delivered. One that failed for a temporary reason — the service rate-limiting the sender, or being briefly unavailable — is retried instead of discarded, and a service that accepts a connection then stops answering no longer holds the send open. When notifying a large audience, a device that is slow to answer no longer delays anyone else's notification from appearing in the portal. A device coming online after several notifications about the same subject now raises only the latest rather than each one. Whether push notifications can be sent is reported at startup, and the new optional PUSH_MAX_CONNECTIONS sets how many are delivered at once; the default is ten.
  </details>

- Keep memory steady as server secrets are used – #116884
  <details>
    <summary>Details</summary>

  Server memory grew a little every time a secret was used — each notification sent, payment authorised, webhook received, and chat token read — and was never released, so a long-running portal used steadily more of it. Memory use no longer grows with the work handled. Separately, switching on Google or Keycloak sign-in without setting its secret stopped the portal serving any request; it now runs, with that provider unusable until the secret is set.
  </details>

- Keep the translation cache keyed on the resolved tenant – #114494
  <details>
    <summary>Details</summary>

  The translation bundle cache was keyed on the tenant identifier taken straight from the URL, which no route validates. Every distinct value minted its own cache entry holding the same translations, so a hundred requests carrying made-up identifiers evicted the bundles of the real tenants and forced them to be rebuilt from the database. The cache is now keyed on the tenant the identifier actually resolves to, so identifiers that resolve to nothing all share a single entry and unknown values can no longer push real tenants out of the cache. Translation lookups behave as before: an unknown tenant still serves the general translations only.
  </details>

- Serve avatars and post images at the size they are shown – #116763
  <details>
    <summary>Details</summary>

  Profile pictures and forum post images were downloaded at their stored resolution, so a photo uploaded at full camera resolution was fetched whole to fill a small circle in a list. They are now resized to the size they are drawn at, converted to a modern format and cached. The forum image viewer also keeps one size while stepping between pictures instead of resizing around each one.
  </details>

- Use the message body from AOS in notification emails – #114532
  <details>
    <summary>Details</summary>

  A notification email always used the portal's own template, even when the linked message in AOS had its own content set. That content is now used as the email body. The subject was already taken from the message and is unchanged.
  </details>

### Forum

- Serve avatars and post images at the size they are shown – #116763
  <details>
    <summary>Details</summary>

  Profile pictures and forum post images were downloaded at their stored resolution, so a photo uploaded at full camera resolution was fetched whole to fill a small circle in a list. They are now resized to the size they are drawn at, converted to a modern format and cached. The forum image viewer also keeps one size while stepping between pictures instead of resizing around each one.
  </details>

### News

- Serve avatars and post images at the size they are shown – #116763
  <details>
    <summary>Details</summary>

  Profile pictures and forum post images were downloaded at their stored resolution, so a photo uploaded at full camera resolution was fetched whole to fill a small circle in a list. They are now resized to the size they are drawn at, converted to a modern format and cached. The forum image viewer also keeps one size while stepping between pictures instead of resizing around each one.
  </details>

## Changes

### Core Platform

- Prefill the attachment name with the original file name – #116862
  <details>
    <summary>Details</summary>

  Forms that ask for a name alongside an upload started that field empty, so the name had to be typed by hand even though the original file name was almost always the one wanted. Picking a file now fills the name with the original file name, without its extension, and the field stays editable so a different name can still be typed. Leaving the prefilled value alone stores the file under its original name. This applies to the resources form and to the comment box used by ticketing, quotations, news and events.
  </details>

- Serve images through a custom image loader – #116777
  <details>
    <summary>Details</summary>

  Images are resized as they are served, in place of a separate optimisation step. An image that has already been seen is confirmed as unchanged rather than being sent again.
  </details>

- Upload files in resumable parts – #116720
  <details>
    <summary>Details</summary>

  Files are sent in parts rather than in one request, so a large file no longer fails part-way and an interrupted upload resumes from where it stopped instead of starting again. Each file shows its own progress and can be paused, resumed, retried or removed, and a form cannot be sent until its attachments have finished uploading.
  </details>

### Documents

- Prefill the attachment name with the original file name – #116862
  <details>
    <summary>Details</summary>

  Forms that ask for a name alongside an upload started that field empty, so the name had to be typed by hand even though the original file name was almost always the one wanted. Picking a file now fills the name with the original file name, without its extension, and the field stays editable so a different name can still be typed. Leaving the prefilled value alone stores the file under its original name. This applies to the resources form and to the comment box used by ticketing, quotations, news and events.
  </details>

## Security

### Core Platform

- Confine file downloads to the storage directory – #114500
  <details>
    <summary>Details</summary>

  The location of an uploaded file is recorded relative to the tenant storage directory, and the absolute location was rebuilt from it without checking that the result stayed inside that directory. A record whose location pointed outside storage had that file served as a normal attachment to any user authorised for the record. The location is now verified before a file is read, and a record that fails the check is answered as a missing file; the abandoned-upload cleanup applies the same check before deleting.
  </details>

# 2.1.0 (2026-08-07)

## Fixes

### Core Platform

- Show the workspace name instead of the hardcoded Goovee brand – #116645
  <details>
    <summary>Details</summary>

  The portal displayed the literal string "Goovee" in the browser tab, on the login screen and in the mails it sends. The tab title in particular was a defect: the root metadata declared a title template of "Goovee" instead of "%s", and a Next.js template without a placeholder overwrites the child title, so the workspace name already computed by the workspace layout never reached the tab. The tab and the login screen now carry the workspace name, the auth pages resolving it as a guest from the workspaceURI and tenant search params. Notification mails interpolate the workspace name and their signature block goes through i18n. Everything left without a workspace context — the sidebar fallback, GET /api/info, and the OTP, invite and reset-password fallback templates used when no AOS template is configured — falls back to the Axelor brand.
  </details>

### Events

- Close event registration once the event has ended when no registration deadline is set – #116630
  <details>
    <summary>Details</summary>

  Registration used to close only when an event carried an explicit registration deadline, so events with an empty deadline kept offering the register button and accepting registrations long after they had ended. Registration now closes at the deadline when one is set, and otherwise once the event is over, counting the starting day in full for an event that has no end date. Events with no dates at all stay open.
  </details>

## Changes

### Chat

- Redesign the conversation comments – #115864
  <details>
    <summary>Details</summary>

  Comment threads gained a new conversation display variant with a sticky input, provider/contact styling, and a skeleton loading state, alongside redesigned comment list items.
  </details>

### Core Platform

- Redesign the data layer (schema, ORM & shared types) – #115859
  <details>
    <summary>Details</summary>

  Added schema, ORM helpers and shared type fields (forum reactions, address book defaults, partner and product data) supporting the redesigned sub-app screens.
  </details>

- Redesign the design system foundation – #115857
  <details>
    <summary>Details</summary>

  Added the new design tokens, fonts and shared UI primitives (status pill, status timeline, record skeletons) plus the FR/EN translation keys underpinning the portal UI redesign.
  </details>

- Redesign the notifications page – #115863
  <details>
    <summary>Details</summary>

  Unread notifications are now grouped by period (Today, Previous 7 days, Older) and shown with typed icons and colors per notification kind.
  </details>

- Redesign the workspace chrome – #115860
  <details>
    <summary>Details</summary>

  The header, sidebar, homepage and root layout have been redesigned with the new design system, including a profile menu, a gradient hero banner and reworked content cards.
  </details>

### Directory

- Redesign the directory sub-app – #115875
  <details>
    <summary>Details</summary>

  The directory listing and entry detail pages have been restyled with the new design system, including reworked card surfaces, filter bar and contact cards.
  </details>

### Events

- Re-skin the event registration screen to the redesign charter – #116638
  <details>
    <summary>Details</summary>

  Applied the redesign charter to the registration screen chrome (rounded section cards, event header with a styled price block, and a mint confirm CTA with a cancel link) without regressing custom registration fields, subscriptions or the payment flow.
  </details>

- Redesign the events sub-app – #115870
  <details>
    <summary>Details</summary>

  The events hub, calendar, event detail and registrations views have been redesigned with the new design system, including a new magazine-style homepage and an agenda calendar view.
  </details>

### Forum

- Redesign the forum sub-app – #115867
  <details>
    <summary>Details</summary>

  The forum feed, group and post detail views have been redesigned with the new design system, and post reactions (voting) have been added to thread detail.
  </details>

### Invoices

- Redesign the invoices sub-app – #115873
  <details>
    <summary>Details</summary>

  The invoices list and invoice detail views have been redesigned with the new design system, including a master-detail list layout, a paid/unpaid/partial/overdue status pill and a reworked payment total panel.
  </details>

### News

- Redesign the news sub-app – #115869
  <details>
    <summary>Details</summary>

  The news homepage, category and article views have been redesigned with the new design system, consolidating the editorial feed and article detail into new components.
  </details>

### Orders

- Redesign the orders sub-app – #115872
  <details>
    <summary>Details</summary>

  The orders list and order detail views have been redesigned with the new design system, including a master-detail list layout, a status timeline and a reworked information layout.
  </details>

### Quotations

- Redesign the quotations sub-app – #115874
  <details>
    <summary>Details</summary>

  The quotations list and quotation detail views have been redesigned with the new design system, including a master-detail list layout and a status timeline covering the draft-to-order journey.
  </details>

### Documents

- Redesign the resources sub-app – #115868
  <details>
    <summary>Details</summary>

  The resources sub-app has been redesigned as a documentation-style file browser, with a folder sidebar, home and folder grid/list views, and a dedicated document viewer.
  </details>

### E-Shop

- Redesign the shop sub-app – #115866
  <details>
    <summary>Details</summary>

  The shop catalog, product detail, cart and checkout views have been redesigned with the new design system, consolidating catalog browsing, product presentation and the checkout flow into dedicated components.
  </details>

### Helpdesk

- Redesign the ticketing sub-app – #115871
  <details>
    <summary>Details</summary>

  The ticketing list, ticket detail and ticket creation views have been redesigned with the new design system, including a compact header, a dedicated status sidebar and token-based status pills.
  </details>

### User Accounts

- Redesign the account sub-app – #115861
  <details>
    <summary>Details</summary>

  The account area now uses a grouped navigation rail, a redesigned address book with an edit modal, and a table-based members management screen with an invite modal.
  </details>

- Redesign the auth screens – #115862
  <details>
    <summary>Details</summary>

  Login, signup and password reset now share a new split-screen auth shell with redesigned form fields, replacing the previous legacy layout.
  </details>

# 2.0.2 (2026-07-20)

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

# 2.0.0 (2026-06-17)

## Features

### Core Platform

- Record storage type on uploaded files for AOP 8 / AOS 9 support – #114307
  <details>
    <summary>Details</summary>

  Files uploaded through the portal now record their storage type (local), which AOP 8 / AOS 9 requires; without it those backends reject the upload. No change on AOP 7 / AOS 8.
  </details>

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

# 1.7.2 (2026-06-02)

## Fixes

### Core Platform

- Up2Pay: Incorrect country code sent in billing information – #113469
  <details>
    <summary>Details</summary>

  Up2Pay's PBX_BILLING expects the ISO 3166-1 numeric country code (e.g. "250" for France) in the &lt;CountryCode&gt; field, but the invoice billing payload was sending the alpha-2 code (e.g. "FR").
  </details>

### Invoices

- Up2Pay: Incorrect country code sent in billing information – #113469
  <details>
    <summary>Details</summary>

  Up2Pay's PBX_BILLING expects the ISO 3166-1 numeric country code (e.g. "250" for France) in the &lt;CountryCode&gt; field, but the invoice billing payload was sending the alpha-2 code (e.g. "FR").
  </details>

# 1.7.1 (2026-05-13)

## Fixes

### Core Platform

- Handle transient 400 errors on HUB PISP webhook to prevent false failures – #112542
  <details>
    <summary>Details</summary>

  The HUB PISP webhook now returns 200 OK on transient 400 responses from BPCE PS instead of failing.
  </details>

# 1.7.0 (2026-04-30)

## Features

### Core Platform

- Add PWA support and real-time push notifications – #107259
  <details>
    <summary>Details</summary>

  Implemented PWA via Serwist with asset precaching and stale-while-revalidate caching. Added a web push notification system covering registrations, tickets, forum posts, comments, replies, quotations, news, and invoice payments. Includes a /notifications center, multi-device sync, auto-healing on permission grant, and notification grouping via tags.
  </details>

- Support configurable HUB PISP transfer types – #111746
  <details>
    <summary>Details</summary>

  HUB PISP payments can now be restricted to Instant (SCTInst), Standard (SCT), or both via a new transferTypeSelect config. The UI shows only the allowed transfer tiles and the server rejects requests for transfer types that are not allowed.
  </details>

## Fixes

### Core Platform

- Avoid duplicate and oversized avatar image fetches – #111925
  <details>
    <summary>Details</summary>

  Avatars were downloaded twice (Radix preload + next/image) and at the largest configured width. AvatarImage now serves a single, properly-sized optimized variant.
  </details>

- Properly log out user if account is missing – #111185
  <details>
    <summary>Details</summary>

  Automatically clear the session and log out the user if their account is no longer found in the system.
  </details>

## Changes

### Core Platform

- General improvements across authentication, core, events, forum, orders, and translations – #111787
  <details>
    <summary>Details</summary>

  Refactored ORM functions to pass resolved Client/Tenant instead of tenantId, validated auth and account actions with Zod, cached locale translations in the service worker, upgraded Next.js to 16.2.4 with TypeScript 6.0, replaced lodash with lodash-es. Fixed auth error handling, Google OAuth redirection, service worker caching scope, locale initialisation, React hook dependencies in forum and events, and missing/incorrect translations. Migrated Avatar and other image components to next/image with proper alt attributes.
  </details>

### Events

- General improvements across authentication, core, events, forum, orders, and translations – #111787
  <details>
    <summary>Details</summary>

  Refactored ORM functions to pass resolved Client/Tenant instead of tenantId, validated auth and account actions with Zod, cached locale translations in the service worker, upgraded Next.js to 16.2.4 with TypeScript 6.0, replaced lodash with lodash-es. Fixed auth error handling, Google OAuth redirection, service worker caching scope, locale initialisation, React hook dependencies in forum and events, and missing/incorrect translations. Migrated Avatar and other image components to next/image with proper alt attributes.
  </details>

### Forum

- General improvements across authentication, core, events, forum, orders, and translations – #111787
  <details>
    <summary>Details</summary>

  Refactored ORM functions to pass resolved Client/Tenant instead of tenantId, validated auth and account actions with Zod, cached locale translations in the service worker, upgraded Next.js to 16.2.4 with TypeScript 6.0, replaced lodash with lodash-es. Fixed auth error handling, Google OAuth redirection, service worker caching scope, locale initialisation, React hook dependencies in forum and events, and missing/incorrect translations. Migrated Avatar and other image components to next/image with proper alt attributes.
  </details>

### Orders

- General improvements across authentication, core, events, forum, orders, and translations – #111787
  <details>
    <summary>Details</summary>

  Refactored ORM functions to pass resolved Client/Tenant instead of tenantId, validated auth and account actions with Zod, cached locale translations in the service worker, upgraded Next.js to 16.2.4 with TypeScript 6.0, replaced lodash with lodash-es. Fixed auth error handling, Google OAuth redirection, service worker caching scope, locale initialisation, React hook dependencies in forum and events, and missing/incorrect translations. Migrated Avatar and other image components to next/image with proper alt attributes.
  </details>

# 1.6.5 (2026-04-27)

## Fixes

### Core Platform

- Fix Up2Pay IPN webhook intermittent signature verification failure – #111668
  <details>
    <summary>Details</summary>

  IPN callbacks could fail signature verification when parameter values contained characters encoded differently by Up2Pay's rules versus standard URL encoding.
  </details>

# 1.6.4 (2026-04-16)

## Features

### Core Platform

- Forward Up2Pay IPN callback to legacy ERP when invoice is unknown – #110472
  <details>
    <summary>Details</summary>

  Add automatic forwarding of unrecognized Up2Pay IPNs to the legacy system (Consonance Web) via a new UP2PAY_LEGACY_FORWARD_URL environment variable, while preserving normal processing for recognized payments.
  </details>

### Invoices

- Forward Up2Pay IPN callback to legacy ERP when invoice is unknown – #110472
  <details>
    <summary>Details</summary>

  Add automatic forwarding of unrecognized Up2Pay IPNs to the legacy system (Consonance Web) via a new UP2PAY_LEGACY_FORWARD_URL environment variable, while preserving normal processing for recognized payments.
  </details>

# 1.6.3 (2026-04-02)

## Features

### Core Platform

- Support payment mode for payments – #110470

### Events

- Support payment mode for payments – #110470

### Invoices

- Support payment mode for payments – #110470

### Orders

- Support payment mode for payments – #110470

## Fixes

### Core Platform

- Simplify Up2Pay payment button label – #110503
  <details>
    <summary>Details</summary>

  Replaced the styled inline markup in the Up2Pay button with a plain translation key, and renamed the 'Pay using' locale key to 'Pay using Up2Pay'
  </details>

# 1.6.2 (2026-03-31)

## Changes

### Core Platform

- Add empty hubpisp directory in certs – #110368

# 1.6.1 (2026-03-30)

## Features

### Core Platform

- Improve Stripe bank transfer reconciliation – #110211
  <details>
    <summary>Details</summary>

  Improved Stripe invoice bank transfer handling by retrying transient webhook failures, reconciling payment state through webhook and SSE updates, and cleaning up stale pending bank transfer intents after successful payments or customer balance auto-payment.
  </details>

### Invoices

- Improve Stripe bank transfer reconciliation – #110211
  <details>
    <summary>Details</summary>

  Improved Stripe invoice bank transfer handling by retrying transient webhook failures, reconciling payment state through webhook and SSE updates, and cleaning up stale pending bank transfer intents after successful payments or customer balance auto-payment.
  </details>

# 1.6.0 (2026-03-26)

## Features

### Core Platform

- Add HUB PISP (BPCE PS) payment method for invoices – #108787
  <details>
    <summary>Details</summary>

  Integrated BPCE PS HUB PISP as a payment method for invoices. Supports SCT and SCT Inst transfers with webhook-based payment confirmation.
  </details>

- Add Up2Pay payment method for invoices with real-time payment status via SSE – #107313
  <details>
    <summary>Details</summary>

  Integrated Up2Pay for invoice payments and added SSE to update payment status in real time after webhook processing.
  </details>

- Upgrade to NEXT 16 and migrate to Better-Auth – #106509

### Invoices

- Add HUB PISP (BPCE PS) payment method for invoices – #108787
  <details>
    <summary>Details</summary>

  Integrated BPCE PS HUB PISP as a payment method for invoices. Supports SCT and SCT Inst transfers with webhook-based payment confirmation.
  </details>

- Add token-based public access for invoice payment – #109715
  <details>
    <summary>Details</summary>

  Enable token-based access to view and pay invoices without requiring login.
  </details>

- Add Up2Pay payment method for invoices with real-time payment status via SSE – #107313
  <details>
    <summary>Details</summary>

  Integrated Up2Pay for invoice payments and added SSE to update payment status in real time after webhook processing.
  </details>

## Fixes

### Core Platform

- Add PAYPAL_LIVE flag to control PayPal environment, defaults to sandbox – #110125
- Fix forum card redirect to navigate to the specific post – #109583
  <details>
    <summary>Details</summary>

  Forum card on the home page now redirects to the specific forum post instead of the forum listing page.
  </details>

- Preserve search params in callback url on logout – #109284

# 1.5.3 (2026-03-23)

## Security

### Core Platform

- Secure tenant config endpoint in multi-tenancy mode – #109862

# 1.5.2 (2026-02-04)

## Fixes

### Core Platform

- Ignore partner on invitation – #107518
  <details>
    <summary>Details</summary>

  Allow contact creation during an invitation even if a partner with the same email address already exists
  </details>

- Partner and Contact registration with same email address – #107481
  <details>
    <summary>Details</summary>

  If two partners exist with the same email address, we will look for the one who is allowed to register during registration
  </details>

# 1.5.1 (2026-02-02)

## Fixes

### Core Platform

- Allow existing contact to register via invite – #107351

# 1.5.0 (2026-01-28)

## Features

### Core Platform

- Add bank-transfer support for Stripe payments – #105908
  <details>
    <summary>Details</summary>

  Introduced support for Stripe bank transfers, including pending transfer handling, cancellation flow, and UI feedback during async operations.
  </details>

- Add term of use acceptance text before subscription – #107151
  <details>
    <summary>Details</summary>

  The HTML text termsOfUseAcceptanceText needs to be displayed if necessary in subscription form
  </details>

- Hyperlink on the Homepage – #106490
  <details>
    <summary>Details</summary>

  Add a selection of hyperlinks represented by logos to the homepage
  </details>

- Mattermost user creation – #106814
  <details>
    <summary>Details</summary>

  Use a new variable environnement to create matterost user
  </details>

- Support new params in subscription URL – #106602
  <details>
    <summary>Details</summary>

  Add support for type of partner, company name, identification number and email in subscription URL
  </details>

## Fixes

### Core Platform

- Account settings and translation update – #107074
  <details>
    <summary>Details</summary>

  Hide first name on personal settings for company and update identification number translation
  </details>

- Consider partner scope for admin contact when yesForAll registration e – #106755
  <details>
    <summary>Details</summary>

  Fix missing partner scope for getting admin contact when registration scope is yesForAll
  </details>

- Disallow contact registration as admin when partner already registered – #106818
  <details>
    <summary>Details</summary>

  Contact registeration as admin is now checked against partner activation on portal instead of password because partner could also initially register itself by google or other providers
  </details>

- Displaying Google authentication – #106697
  <details>
    <summary>Details</summary>

  SHOW_GOOGLE_OAUTH variable is not taken into account in certain places, such as during registration.
  </details>

- Fix registration for contacts – #106687
  <details>
    <summary>Details</summary>

  Set partner's default workspace as default workspace for contacts
  </details>

- Fix registration support for workspace without default guest workspace – #106670
  <details>
    <summary>Details</summary>

  Remove open workspace check and consider only scope of registration for allowing registration
  </details>

- Improve registration support for private workspace based on scope – #106449
  <details>
    <summary>Details</summary>

  Consider both public and private workspace for registration based on scope
  </details>

### Directory

- Set image to contain within the card – #107084

# 1.4.1 (2026-01-11)

## Fixes

### Core Platform

- Fix image fetching in next 14.2.35 by patch – #106254
  <details>
    <summary>Details</summary>

  Fetching image optimizer issue by adding headers
  </details>

# 1.4.0 (2025-12-29)

## Features

### Chat

- Mattermost password reset and opening the mattermost web app – #105030
  <details>
    <summary>Details</summary>

  Mattermost password reset and opening the mattermost web app
  </details>

### Core Platform

- Introduce new workspace homepage – #104954
  <details>
    <summary>Details</summary>

  The homepage provides a centralized overview of the latest news, upcoming events, recent forum discussions, and newly added resource
  </details>

- Show header in fixed position based on config – #105270

### Documents

- Show parent folder name in resource list – #105272

## Fixes

### Core Platform

- Fix wrong config used for members when multiple configs are available – #105774

### E-Shop

- Always include paidAmount in payload – #104202
  <details>
    <summary>Details</summary>

  Updated shop order invoice payload to always include paidAmount, defaulting to the full total when no advance payment percentage is applied.
  </details>

## Changes

### Core Platform

- Migrate installed string to isInstalled boolean – #102962

### Content

- Make seeding more robust – #105457

## Security

### Core Platform

- Update next – #105201
  <details>
    <summary>Details</summary>

  Fixes Denial of Service (DoS) vulnerability in next.js
  </details>

# 1.3.0 (2025-11-28)

## Features

### Core Platform

- Enhance the Directory with new settings and improved display – #102762
  <details>
    <summary>Details</summary>

  The Directory includes new settings and an improved display. A 'Directory settings' menu under 'My Account' allows users to configure company and personal contact visibility. The directory displays company contacts. The homepage features a searchable list of partners, and each partner has a dedicated detail page showing comprehensive information and associated contacts.
  </details>

- Upgrade Goovee ORM to 0.0.6 – #102970
  <details>
    <summary>Details</summary>

  This enables case insensitive search and fixes profile picture deletion
  </details>

### Directory

- Enhance the Directory with new settings and improved display – #102762
  <details>
    <summary>Details</summary>

  The Directory includes new settings and an improved display. A 'Directory settings' menu under 'My Account' allows users to configure company and personal contact visibility. The directory displays company contacts. The homepage features a searchable list of partners, and each partner has a dedicated detail page showing comprehensive information and associated contacts.
  </details>

### E-Shop

- Show order success dialog when order subapp is not present – #103625

## Fixes

### Core Platform

- Fix crash after login when there are no public apps – #103475
- Fix redirection after first time sso keycloak login – #104086
  <details>
    <summary>Details</summary>

  Redirect the user after first time login using keycloak without refreshing the page.
  </details>

- Fix Rich Text Editor styling and content overflow issues – #103321
  <details>
    <summary>Details</summary>

  Apply consistent Rich Text Editor styling and resolve content overflow problems across modules. Integrate RichTextViewer in Forum thread body and Ticketing ticket details for unified rendering, and update form grid layout styles to prevent overlap and improve alignment.
  </details>

- Fix validation not updating after deleting array items – #104037
  <details>
    <summary>Details</summary>

  Ensured form validation re-runs when an array item is removed, preventing stale validation states.
  </details>

- Handle date formatting across timezones – #103225
  <details>
    <summary>Details</summary>

  Ensure consistent date handling across timezones by performing all date formatting on the client side.
  </details>

- Restrict Contact Address Selection to Partner Addresses in Shop and Quotations – #103363
  <details>
    <summary>Details</summary>

  Implemented strict address filtering in Shop and Quotations. Contacts are now restricted to selecting only addresses associated with their parent Partner.
  </details>

- Show customised message for paybox payments – #103584

### Events

- Fix paid amount scaling mismatch for events – #104191
  <details>
    <summary>Details</summary>

  Applied proper scaling to generated payment amounts to ensure the paid amount matches the expected amount after processing.
  </details>

### Forum

- Fix Rich Text Editor styling and content overflow issues – #103321
  <details>
    <summary>Details</summary>

  Apply consistent Rich Text Editor styling and resolve content overflow problems across modules. Integrate RichTextViewer in Forum thread body and Ticketing ticket details for unified rendering, and update form grid layout styles to prevent overlap and improve alignment.
  </details>

### Invoices

- Fix paid amount not reflecting on partial payment of invoice – #104343

### Orders

- Fix amount scaling and tax line formatting – #104194
  <details>
    <summary>Details</summary>

  Applied correct scaling and formatting for totals and taxLineSet values to resolve amount mismatch issues in orders and quotations.
  </details>

- Fix download issue for invoices and customer deliveries on completed orders – #103376
  <details>
    <summary>Details</summary>

  Resolved an issue preventing downloads of invoices and customer deliveries when an order had completed status.
  </details>

### Quotations

- Fix amount scaling and tax line formatting – #104194
  <details>
    <summary>Details</summary>

  Applied correct scaling and formatting for totals and taxLineSet values to resolve amount mismatch issues in orders and quotations.
  </details>

- Restrict Contact Address Selection to Partner Addresses in Shop and Quotations – #103363
  <details>
    <summary>Details</summary>

  Implemented strict address filtering in Shop and Quotations. Contacts are now restricted to selecting only addresses associated with their parent Partner.
  </details>

### E-Shop

- Fix mainPrice comparison and add dynamic item pricing – #104174
  <details>
    <summary>Details</summary>

  Corrected mainPrice comparison from 'ati' to 'at' and updated payload items to apply conditional ATI/WT pricing while creating and requesting an order.
  </details>

- Reorder primary and secondary price display – #104175
  <details>
    <summary>Details</summary>

  Adjusted the rendering order to display the primary price first and the secondary price below it for clearer visual hierarchy in product view section.
  </details>

- Restrict Contact Address Selection to Partner Addresses in Shop and Quotations – #103363
  <details>
    <summary>Details</summary>

  Implemented strict address filtering in Shop and Quotations. Contacts are now restricted to selecting only addresses associated with their parent Partner.
  </details>

### Helpdesk

- Fix Rich Text Editor styling and content overflow issues – #103321
  <details>
    <summary>Details</summary>

  Apply consistent Rich Text Editor styling and resolve content overflow problems across modules. Integrate RichTextViewer in Forum thread body and Ticketing ticket details for unified rendering, and update form grid layout styles to prevent overlap and improve alignment.
  </details>

# 1.2.0 (2025-11-04)

## Features

### Forum

- Improve forum app with skeletons and loading handlers – #96451
  <details>
    <summary>Details</summary>

  Added skeleton components and loading state handlers to enhance user experience and perceived performance while forum data is loading.
  </details>

### User Accounts

- Add Support for Managing Addresses for Contacts – #103130
  <details>
    <summary>Details</summary>

  Ensures consistent address handling across Partners and Contacts
  </details>

- Using town name instead of city name – #102821
  <details>
    <summary>Details</summary>

  Using town name instead of city name when creating an address
  </details>

### Content

- Implement website seeding and enhance performance – #101934
  <details>
    <summary>Details</summary>

  Implement website and page seeding to populate initial content. Optimize performance by replacing standard `&lt;img&gt;` tags with Next.js's `Image` component for better image handling and for background images. Fix UI bugs related to content overlapping and dynamic blog cards.
  </details>

- Prepare templates for demo – #101503
  <details>
    <summary>Details</summary>

  Prepares templates for the demo by implementing performance improvements like chunk loading and separate SEO content fetching. Adds support for nested model/selection declarations, common meta selects, default field values, and selection validation. Also includes template documentation and various fixes.
  </details>

## Fixes

### Core Platform

- Fix duplicate default address – #102397
- Update icons for apps to align with goovee website – #102305
- Upgrade Goovee ORM to 0.0.5 – #100928
  <details>
    <summary>Details</summary>

  This Goovee ORM release resolves a regression that caused duplicate records to be returned in relational fields
  </details>

### E-Shop

- Fix payment error during checkout – #102789
  <details>
    <summary>Details</summary>

  Fixes Name, amount , customer , currency and callbackurl are requied error when a product is added via product page
  </details>

## Changes

### E-Shop

- Refine order creation error messages – #103129
  <details>
    <summary>Details</summary>

  Updated user-facing error messages during order creation to be clearer and more helpful across different failure scenarios.
  </details>

### Content

- Refactor website for performance, add documentation, and fix various issues – #102295
  <details>
    <summary>Details</summary>

  Add user documentation for wiki editor. Improve website performance by lazy loading wiki components and enhancing code splitting. Remove unused dependencies and files. Add bundle analyzer. Fix count-up animation, wiki CSS, and dynamic template import issues.
  </details>

- Update website names, Enable inline creation of image fields, and Strip Demo Data IDs/Versions – #102957

# 1.1.0 (2025-10-07)

## Features

### Core Platform

- Add support for case insensitive and unaccent search – #100908
- Add support for login using keycloak – #100832

### E-Shop

- Add support for partial invoice for pay-in-advance orders – #100907
  <details>
    <summary>Details</summary>

  Generates an invoice for the advance payment percentage when pay-in-advance is enabled.
  </details>

- Control visibility of prices and cart based on hidePriceForEmptyPriceList checkbox – #101421
  <details>
    <summary>Details</summary>

  The hidePriceForEmptyPriceList checkbox is added to the workspace configuration to control the visibility of prices and cart based on whether main partner of the user has a price list or not.
  </details>

- update partner price list and partner fiscal position when creating default address – #101466

### User Accounts

- Add support to fetch cities based on ZIP code – #100901
  <details>
    <summary>Details</summary>

  Enhanced the address selection functionality to allow fetching cities not only based on the selected country but also using the entered ZIP code. This ensures more accurate city suggestions and improves the user experience during address entry.
  </details>

### Content

- Add 200+ templates – #98839
- Add Permission check to wiki page – #99979
  <details>
    <summary>Details</summary>

  Only allow users with canEditWiki permission to edit wiki pages
  </details>

## Fixes

### Core Platform

- Remove support for case insensitive and unaccent search – #101775

## Changes

### Core Platform

- Add goovee config file to discover nested schema – #101786

### Content

- Update README to include sass compilation command and suppress warnings – #100824

# 1.0.0 (2025-09-11)

## Features

### Core Platform

- Add environment configuration to show/hide Google Oauth option – #98313
- Add PWA support to the application – #94548
  <details>
    <summary>Details</summary>

  Implemented Progressive Web App (PWA) support including service worker registration, manifest setup.
  </details>

### Events

- Show category image in event list – #100009
  <details>
    <summary>Details</summary>

  Shows the category image in event list if available, if not show the event image
  </details>

### Content

- Add demo content for Wiki 1 – #98844

## Fixes

### Core Platform

- Fix banner search selection appearance – #98628
- Make DATA_STORAGE variable optional during build – #99538

### Events

- Fix image alignment for events html description – #98430
- Fix margin for paragraph in html description – #98433
  <details>
    <summary>Details</summary>

  Display paragraph to have line break by providing appropriate bottom margin
  </details>

### News

- Fix image alignment for events html description – #98430
- Fix margin for paragraph in html description – #98433
  <details>
    <summary>Details</summary>

  Display paragraph to have line break by providing appropriate bottom margin
  </details>

- Resolve crash on hero search – #98434

### Content

- Fix wiki content not being saved – #98835
- Update proper type for component during template seed – #98836

## Changes

### Core Platform

- Improve Shop App styling for visual consistency and responsiveness – #98635

### E-Shop

- Improve Shop App styling for visual consistency and responsiveness – #98635
- Refactor routing by replacing router.push with Next.js <Link> component – #98637
- Replace native <textarea> with cire <Textarea/> component – #98638

## Security

### Helpdesk

- Restrict access to ticket details – #98497
  <details>
    <summary>Details</summary>

  Only allow access to ticket details if the user has access to the project.
  </details>
