# Staged Upload

> Infrastructure, not an end-user feature. Lets a file be uploaded **before** the
> record that will own it exists. Consumed by features that register a **purpose**
> (e.g. `marketplace:bundle`).

## What it does

A **claim-check** pattern: stage a file and get back an opaque, single-use
**token** (never the `meta_file` id); at form submit the consumer **redeems** the
token and the server links the file to the new record, so a client never hands
over a file id to trust. Files that are staged but never submitted are
**abandoned**; a background reaper reclaims their storage, then a prune pass
removes the leftover record after a retention window.

The file travels in **parts**, against one server-side **session**. No single
request carries a whole file, and a transfer interrupted part-way **resumes**
from the bytes the server confirmed. A file that fits in one part costs one
request.

Everything is scoped to a **tenant** (its own DB and storage), and within it to
the **user** who staged the file and the declared **purpose**.

## Endpoints

One address per purpose, with the request method saying what to do. All require
authentication. An upload is only ever visible to the user who opened it.

Header names follow the platform's own upload service (`X-File-*`). The upload
being worked on rides in `X-File-Id` rather than in the URL, so it stays out of
access logs.

### Open

```
POST   /api/tenant/{tenant}/upload/stage/{purpose}
X-File-Name: <percent-encoded name>
X-File-Type: <the file's mime type>
X-File-Size: <total bytes>
Content-Type: application/octet-stream
[body: the first part, optional]

201 → X-File-Id, X-File-Offset · {fileId, offset}
200 → the completion response below   (the body carried the whole file)
```

`X-File-Size` is required and checked against the purpose's `maxBytes` before any
bytes are read. A body may be sent with this request; when it carries the whole
file the upload is opened, filled and completed in one round trip.

### Resume

```
HEAD   /api/tenant/{tenant}/upload/stage/{purpose}
X-File-Id: <id>

200 → X-File-Offset, X-File-Size
404 → no such live upload
```

The server's offset is authoritative.

### Append

```
PATCH  /api/tenant/{tenant}/upload/stage/{purpose}
X-File-Id: <id>
X-File-Offset: <the caller's offset>
Content-Type: application/octet-stream
[body: the part]

204 → X-File-Offset (new)
409 → X-File-Offset (authoritative), the offset did not match
413 → more bytes than the file declared; the upload is released
404 → no such live upload
```

### Complete

Implicit, on the part that brings the offset up to `X-File-Size`. The assembled
file is validated, given a name of its own, and recorded as a `meta_file`:

```
200 → X-File-Id, X-File-Offset · {token, fileName, sizeText}
```

Completing is idempotent — repeating the final part returns the same token.

### Release

```
DELETE /api/tenant/{tenant}/upload/stage/{purpose}
X-File-Id: <id>

204
```

Frees an abandoned upload's storage immediately. An optimisation only; the reap
sweep reclaims it either way. Not sent when an upload is merely aborted, since
that upload remains resumable.

### Redeem

`redeemUpload({token, purpose, owner, client})`, called by the consumer in its own
transaction. Re-checks owner, purpose and freshness, marks the claim consumed, and
returns the `meta_file` id to link. The consumer keeps its own ownership checks on
the target entity.

## Expiry

Set once, when the upload opens, from the purpose's `ttlMs` (default 24h). Never
moved. The allowance covers uploading the file **and** redeeming it; past the
deadline the upload is abandoned whether or not every byte arrived.

An upload inside its window is never reaped, and may be resumed at any point up
to the deadline.

## Parts and offsets

- The recorded offset is authoritative. A part's bytes are flushed before its
  offset is recorded.
- A part file is truncated to the recorded offset before anything is appended.
  Truncation only ever shrinks: a part file holding fewer bytes than recorded is
  answered with what is durable, and the recorded offset is corrected down to
  match.
- The offset is recorded conditionally — on the offset the part started from, and
  on the upload still being live. A part whose record no longer accepts it has
  its bytes discarded.
- A file being uploaded and a finished file are different names on disk.
  Completing renames the part, which is what serialises two callers completing
  the same upload: the second finds nothing to rename.
- **One part in flight per upload.** This is the only thing protecting a
  finished file from a straggling append. The rename does not protect it: a file
  handle follows the file, so a request that opened the part before the rename
  goes on writing into the promoted one, and can leave it truncated or rewritten
  while its `meta_file` records the size it had at completion. Sending several
  parts at once is a protocol violation, and its effect is confined to that
  caller's own file.
- Storage is given up in the record before it is deleted from disk, so nothing
  deletes a file another caller has taken over. A delete that then fails leaks
  the file, and says so in the log.

## Size enforcement

Two layers, since the declared length is client input:

1. `X-File-Size` against the purpose's `maxBytes` when the upload opens.
2. Every part against the bytes actually received.

## Validation

`policy.file` runs at completion, against the whole assembled file via
`fs.openAsBlob`. A rejection releases the upload and answers `400`.

## Client

`useStagedUpload` drives the protocol from the browser: per-file progress,
bounded concurrency across files (parts within a file go in order), resume on
retry, and abort.

- **Chunk size** — `UPLOAD_CHUNK_SIZE`, 2 MB. Published guidance places 1–2 MB in
  the band for mobile and unstable links.
- **Failure** — a failed part fails the file. The entry is left in `error` with
  its upload intact; `retry(id)` resumes from the server's offset.
- **Recovery** — a `409` is re-seeked to and a `404` restarts the file, both
  drawing on one allowance of `MAX_UPLOAD_RECOVERIES` per attempt.
- **Abort** leaves the upload resumable; **remove** and **reset** release it.
  Unmounting releases whatever has not finished — nothing survives it to resume
  from — and leaves a finished file to be redeemed or swept.

## Lifecycle

```
                       open
                         │
                         ▼
            ┌────────────────────────┐
            │  Incomplete (filling)  │ ◄── append, offset advances
            └────────────────────────┘
                 │                 │
   offset=length │                 │ expiry passes, never finished
                 ▼                 ▼
    ┌────────────────────┐   ┌──────────────────────────┐
    │ Complete (claim)   │   │  Abandoned (incomplete)  │
    │ meta_file + token  │   └──────────────────────────┘
    └────────────────────┘         │ REAP: delete the part file
       │              │            ▼
redeem │              │ TTL   ┌──────────────────────────┐
       ▼              ▼       │   Reaped (record kept)   │
 ┌──────────┐  ┌────────────┐ └──────────────────────────┘
 │ Consumed │  │ Abandoned  │            │
 └──────────┘  │ (complete) │            │
       │       └────────────┘            │
       │             │ REAP: delete blob │
       │             │ + meta_file       │
       └──────┬──────┴───────────────────┘
              │ PRUNE after retention
              ▼
     staged_upload record deleted
```

## What each cleanup pass touches

| Record state                         | Redeemable? | Reap                                          | Prune                  |
| ------------------------------------ | ----------- | --------------------------------------------- | ---------------------- |
| Incomplete, **within** TTL           | ❌          | —                                             | —                      |
| Incomplete, **past** TTL (abandoned) | ❌          | **deletes** the part file, sets `reapedAt`    | —                      |
| Complete, **within** TTL             | ✅          | —                                             | —                      |
| Complete, **past** TTL (abandoned)   | ❌          | **deletes** blob + meta_file, sets `reapedAt` | —                      |
| Reaped, **within** retention         | —           | — (skipped, `reapedAt` set)                   | —                      |
| Reaped, **past** retention           | —           | —                                             | **deletes the record** |
| Consumed, **within** retention       | spent       | —                                             | —                      |
| Consumed, **past** retention         | spent       | —                                             | **deletes the record** |

An incomplete session owns its part file; a complete one's blob belongs to the
`meta_file` and is reclaimed through that. A session records only the part name,
so clearing one up looks for the promoted name too — a session interrupted
between the rename and the record of it leaves a finished file nothing else
refers to.

Reap keeps the record, marked `reapedAt`, for traceability, and works row by row
(batched by `REAP_BATCH_LIMIT`) so one failure does not abort the sweep. A
consumed record's `meta_file` is live and is never touched. Prune deletes the
record only, in a single bulk delete.

Reap is the only guarantee that storage is reclaimed; it depends on expiry alone,
never on a client having released anything.

## Configuration

| Environment variable            | Default       | Controls                                                 |
| ------------------------------- | ------------- | -------------------------------------------------------- |
| `UPLOAD_RECORD_RETENTION_HOURS` | 168 (7d)      | How long a terminal (consumed or reaped) record is kept. |
| `DATA_STORAGE`                  | `cwd/storage` | Blob storage root.                                       |

`UPLOAD_RECORD_RETENTION_HOURS` is read in **hours** (fractional allowed, e.g.
`0.01` for testing); unset, non-positive, or invalid falls back to the default.

Per-purpose settings — `maxBytes`, `ttlMs`, and an optional `file` schema — live
in the `UPLOAD_PURPOSES` registry. Reap and prune cadences are fixed constants
(hourly and daily) and bound only the lag between expiry and deletion.

Reap and prune run as two independent passes from `instrumentation.ts`, per
tenant, after a short startup delay.

## Limitations

- **Single instance only** — a session's part file lives on the disk of the
  instance that received it, and the reaper has no cross-instance lock.
  Horizontal scaling needs shared storage or session-pinned routing, plus a
  Postgres advisory lock around each sweep.
- **One global storage root** — blobs for all tenants share `DATA_STORAGE`.
- **A failed delete leaks** — both the release path and the reap sweep give the
  storage up in the record before removing it from disk, so an `unlink` that
  fails leaves a file no later sweep will look for. It is logged; nothing
  retries it.
- **No cap on open uploads** — a record is created from headers alone,
  before any bytes arrive. Each is bounded by its TTL and swept like any other,
  but nothing limits how many one user holds at once.
- **Redeem failures are indistinguishable** — not-found, wrong-owner, expired and
  already-consumed all surface as "Upload not redeemable".

_Living spec — update it alongside functional changes._
