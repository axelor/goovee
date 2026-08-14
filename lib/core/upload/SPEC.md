# Staged Upload

> Infrastructure, not an end-user feature. Lets a file be uploaded **before** the
> record that will own it exists.

A **claim-check** mechanism. A file is staged against a declared **purpose** and
answered with an opaque, single-use **token** — never a `meta_file` id. At submit
the consumer **redeems** the token and the server links the file to the record it
has just created. A staged file that is never redeemed is reclaimed on its own.

The file travels in **parts** against one server-side **upload**. No single
request carries a whole file, and an interrupted transfer resumes from the bytes
the server confirms it holds. A file that fits in one part costs one request.

Everything is scoped to a **tenant**, and within it to the **user** who staged
the file. Purpose is checked where it decides an outcome — opening an upload and
redeeming a token — rather than on every request against an upload the caller
already owns.

---

## Registering a purpose

A feature that stages files registers one entry in `UPLOAD_PURPOSES`, named
`<app>:<kind>`:

| Field      | Required | Meaning                                                        |
| ---------- | -------- | -------------------------------------------------------------- |
| `maxBytes` | yes      | Largest file this purpose accepts.                             |
| `ttlMs`    | no       | How long a staged file survives unredeemed. Defaults to 24h.   |
| `file`     | no       | Zod schema run against the assembled file — mime, magic bytes. |

Do not put a size rule in the `file` schema; `maxBytes` covers it and is applied
far earlier. Set `ttlMs` to the shortest window the feature can live with: it
bounds how long an abandoned file occupies storage.

An unregistered purpose is refused. Purposes are permanent once shipped — a
staged file names its purpose, and renaming one strands every upload in flight.

## Staging from the browser

Use `useStagedUpload({tenant})`. Nothing else should speak the protocol directly.

```ts
const {uploads, upload, pause, resume, remove, reset, isStaged} =
  useStagedUpload({tenant});

const {ids, done} = upload(files, {purpose, maxBytes});
```

- `ids` is returned immediately, one per input file and aligned with it. Bind
  each to the form row it belongs to; it is the handle for `pause`, `resume` and
  `remove`. Look an entry up with `uploads.find(item => item.id === ids[index])`.
- `done` resolves with the files that succeeded, in input order. It never
  rejects, and it omits anything paused or failed — so treat a short array as
  ordinary, not as an error.
- `maxBytes` is the purpose's cap, passed as a backstop: the hook refuses an
  oversized file without making a request. Reject oversized files at the picker
  too, where the file and its limit can be named — the hook's refusal only
  leaves a failed row, and removing it is the only way out.

Consumers must:

- **Gate submit on `isStaged`.** It is true only when every file held has been
  staged. Gating on anything narrower lets a paused or failed file through, and
  submit will drop it in silence.
- **Render `item.error` when a file fails.** It is already translated and it is
  the only thing that tells the user what went wrong.
- **Offer pause, resume and remove** wherever a file can be uploading. A file
  that cannot be resumed or removed is a dead end.
- **Call `remove(id)`** when the user takes a file off the form, so its storage
  is freed rather than left to expire.

Consumers must not construct requests, hold `meta_file` ids, or treat a token as
anything but opaque.

## Redeeming at submit

```ts
const fileId = await redeemUpload({token, purpose, owner, client});
```

Call it inside the same transaction that creates the owning record, so a failure
leaves neither the record nor a spent claim behind. It re-checks owner, purpose
and freshness, marks the claim consumed, and returns the `meta_file` id to link.

A token is single-use. Redeeming twice fails the second time.

Redeem answers ownership of the **file**. The consumer still checks the user's
right to the **record** it is attaching that file to — this mechanism knows
nothing about the target entity.

---

## Protocol

For a client that is not the browser hook. One address per purpose; the method
says what to do. Every request is authenticated, and an upload is visible only to
the user who opened it — the purpose in the path selects the policy when opening,
and is not re-checked on the requests that follow. Header names follow the
platform's own upload service.

Two answers are common to every request below and are not repeated in each. A
request without a session answers `401`, and so does one whose `X-File-Id` is not
a well-formed id — a malformed header is indistinguishable from an upload that is
not yours. A part that could not be stored answers `500`, and may be sent again.

### Open

```
POST   /api/tenant/{tenant}/upload/stage/{purpose}
X-File-Name: <percent-encoded name>
X-File-Type: <mime type>
X-File-Size: <total bytes>
Content-Type: application/octet-stream
[body: the first part, optional]

201 → X-File-Id, X-File-Offset · {fileId, offset}
200 → the completion response below, if the body carried the whole file
409 → X-File-Id, X-File-Offset — the body stopped part-way; the upload exists
      and holds what arrived
400 → X-File-Size missing, unparseable, or zero
404 → no such purpose
413 → larger than the purpose accepts
```

Take `X-File-Id` from whichever answer carries it, before looking at the status.
An opening request can be answered `409`, and a client that reads the id only
from a success would open a second upload and send the rest of the file into it
as though from the start.

`X-File-Size` is required and is checked before any bytes are read. An empty file
is refused — there is nothing to stage.

A body may be sent with this request, and when it carries the whole file the
upload is opened, filled and completed in one round trip. Send one only for a
file that fits in a single part — a body is still one part, and the same size
and proxy limits apply to it as to any append. Open a larger file with no body
and send every part as an append.

### Ask where to resume

```
HEAD   /api/tenant/{tenant}/upload/stage/{purpose}
X-File-Id: <id>

200 → X-File-Offset, X-File-Size
404 → no such live upload
```

### Append

```
PATCH  /api/tenant/{tenant}/upload/stage/{purpose}
X-File-Id: <id>
X-File-Offset: <where this part starts>
Content-Type: application/octet-stream
[body: the part]

204 → X-File-Offset (new)
400 → X-File-Offset missing or unparseable, or no body sent
409 → X-File-Id, X-File-Offset (authoritative) — either the offset did not
      match, or the body stopped part-way and what arrived was kept
413 → more bytes than the file declared; the upload is released
404 → no such live upload
```

### Complete

Implicit, on the part that brings the offset up to `X-File-Size`. The assembled
file is validated and recorded, and the token is returned:

```
200 → X-File-Id, X-File-Offset · {token, fileName, sizeText}
```

Repeating the final part returns the same token, so a client that never saw the
answer may simply ask again.

### Give up

```
DELETE /api/tenant/{tenant}/upload/stage/{purpose}
X-File-Id: <id>

204
```

Send this when the user abandons a file. It is an optimisation — expiry reclaims
the upload either way — so never depend on it having been sent. Do not send it
for a merely paused upload, which is still resumable.

### Rules a client must follow

- **One part in flight per upload.** Parts within a file go in order; different
  files may go in parallel. Send a second part before the first has finished
  arriving and it is made to wait — but that serialisation is per process, so on
  more than one instance the two would interleave and corrupt the file. It is
  the client's rule to keep, not the server's to guarantee.
- **The server's offset wins.** On `409`, seek to the offset it reports rather
  than resending. Never assume a local offset survived an interruption — ask with
  `HEAD`.
- **A `409` may report an offset ahead of yours.** A part that stopped arriving
  part-way still had what arrived committed, so the answer is where to carry on
  from, not a disagreement to retry.
- **The server may also hold less than you last saw.** Either way, take the
  offset it reports and continue from there.
- **On `404`, the upload is gone.** Open a new one and start the file again.
- **Bound your recovery.** Re-seeking and restarting are for genuine
  interruptions; a client that loops on them forever will never surface a real
  failure to the user.

---

## Size

Three checks, because the declared length is client input:

1. The client refuses a file over the `maxBytes` it was given, before any
   request. A convenience, not a control.
2. `X-File-Size` against the purpose's `maxBytes`, before a byte is read.
3. Every part against the bytes actually received.

Only the last two are enforcement. A client that skips the first is still
refused.

## Validation

A purpose's `file` schema runs once, at completion, against the whole assembled
file. A rejection answers `400` and gives the upload up, so the bytes are gone
and there is nothing left to resume from.

A rejected file will be rejected again on every attempt, so a client that offers
a retry should not offer one here. The browser hook does not yet tell this case
apart from a transient failure: it reports the generic failure message and its
retry re-sends the whole file to the same refusal.

## Expiry

An upload's deadline is set when it opens, from the purpose's `ttlMs`, and never
moves. The allowance covers transferring the file **and** redeeming it. Past the
deadline the upload is abandoned whether or not every byte arrived.

Inside its window an upload is never reclaimed and may be resumed at any point.

## What the system guarantees

Expiry is the only guarantee that storage is reclaimed. It never depends on a
client having given anything up.

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

Two sweeps run per tenant, independently: **reap** reclaims storage once an
upload has expired, and **prune** deletes the leftover record after a retention
window.

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

A redeemed file belongs to the record that redeemed it, and no sweep ever touches
it again. Reaping keeps the record, marked `reapedAt`, so a vanished file can be
accounted for; pruning is what finally removes it.

## Configuration

| Environment variable            | Default       | Controls                                                 |
| ------------------------------- | ------------- | -------------------------------------------------------- |
| `UPLOAD_RECORD_RETENTION_HOURS` | 168 (7d)      | How long a terminal (consumed or reaped) record is kept. |
| `DATA_STORAGE`                  | `cwd/storage` | Blob storage root.                                       |

`UPLOAD_RECORD_RETENTION_HOURS` is read in hours, fractional allowed; unset,
non-positive or invalid falls back to the default.

Everything else is fixed: per-purpose settings live in the registry, and the
sweep cadences bound only the lag between expiry and deletion.

## Limitations

- **Single instance only** — a part file lives on the disk of the instance that
  received it, the sweeps take no cross-instance lock, and the queue that stops
  two appends to one upload from interleaving is an in-process map. Scaling out
  needs shared storage or upload-pinned routing, an advisory lock per sweep, and
  a shared lock per upload.
- **One storage root for all tenants.**
- **A failed delete leaks.** Storage is given up in the record before it is
  removed from disk, so an `unlink` that fails leaves a file no later sweep looks
  for. It is logged; nothing retries it.
- **No cap on open uploads.** A record is created from headers alone, before any
  bytes arrive. Each is bounded by its TTL, but nothing limits how many one user
  holds at once.
- **Redeem failures are indistinguishable** — not-found, wrong-owner, expired and
  already-consumed all surface the same way.

_Living spec — update it alongside functional changes._
