# Staged Upload

> Infrastructure, not an end-user feature. Lets a file be uploaded **before** the
> record that will own it exists. Consumed by features that register a **purpose**
> (e.g. `marketplace:bundle`).

## What it does

A **claim-check** pattern: stage a file and get back an opaque, single-use
**token** (never the `meta_file` id); at form submit the consumer **redeems** the
token and the server links the file to the new record — so a client never hands
over a file id to trust. Files that are staged but never submitted are
**abandoned**; a background reaper reclaims their storage, then a prune pass
removes the leftover record after a retention window.

Everything is scoped to a **tenant** (its own DB and storage), and within it to
the **user** who staged the file and the declared **purpose**.

## Flow

- **Stage** — `POST /api/tenant/{tenant}/upload/stage/{purpose}`. Auth required;
  the purpose's size cap is enforced as a streaming limit (body never fully
  buffered); the blob is written under a server-generated name; the `meta_file`
  and claim commit together, with the claim's **expiry set to now + the purpose's
  TTL** (its `ttlMs`, default 24h) — this is what later makes an unredeemed claim
  reapable. Returns `{token, fileName, sizeText}`. The `useStagedUpload` hook
  drives this from the browser with per-file progress, bounded concurrency, and
  retry/abort.
- **Redeem** — at submit the consumer calls `redeemUpload({token, purpose, owner,
client})` in its own transaction: re-checks owner + purpose + freshness, marks
  the claim consumed (optimistic lock, so single-use), and returns the `meta_file`
  id to link. The consumer keeps its own ownership checks on the target entity.
- **Reap / Prune** — background cleanup. **Reap** reclaims storage for abandoned
  uploads (deletes the blob + `meta_file`, marks the record `reapedAt`, keeps the
  record); **prune** deletes the staged-upload record itself once it has been
  terminal — consumed or reaped — past the retention window. See lifecycle.

## Lifecycle

```
                          stage
                            │
                            ▼
              ┌─────────────────────────────┐
              │   Unconsumed (redeemable)   │
              └─────────────────────────────┘
                  │                        │
          redeem  │                        │  TTL passes, never redeemed
                  ▼                        ▼
         ┌──────────────┐    ┌─────────────────────────────┐
         │   Consumed   │    │     Expired (abandoned)     │
         └──────────────┘    └─────────────────────────────┘
                  │                        │  REAP: delete blob + meta_file
                  │                        ▼
                  │          ┌─────────────────────────────┐
                  │          │     Reaped (record kept)    │
                  │          └─────────────────────────────┘
                  │                        │
                  └───────────┬────────────┘
                              │  PRUNE after retention: delete record
                              ▼
                     staged_upload record deleted
```

## What each cleanup pass touches

| Record state                         | Redeemable? | Reap                                          | Prune                  |
| ------------------------------------ | ----------- | --------------------------------------------- | ---------------------- |
| Unconsumed, **within** TTL           | ✅          | —                                             | —                      |
| Unconsumed, **past** TTL (abandoned) | ❌          | **deletes** blob + meta_file, sets `reapedAt` | —                      |
| Reaped, **within** retention         | —           | — (skipped, `reapedAt` set)                   | —                      |
| Reaped, **past** retention           | —           | —                                             | **deletes the record** |
| Consumed, **within** retention       | spent       | —                                             | —                      |
| Consumed, **past** retention         | spent       | —                                             | **deletes the record** |

Reap reclaims storage (blob + `meta_file`) but **keeps the record**, marked
`reapedAt`, for traceability — it works row by row (batched by `REAP_BATCH_LIMIT`,
isolating per-row failures) because each blob is removed from disk. A **consumed**
record's `meta_file` stays live, linked to its entity. Prune deletes the
**record only** — never a live `meta_file` — in a single bulk delete.

## Configuration

Two environment variables:

| Environment variable            | Default       | Controls                                                 |
| ------------------------------- | ------------- | -------------------------------------------------------- |
| `UPLOAD_RECORD_RETENTION_HOURS` | 168 (7d)      | How long a terminal (consumed or reaped) record is kept. |
| `DATA_STORAGE`                  | `cwd/storage` | Blob storage root.                                       |

`UPLOAD_RECORD_RETENTION_HOURS` is read in **hours** (fractional allowed, e.g.
`0.01` for testing); unset, non-positive, or invalid falls back to the default.

What makes an abandoned claim reapable is its own expiry, set at stage time from
the purpose's **TTL** — `ttlMs` in the `UPLOAD_PURPOSES` registry (default 24h,
alongside `maxBytes` and an optional `file` schema). The reap and prune **sweep
cadences are fixed constants** (hourly and daily): they only bound the lag
between expiry and deletion, so they are not env-tunable.

Reap and prune run as two independent passes from `instrumentation.ts`, per
tenant, after a short startup delay.

## Limitations

- **Single instance only** — there is no cross-instance lock, so the reaper
  assumes one active instance. Horizontal scaling is future work: it would need a
  Postgres advisory lock around each pass, or an externally triggered route hit by
  a single scheduler.
- **One global storage root** — blobs for all tenants share `DATA_STORAGE`. A
  per-tenant storage root is future work; only the root needs threading through
  the route and reaper.
- **Retry can orphan a claim** — if an earlier attempt reached the server, the
  orphan is reclaimed by the TTL + reaper rather than immediately.
- **Redeem failures are indistinguishable** — not-found / wrong-owner / expired /
  already-consumed all surface as a single "Upload not redeemable".

_Living spec — update it alongside functional changes._
