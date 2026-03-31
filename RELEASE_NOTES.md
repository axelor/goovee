# 1.5.5 (2026-03-31)

## Features

### Core Platform

- Improve Stripe bank transfer reconciliation – #110211
  <details>
    <summary>Details</summary>

  Overhauled Stripe bank transfer flow with a new confirmation dialog, atomic intent cancellation that keeps payment context in sync, automatic cleanup of stale pending intents when an invoice is settled by card or customer balance, and correct amount normalization across currencies with non-standard decimal precision.
  </details>

### Invoices

- Improve Stripe bank transfer reconciliation – #110211
  <details>
    <summary>Details</summary>

  Overhauled Stripe bank transfer flow with a new confirmation dialog, atomic intent cancellation that keeps payment context in sync, automatic cleanup of stale pending intents when an invoice is settled by card or customer balance, and correct amount normalization across currencies with non-standard decimal precision.
  </details>
