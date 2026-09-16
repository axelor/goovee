# 2.3.2 (2026-09-16)

## Fixes

### Core Platform

- Resume an interrupted upload from the bytes that arrived – #118563
  <details>
    <summary>Details</summary>

  A file is uploaded in parts, and a part interrupted mid-transfer — the connection dropped, the browser closed, a gateway gave up — discarded the bytes of that part that had already reached the server, so the part was sent again from its beginning. The bytes that arrived are now kept and the upload carries on from them. Every route handler that receives a body is also handed it as it arrives rather than after all of it has been held in memory, so a single request body larger than 10 MB is no longer truncated. The handlers that read a whole body — the payment and notification webhooks, authentication, push subscriptions — each state the largest one they accept and answer 413 for anything above it.
  </details>
