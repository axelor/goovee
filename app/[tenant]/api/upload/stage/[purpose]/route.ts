import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import type {GooveeClient} from '@/goovee/.generated/client';
import type {FileStore} from '@/storage/index';
import {manager} from '@/tenant';
import {getSession} from '@/auth';
import {
  appendChunk,
  createSession,
  finalizeSession,
  findSession,
  getUploadPolicy,
  releaseSessionQuietly,
  type AppendOutcome,
} from '@/upload/staged-upload';
import {byteCountHeader, fileIdHeader} from '@/upload/validators';
import {RequestBodyTooLarge} from '@/security/request-body';

export const runtime = 'nodejs';

/*
 * What an answer that never reads its body reads and throws away first. A
 * legitimate part is smaller than this.
 */
const MAX_DRAIN_BYTES = 8 * 1024 * 1024;

/*
 * And how long it will spend doing so. A sender that stops sending without
 * closing would otherwise hold the handler until the server's own request
 * timeout, which Node leaves at five minutes.
 */
const MAX_DRAIN_MS = 2_000;

/**
 * One upload, addressed by purpose, driven by the request method.
 *
 * `POST` opens an upload and may carry the first part; `PATCH` appends;
 * `HEAD` reports how much has arrived, so an interrupted transfer can be
 * resumed; `DELETE` gives up on one. Everything after the first request
 * identifies itself with the `X-File-Id` handed back by it.
 *
 * The header names follow the platform's own upload service (`X-File-*`) rather
 * than any external convention.
 */

/**
 * A caller resolved against a tenant, holding an upload of their own.
 *
 * The client and the store travel together so they can never be paired from
 * different tenants: bytes handed to one tenant's store but recorded in
 * another's database assemble into a file neither can read back.
 */
interface FileCaller {
  tenantId: string;
  sessionId: string;
  owner: string;
  client: GooveeClient;
  store: FileStore;
}

/**
 * Marks a caller whose session belongs to another tenant, as distinct from one
 * with no session at all.
 */
const FORBIDDEN = 'forbidden';

/**
 * Decode the client-supplied filename header, falling back to a default. The
 * header is percent-encoded so unicode names round-trip; malformed input falls
 * back rather than throwing.
 */
function decodeFileName(raw: string | null): string {
  if (!raw) return 'file';
  try {
    return decodeURIComponent(raw) || 'file';
  } catch {
    return 'file';
  }
}

/**
 * Resolve the tenant an authenticated caller is addressing.
 *
 * Resolving a tenant reads configuration and opens a database connection, so a
 * failure here is as likely to be the database being unreachable as it is a bad
 * segment. The two are indistinguishable to this caller, so the error is logged
 * before it is reported as a request that could not be served.
 */
async function resolveTenantClient(tenantId: string) {
  const session = await getSession();
  if (!session?.user) return null;

  /* Nothing upstream compares the session's tenant with the one in this path.
   * `getSession` resolves the session of the tenant the address names, so the
   * two agree unless something above changes; this refuses the disagreement
   * rather than assuming it cannot happen, and refusing here covers every
   * method below rather than the opening request only. */
  if (session.user.tenantId !== tenantId) return FORBIDDEN;

  const tenant = await manager.getTenant(tenantId).catch(error => {
    console.error(`Stage upload could not resolve tenant ${tenantId}:`, error);
    return null;
  });
  if (!tenant) return null;

  return {
    tenantId,
    owner: session.user.id,
    client: tenant.client,
    store: tenant.store,
  };
}

/**
 * Answer a request whose body was never read.
 *
 * Node will not keep a connection whose request went unconsumed, and the reset
 * can reach the client before the answer does — turning a 409 the client knows
 * how to resume from into a network failure it does not.
 */
async function answerWithoutBody(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  /* Locked where the body was already handed to the store: reading it is what
   * this exists to make unnecessary, and asking for a second reader throws. */
  if (!request.body || request.body.locked) return response;

  const reader = request.body.getReader();

  let timer: NodeJS.Timeout | undefined;
  let drained = 0;

  /*
   * The deadline has to hold without the body answering, which is why it is
   * raced against each read rather than tested after one, and why the cancel
   * below is not awaited. On next 16.2.4 a request body that has yielded
   * nothing leaves `read` pending for the whole of the server's request
   * timeout, and a `cancel` issued while that read is in flight never settles
   * either; both were measured against this route. A body that cancelled when
   * asked would make all of this a `pipeTo` with an `AbortSignal.timeout`.
   *
   * The byte bound below needs none of that: it only advances as bytes arrive,
   * and a sender that sends none is the deadline's business.
   */
  const expired = new Promise<null>(resolve => {
    timer = setTimeout(() => resolve(null), MAX_DRAIN_MS);
  });

  try {
    for (;;) {
      const next = await Promise.race([reader.read(), expired]);

      // null comes only from the timer, so the bound was reached first
      if (!next || next.done) break;

      drained += next.value?.byteLength ?? 0;

      // past this it is not a body the route would have accepted
      if (drained > MAX_DRAIN_BYTES) break;
    }
  } catch {
    /* The client stopped first, which is the outcome this avoids anyway. */
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => undefined);
  }

  return response;
}

/**
 * Resolve a caller against an upload they already opened. The id is theirs to
 * present but the upload is only ever found within their own records, so one
 * user can neither read nor advance another's.
 */
async function resolveFileCaller(
  request: NextRequest,
  tenantId: string,
): Promise<FileCaller | typeof FORBIDDEN | null> {
  const fileId = fileIdHeader.safeParse(request.headers.get('x-file-id'));
  if (!fileId.success) return null;

  const resolved = await resolveTenantClient(tenantId);
  if (!resolved || resolved === FORBIDDEN) return resolved;

  return {sessionId: fileId.data, ...resolved};
}

/**
 * Open an upload.
 *
 * The total size is declared up front in `X-File-Size`, so a file over the
 * purpose's limit is refused before a single byte is transferred. The name rides
 * in `X-File-Name` (encoded so unicode round-trips) and the type in
 * `X-File-Type`.
 *
 * A body may be sent with this request. When it carries the whole file the
 * upload is opened, filled and completed in one round trip, so a small file
 * costs exactly one request; otherwise the remaining bytes follow as parts
 * against the returned `X-File-Id`.
 */
export async function POST(
  request: NextRequest,
  props: {params: Promise<{tenant: string; purpose: string}>},
) {
  const {tenant: tenantId, purpose} = await props.params;

  // purpose is in the path, so the size limit is known before the body is read
  const policy = getUploadPolicy(purpose);
  if (!policy) {
    return answerWithoutBody(
      request,
      NextResponse.json({error: 'Unknown upload purpose'}, {status: 404}),
    );
  }

  const resolved = await resolveTenantClient(tenantId);
  if (resolved === FORBIDDEN) {
    return answerWithoutBody(
      request,
      new NextResponse('Forbidden', {status: 403}),
    );
  }
  if (!resolved) {
    return answerWithoutBody(
      request,
      new NextResponse('Unauthorized', {status: 401}),
    );
  }

  const declaredSize = byteCountHeader.safeParse(
    request.headers.get('x-file-size'),
  );
  if (!declaredSize.success || declaredSize.data === 0) {
    return answerWithoutBody(
      request,
      NextResponse.json({error: 'Missing file'}, {status: 400}),
    );
  }
  if (declaredSize.data > policy.maxBytes) {
    return answerWithoutBody(
      request,
      NextResponse.json({error: 'File too large'}, {status: 413}),
    );
  }

  /* The purpose may refuse the file by what the client says it is. A refusal,
   * not a fault, and answered before a byte is read. */
  let sessionId: string;
  try {
    ({sessionId} = await createSession({
      purpose,
      owner: resolved.owner,
      client: resolved.client,
      store: resolved.store,
      fileName: decodeFileName(request.headers.get('x-file-name')),
      fileType:
        request.headers.get('x-file-type') || 'application/octet-stream',
      uploadLength: declaredSize.data,
    }));
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return answerWithoutBody(
        request,
        NextResponse.json({error: z.prettifyError(error)}, {status: 400}),
      );
    }

    throw error;
  }

  const caller: FileCaller = {sessionId, ...resolved};

  /* A request that opened the upload and carried nothing arrives below as an
   * empty body, answered the same way; this stays because the type admits no
   * body at all. */
  if (!request.body) {
    return fileIdResponse(caller, 0, 201);
  }

  return appendAndAnswer(caller, request, request.body, 0, 201);
}

/**
 * Append a part at the offset the caller declares.
 *
 * A mismatched offset is answered `409` carrying the authoritative one, so a
 * caller that lost track re-seeks rather than corrupting the file. The part that
 * completes the file also finalizes it and answers with the redeem token.
 */
export async function PATCH(
  request: NextRequest,
  props: {params: Promise<{tenant: string; purpose: string}>},
) {
  const {tenant: tenantId} = await props.params;

  const caller = await resolveFileCaller(request, tenantId);
  if (caller === FORBIDDEN) {
    return answerWithoutBody(
      request,
      new NextResponse('Forbidden', {status: 403}),
    );
  }
  if (!caller) {
    return answerWithoutBody(
      request,
      new NextResponse('Unauthorized', {status: 401}),
    );
  }

  const offset = byteCountHeader.safeParse(
    request.headers.get('x-file-offset'),
  );
  if (!offset.success) {
    return answerWithoutBody(
      request,
      NextResponse.json({error: 'Missing file offset'}, {status: 400}),
    );
  }

  /* A part carrying nothing is an ask to finish: an upload whose every byte
   * arrived has to stay claimable however many times the answer is lost, so a
   * caller sends the empty part its file has left at `uploadLength`. That part
   * arrives below rather than here, since the framework hands this handler a
   * stream whether or not the request framed a body; this stays because the
   * type admits none. */
  if (!request.body) {
    return completeUpload(caller);
  }

  return appendAndAnswer(caller, request, request.body, offset.data, 204);
}

/**
 * Report how much of the upload the server holds, so an interrupted caller
 * knows where to resume from. The offset here is authoritative — a caller never
 * assumes its own view survived the interruption.
 */
export async function HEAD(
  request: NextRequest,
  props: {params: Promise<{tenant: string; purpose: string}>},
) {
  const {tenant: tenantId} = await props.params;

  const caller = await resolveFileCaller(request, tenantId);
  if (caller === FORBIDDEN) return new NextResponse(null, {status: 403});
  if (!caller) return new NextResponse(null, {status: 401});

  const state = await findSession(caller);
  if (!state) return new NextResponse(null, {status: 404});

  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-File-Offset': String(state.offset),
      'X-File-Size': String(state.length),
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * Give up on an upload, freeing its storage immediately. Only ever an
 * optimisation — a caller that never sends this leaves the upload to the expiry
 * sweep, which reclaims it either way.
 */
export async function DELETE(
  request: NextRequest,
  props: {params: Promise<{tenant: string; purpose: string}>},
) {
  const {tenant: tenantId} = await props.params;

  const caller = await resolveFileCaller(request, tenantId);
  if (caller === FORBIDDEN) return new NextResponse(null, {status: 403});
  if (!caller) return new NextResponse(null, {status: 401});

  await releaseSessionQuietly(caller);

  return new NextResponse(null, {status: 204});
}

/** The shape every request that does not complete the file answers with. */
function fileIdResponse(caller: FileCaller, offset: number, status: number) {
  const headers = {
    'X-File-Id': caller.sessionId,
    'X-File-Offset': String(offset),
  };

  return status === 204
    ? new NextResponse(null, {status, headers})
    : NextResponse.json({fileId: caller.sessionId, offset}, {status, headers});
}

/**
 * Store one part and answer for it, whichever request carried it.
 *
 * `ongoingStatus` is what a part that leaves the file unfinished answers with:
 * `201` for the request that opened the upload, `204` for one that appended to
 * it.
 */
async function appendAndAnswer(
  caller: FileCaller,
  request: NextRequest,
  body: ReadableStream<Uint8Array>,
  offset: number,
  ongoingStatus: number,
) {
  /* A user cancelling mid-part tears down the request stream, which surfaces
   * here as a read failure. That is an ordinary way for an upload to end, so it
   * is answered rather than left to escape as an unhandled fault. */
  let appended: AppendOutcome;
  try {
    appended = await appendChunk({
      ...caller,
      offset,
      body,
    });
  } catch (error: unknown) {
    if (error instanceof RequestBodyTooLarge) {
      /* More bytes than the file declared, so it can never complete — the
       * upload is finished with rather than left to occupy storage until it
       * expires. */
      await releaseSessionQuietly(caller);
      return NextResponse.json({error: 'File too large'}, {status: 413});
    }

    console.error('Stage upload append error:', error);
    return NextResponse.json(
      {error: 'Part could not be stored'},
      {status: 500},
    );
  }

  if (appended.status === 'not-found') {
    return answerWithoutBody(
      request,
      new NextResponse('Not found', {status: 404}),
    );
  }
  if (appended.status === 'conflict') {
    /* The id rides along because the request that opened the upload can be
     * answered this way — its body stopped part-way and what arrived was kept.
     * Without it the caller would not know an upload exists to carry on with. */
    return answerWithoutBody(
      request,
      NextResponse.json(
        {
          error: 'Offset mismatch',
          fileId: caller.sessionId,
          offset: appended.offset,
        },
        {
          status: 409,
          headers: {
            'X-File-Id': caller.sessionId,
            'X-File-Offset': String(appended.offset),
          },
        },
      ),
    );
  }
  if (appended.status === 'ok' && !appended.complete) {
    return fileIdResponse(caller, appended.offset, ongoingStatus);
  }

  /* Either this piece completed the file, or it was already complete and the
   * caller is asking again because it never saw the answer. Completing is
   * idempotent, so both are served the same way — and the second carries a body
   * nothing read, so the answer waits for it to be drained. */
  return answerWithoutBody(request, await completeUpload(caller));
}

/**
 * Complete an upload, answering with the redeem token.
 *
 * The whole file has been transferred by the time this runs, so a failure
 * leaves the upload in place for the caller to ask again rather than throwing
 * the bytes away. A `PATCH` carrying no bytes at `uploadLength` is that ask.
 *
 * Asking again recovers a store that assembles a file by moving it into place.
 * One that assembles from pieces it holds has none left after the first
 * attempt, so the session stays unclaimable until it expires; the file is
 * stored either way, and the sweep removes it through the recorded key.
 */
async function completeUpload(caller: FileCaller) {
  try {
    const completed = await finalizeSession(caller);

    if (completed.status === 'not-found') {
      return new NextResponse('Not found', {status: 404});
    }

    /* Not every byte is there, and the count has come down to what the store
     * holds. The caller is told where to carry on from. */
    if (completed.status === 'incomplete') {
      const state = await findSession(caller);

      return NextResponse.json(
        {
          error: 'Upload is incomplete',
          fileId: caller.sessionId,
          offset: state?.offset ?? 0,
        },
        {
          status: 409,
          headers: {
            'X-File-Id': caller.sessionId,
            'X-File-Offset': String(state?.offset ?? 0),
          },
        },
      );
    }

    return NextResponse.json(
      {
        token: completed.token,
        fileName: completed.fileName,
        sizeText: completed.sizeText,
      },
      {
        headers: {
          'X-File-Id': caller.sessionId,
          'X-File-Offset': String(completed.size),
        },
      },
    );
  } catch (error: unknown) {
    console.error('Stage upload error:', error);
    return NextResponse.json(
      {error: 'Upload could not be staged'},
      {status: 500},
    );
  }
}
