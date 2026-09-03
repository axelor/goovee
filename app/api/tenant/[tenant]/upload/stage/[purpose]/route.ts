import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import type {GooveeClient} from '@/goovee/.generated/client';
import {manager} from '@/tenant';
import {getSession} from '@/lib/core/auth';
import {
  appendChunk,
  createSession,
  finalizeSession,
  findSession,
  getUploadPolicy,
  releaseSessionQuietly,
  type AppendOutcome,
} from '@/lib/core/upload/staged-upload';
import {byteCountHeader, fileIdHeader} from '@/lib/core/upload/validators';

export const runtime = 'nodejs';

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
 * The client and the storage root travel together so the two can never be paired
 * from different tenants: a part written under one tenant's root but recorded in
 * another's database assembles into a blob neither can read back.
 */
interface FileCaller {
  tenantId: string;
  sessionId: string;
  owner: string;
  client: GooveeClient;
  storagePath: string;
}

/* Refused because the caller's session belongs to another tenant, as distinct
 * from having no session at all. */
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

  /* `/api/*` is excluded from the proxy, so nothing upstream has compared the
   * session's tenant with the one in this path — the session belongs to whichever
   * tenant the caller signed into, not necessarily this one. Refusing the
   * mismatch in this one place is what keeps every method below covered, rather
   * than the opening request only. */
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
    storagePath: tenant.config.aos.storage,
  };
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
    return NextResponse.json({error: 'Unknown upload purpose'}, {status: 404});
  }

  const resolved = await resolveTenantClient(tenantId);
  if (resolved === FORBIDDEN) {
    return new NextResponse('Forbidden', {status: 403});
  }
  if (!resolved) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const declaredSize = byteCountHeader.safeParse(
    request.headers.get('x-file-size'),
  );
  if (!declaredSize.success || declaredSize.data === 0) {
    return NextResponse.json({error: 'Missing file'}, {status: 400});
  }
  if (declaredSize.data > policy.maxBytes) {
    return NextResponse.json({error: 'File too large'}, {status: 413});
  }

  const {sessionId} = await createSession({
    purpose,
    owner: resolved.owner,
    client: resolved.client,
    fileName: decodeFileName(request.headers.get('x-file-name')),
    fileType: request.headers.get('x-file-type') || 'application/octet-stream',
    uploadLength: declaredSize.data,
  });

  const caller: FileCaller = {sessionId, ...resolved};

  if (!request.body) {
    return fileIdResponse(caller, 0, 201);
  }

  return appendAndAnswer(caller, request.body, 0, 201);
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
  if (caller === FORBIDDEN) return new NextResponse('Forbidden', {status: 403});
  if (!caller) return new NextResponse('Unauthorized', {status: 401});

  const offset = byteCountHeader.safeParse(
    request.headers.get('x-file-offset'),
  );
  if (!offset.success) {
    return NextResponse.json({error: 'Missing file offset'}, {status: 400});
  }
  if (!request.body) {
    return NextResponse.json({error: 'Missing part'}, {status: 400});
  }

  return appendAndAnswer(caller, request.body, offset.data, 204);
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
  stream: ReadableStream<Uint8Array>,
  offset: number,
  ongoingStatus: number,
) {
  /* A user cancelling mid-part tears down the request stream, which surfaces
   * here as a read failure. That is an ordinary way for an upload to end, so it
   * is answered rather than left to escape as an unhandled fault. */
  let appended: AppendOutcome;
  try {
    appended = await appendChunk({...caller, offset, stream});
  } catch (error: unknown) {
    console.error('Stage upload append error:', error);
    return NextResponse.json(
      {error: 'Part could not be stored'},
      {status: 500},
    );
  }

  if (appended.status === 'not-found') {
    return new NextResponse('Not found', {status: 404});
  }
  if (appended.status === 'conflict') {
    /* The id rides along because the request that opened the upload can be
     * answered this way — its body stopped part-way and what arrived was kept.
     * Without it the caller would not know an upload exists to carry on with. */
    return NextResponse.json(
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
    );
  }
  if (appended.status === 'too-large') {
    /* More bytes than the file declared, so it can never complete — the upload
     * is finished with rather than left to occupy storage until it expires. */
    await releaseSessionQuietly(caller);
    return NextResponse.json({error: 'File too large'}, {status: 413});
  }

  if (appended.status === 'ok' && !appended.complete) {
    return fileIdResponse(caller, appended.offset, ongoingStatus);
  }

  /* Either this part completed the file, or the file was already complete and
   * the caller is asking again because it never saw the answer. Completing is
   * idempotent, so both are served the same way. */
  return completeUpload(caller);
}

/**
 * Validate and complete an upload, answering with the redeem token.
 *
 * Only a rejected file makes the upload worth discarding. Everything else that
 * can go wrong here — the database, the disk — may well succeed on the next
 * attempt, and the whole file has already been transferred by this point, so it
 * is left in place for the caller to complete again rather than thrown away.
 */
async function completeUpload(caller: FileCaller) {
  try {
    const completed = await finalizeSession(caller);

    if (completed.status !== 'ok') {
      return NextResponse.json(
        {error: 'Upload could not be staged'},
        {status: 500},
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
    // file policy violations (mime/refinements) surface as a clean 400
    if (error instanceof z.ZodError) {
      await releaseSessionQuietly(caller);
      return NextResponse.json({error: z.prettifyError(error)}, {status: 400});
    }

    console.error('Stage upload error:', error);
    return NextResponse.json(
      {error: 'Upload could not be staged'},
      {status: 500},
    );
  }
}
