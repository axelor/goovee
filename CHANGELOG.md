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
