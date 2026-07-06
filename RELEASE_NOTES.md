# 1.7.3 (2026-07-06)

## Fixes

### Core Platform

- Delay and retry HUB PISP payment link fetch on webhook – #115301
  <details>
    <summary>Details</summary>

  The payment link is not immediately queryable on the BPCE PS side when the webhook fires, so the handler's first GET payment-link returned 400 and the notification was lost (BPCE never redelivers), delaying payment confirmation until the expiry backstop (~30 min). The webhook handler now waits 2 seconds before each GET, as prescribed by BPCE, and retries on 400 up to 3 attempts before falling back to the expiry backstop.
  </details>
