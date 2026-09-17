# Staged Upload

> Infrastructure, not an end-user feature. Lets a file be uploaded **before** the
> record that will own it exists.

A **claim-check** mechanism. A file is staged against a declared **purpose** and
answered with an opaque, single-use **token** — never a `meta_file` id. At submit
the consumer **redeems** the token and the server links the file to the record it
has just created. A staged file that is never redeemed is reclaimed on its own.

The file travels in **pieces** against one server-side **upload**. No single
request carries a whole file — a request is bounded by the server's own request
timeout, not by memory — and an interrupted transfer resumes from the bytes the
server confirms it holds. A file that fits in one piece costs one request.

"Piece" throughout means one request's worth. A store that assembles a file from
**parts** of its own choosing is a separate matter, described under Storage;
the two sizes are unrelated and a client never sees the second.

Everything is scoped to a **tenant**, and within it to the **user** who staged
the file. Purpose is checked where it decides an outcome — opening an upload and
redeeming a token — rather than on every request against an upload the caller
already owns.

---

## Registering a purpose

A feature that stages files registers one entry in `UPLOAD_PURPOSES`, named
`<app>:<kind>`:

| Field      | Required | Meaning                                                                       |
| ---------- | -------- | ----------------------------------------------------------------------------- |
| `maxBytes` | yes      | Largest file this purpose accepts.                                            |
| `ttlMs`    | no       | How long a staged file survives unredeemed. Defaults to 24h.                  |
| `declared` | no       | Zod schema run on the name and type the client states, when the upload opens. |

A size rule cannot go in the `declared` schema: it only ever sees the name and
the type, and `maxBytes` is what bounds the bytes. Do not expect it to prove
anything about them either — see Validation.

Set `ttlMs` to the shortest window the feature can live with: it bounds how long
an abandoned file occupies storage. Raising one past the 24h default also obliges
an edit to CONFIGURATION.md and `migrations/object-storage.md`, which tell an
operator the lifecycle window a bucket needs as a figure in hours — 25 today,
being the longest TTL plus the hourly sweep.

An unregistered purpose is refused. Purposes are permanent once shipped — a
staged file names its purpose, and renaming one strands every upload in flight.

## Staging from the browser

Use `useStagedUpload({tenantScope})`. Nothing else should speak the protocol
directly.

```ts
const {uploads, upload, pause, resume, remove, reset, isStaged} =
  useStagedUpload({tenantScope});

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
POST   /{tenant}/api/upload/stage/{purpose}
X-File-Name: <percent-encoded name>
X-File-Type: <mime type>
X-File-Size: <total bytes>
Content-Type: application/octet-stream
[body: the first part, optional]

201 → X-File-Id, X-File-Offset · {fileId, offset}
200 → the completion response below, if the body carried the whole file
409 → X-File-Id, X-File-Offset — the body stopped part-way; the upload exists
      and holds what arrived
400 → X-File-Size missing, unparseable or zero, or the purpose refused the
      declared name and type (the two are told apart by the JSON `error`)
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
file the client is willing to send as a single piece — the same limits apply to
it as to any append. Open a larger file with no body and send it as appends.

### Ask where to resume

```
HEAD   /{tenant}/api/upload/stage/{purpose}
X-File-Id: <id>

200 → X-File-Offset, X-File-Size
404 → no such live upload
```

### Append

```
PATCH  /{tenant}/api/upload/stage/{purpose}
X-File-Id: <id>
X-File-Offset: <where this part starts>
Content-Type: application/octet-stream
[body: the part]

204 → X-File-Offset (new)
400 → X-File-Offset missing or unparseable
409 → X-File-Id, X-File-Offset (authoritative) — either the offset did not
      match, or the body stopped part-way and what arrived was kept
413 → more bytes than the file declared; the upload is released
404 → no such live upload
```

### Complete

Happens on its own with the piece that brings the offset up to `X-File-Size`,
and can also be asked for: a `PATCH` carrying **no bytes** means "finish this".

```
PATCH  /{tenant}/api/upload/stage/{purpose}
X-File-Id: <id>
X-File-Offset: <the offset the server holds — compared, as for any piece>
[empty body]

200 → X-File-Id, X-File-Offset · {token, fileName, sizeText}
409 → X-File-Id, X-File-Offset — the offset disagrees, or not every byte is
      there; carry on from the offset given
404 → no such live upload
```

An empty piece is a piece, so the offset is compared exactly as it is for one
carrying bytes: ask at `X-File-Size` and a whole file answers the token, while
anything else answers `409` with the offset to carry on from. A client that has
lost track sends `HEAD` first.

Completing is idempotent, so a client whose answer was lost — or whose earlier
completion failed on something that has since passed — asks again and is given
the same token. Without that an upload whose every byte had arrived could not be
claimed at all.

### Give up

```
DELETE /{tenant}/api/upload/stage/{purpose}
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
3. Every piece against the bytes actually received, counted as they pass, so a
   piece carrying more than the file has left to receive is refused with `413`
   and the upload given up.

Only the last two are enforcement. A client that skips the first is still
refused.

## Validation

A purpose's `declared` schema runs once, when the upload opens, against the name
and the type the client states in `X-File-Name` and `X-File-Type`. A rejection
answers `400` before a byte is transferred.

**It checks what the client says, not what it sends.** Both values arrive in
request headers, so neither is evidence about the bytes: a file declaring
`image/png` and carrying anything at all satisfies every schema here. The check
keeps an obvious mistake out of a feature and names the reason in the answer.

Nothing validates content, and nothing can at this layer: the pieces reach the
store as they arrive and no whole file is ever held to inspect. A purpose whose
safety depends on what a file really contains has to get that where the file is
served.

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
    └────────────────────┘         │ REAP: release the store's write
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

| Record state                         | Redeemable? | Reap                                            | Prune                  |
| ------------------------------------ | ----------- | ----------------------------------------------- | ---------------------- |
| Incomplete, **within** TTL           | ❌          | —                                               | —                      |
| Incomplete, **past** TTL (abandoned) | ❌          | **releases** the store's write, sets `reapedAt` | —                      |
| Complete, **within** TTL             | ✅          | —                                               | —                      |
| Complete, **past** TTL (abandoned)   | ❌          | **deletes** blob + meta_file, sets `reapedAt`   | —                      |
| Reaped, **within** retention         | —           | — (skipped, `reapedAt` set)                     | —                      |
| Reaped, **past** retention           | —           | —                                               | **deletes the record** |
| Consumed, **within** retention       | spent       | —                                               | —                      |
| Consumed, **past** retention         | spent       | —                                               | **deletes the record** |

A redeemed file belongs to the record that redeemed it, and no sweep ever touches
it again. Reaping keeps the record, marked `reapedAt`, so a vanished file can be
accounted for; pruning is what finally removes it.

## Storage

A piece that arrives is handed straight to the tenant's **file store**, which
takes it up again for each request and decides for itself how to gather one. The
store is the one the tenant's AOS instance keeps its files in — its upload
directory, or an S3-compatible bucket — chosen by the tenant's `aos.storage`
settings; see `lib/core/storage`. The `meta_file` row records the key the store
holds the file under and the store's kind (`store_type`), as AOP records them.

A session records two things about it: the **key** the file will take, and an
opaque **state** the store hands back after every piece. The state is the
store's own bookkeeping and this module never reads it — it is persisted and
handed back, and that is the whole of the contract. Recording it in the same
insert that opens the session is what keeps anything the store stages from being
left untracked.

An interrupted piece resumes from the exact byte it stopped on, whichever store
holds the file. A bucket reaches that differently from a directory: it cannot be
appended to, and it refuses any part but the last below 5 MiB, so the bytes that
do not yet fill a part are gathered in `upload.tempDir` — at most one part's
worth per upload in flight.

Two cases fall back to the last whole part rather than the exact byte, and both
cost at most `partSize` of re-sent bytes: a part that reached the bucket whose
count was never recorded, and a restart that cleared `upload.tempDir`. The
`filesystem` store has one case of its own, and it is not a boundary: a storage
directory cleared under a live upload leaves nothing to resume from, and the
client is sent back to zero.

The store is the authority on how many bytes it holds. Where its count and the
record's disagree, the record is brought to the store's count and the client is
answered with it, forward or back. Neither leaves a hole and neither counts a
byte twice.

Completing makes the file visible under its key before the record says so, so a
session interrupted between the two leaves a stored file its record does not yet
name; the sweep finds it through the key it does record.

## Configuration

Nothing here reads a variable of its own; every setting comes from the tenant's
or the deployment's configuration.

| Setting                                            | Default                 | Controls                                                                                               |
| -------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `PORTAL_TENANT_<ID>_UPLOAD_RECORD_RETENTION_HOURS` | 168 (7d)                | How long a terminal (consumed or reaped) record is kept.                                               |
| `PORTAL_TENANT_<ID>_AOS_STORAGE_…`                 | —                       | The tenant's file store: provider and its settings. Required.                                          |
| `PORTAL_UPLOAD_TEMP_DIR`                           | `<temp>/portal/uploads` | Where a store that cannot be appended to stages a piece, one subdirectory per tenant. Deployment-wide. |
| `PORTAL_TENANT_<ID>_AOS_STORAGE_S3_PART_SIZE`      | 16 MiB                  | Bytes per part for an S3 store; no less than 5 MiB, no more than 5 GiB.                                |

The retention is read in hours, fractional allowed; unset, non-positive or
invalid falls back to the default.

The tenant's store and its database client travel together through this module,
so the two cannot be paired from different tenants. A
tenant on a shared AOS (`aos.tenantId` set) reads and writes its store under the
subdirectory or key prefix AOP gives that tenant; a dedicated instance uses the
store as it is.

Everything else is fixed: per-purpose settings live in the registry, and the
sweep cadences bound only the lag between expiry and deletion.

## Limitations

- **Single instance only.** The sweeps take no cross-instance lock, and the queue
  that stops two appends to one upload from interleaving is an in-process map.
  For an S3 store the bytes gathered for the part in flight also sit on the disk
  of the instance that received them. Scaling out needs upload-pinned routing, an
  advisory lock per sweep, and a shared lock per upload — a shared staging
  directory is **not** an alternative to the per-upload lock, and without it is
  worse than per-instance directories, since two instances gathering one part in
  the same file leave a file of the right length holding the wrong bytes. The
  stored files themselves are shared wherever the store is.
- **A resume survives a restart only as far as the store's own bytes do.** On the
  `filesystem` store they are in the storage directory and survive. On `s3`,
  whole parts are in the bucket and survive; the part being gathered is in
  `PORTAL_UPLOAD_TEMP_DIR`, which defaults to `portal/uploads` inside the
  operating system's temporary directory — point it at a volume to keep that last part too, or accept
  resuming from the last part boundary after a restart.
- **Containment is lexical.** A recorded key is verified to name a location
  inside the tenant's store and outside the directory that store gathers writes
  in, but a symlink inside a directory pointing out of it is not followed or
  detected. (A tenant's store root resolving inside another's — the same
  directory or bucket prefix, or one under the other — is refused when the
  configuration is read, so that is not a way in.)
- **A failed delete leaks.** Giving up on a session releases what the store
  staged first and only then gives up the record, so a failure there is retried
  by the next sweep — but the assembled file is deleted after the record has
  given up its name, so a removal that fails there leaves a file no sweep looks
  for. It is logged; nothing retries it.
- **Staged bytes no record names are reclaimed by age, not by record.** Each
  store sweeps its own staging — a bucket's local spill files, a filesystem's
  `.uploads-in-progress` directory — of anything untouched for longer than the
  longest a session may live. That is the only reach for a piece that arrived
  after its record gave up the name it was staged under, which a release or a
  sweep racing an append leaves behind. A bucket needs a lifecycle rule
  besides, since a multipart upload carries no age this can read.
- **No cap on open uploads.** A record is created from headers alone, before any
  bytes arrive. Each is bounded by its TTL, but nothing limits how many one user
  holds at once.
- **Redeem failures are indistinguishable** — not-found, wrong-owner, expired and
  already-consumed all surface the same way.

_Living spec — update it alongside functional changes._
