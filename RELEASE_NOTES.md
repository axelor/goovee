# 2.2.0 (2026-08-26)

## Features

### Marketplace

- Add Marketplace app – #111822
- Create the marketplace order and invoice after checkout, recoverable on failure – #113770
  <details>
    <summary>Details</summary>

  A marketplace checkout records an order and grants access, then creates the sale order and invoice afterwards instead of during checkout, so the buyer no longer waits for invoicing to finish. Purchases show "Order pending" / "Invoice pending" until they exist; a sale order or invoice that did not complete is recovered afterwards rather than lost.
  </details>

- Marketplace products can be frozen or taken down by moderation – #113768
  <details>
    <summary>Details</summary>

  A taken-down product is removed from the catalogue, search and its detail page and can no longer be bought; a buyer who already purchased it keeps downloading it from My Purchases, where a dialog shows the take-down reason, while a free product becomes unavailable. A frozen or taken-down product becomes read-only for its publisher, who sees the reason in their contributions.
  </details>

- Partners can request publisher access on the marketplace – #113766
  <details>
    <summary>Details</summary>

  Publishing on the marketplace takes per-partner approval alongside the workspace's publish switch: a partner (via a total or admin contact) requests publisher access from their contributions page, and a back-office admin approves, rejects temporarily (with a re-request date and reason) or bans them. Access is granted per workspace, so a partner publishing in several workspaces is approved in each one and a decision taken in one leaves the others untouched. Publishing is unlocked only once a partner is approved for that workspace; a partner that has not requested, is pending, was declined or is banned sees the state of their request in place of the publisher console.
  </details>

- Report a marketplace review and hide moderated comments – #113769
  <details>
    <summary>Details</summary>

  Buyers can report another user's review with a reason. A review hidden by moderation no longer shows its comment to other buyers — only its rating remains — while its author still sees their own review marked as hidden by a moderator.
  </details>

- Restrict marketplace product authoring to total contacts – #113765
  <details>
    <summary>Details</summary>

  The marketplace subapp now honours the restricted/total contact role. A restricted contact is a buyer only: browsing, downloads and checkout stay open, but the contributions area and the publisher actions are no longer accessible.
  </details>

- Show the rejection reason on a rejected marketplace version – #113767
  <details>
    <summary>Details</summary>

  When a reviewer rejects a version submission they now provide a reason, and the contributions editor shows the latest one to the author so they know what to fix before resubmitting.
  </details>
