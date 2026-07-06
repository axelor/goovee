# 1.7.3 (2026-07-06)

## Fixes

### Core Platform

- Delay and retry HUB PISP payment link fetch on webhook – #115301
  <details>
    <summary>Details</summary>

  The payment link is not immediately queryable on the BPCE PS side when the webhook fires, so the handler's first GET payment-link returned 400 and the notification was lost (BPCE never redelivers), delaying payment confirmation until the expiry backstop (~30 min). The webhook handler now waits 2 seconds before each GET, as prescribed by BPCE, and retries on 400 up to 3 attempts before falling back to the expiry backstop.
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
