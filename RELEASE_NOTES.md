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
