import fs from 'fs';
import path from 'path';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {getSession} from '@/lib/core/auth';
import {writeToStorage} from '@/lib/core/upload/file';
import {getUploadPolicy, stageUpload} from '@/lib/core/upload/staged-upload';

export const runtime = 'nodejs';

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
 * The file arrives as the raw request body, with its name in `X-Upload-Filename`
 * and its type in `Content-Type`, so the body streams straight to disk.
 */
export async function POST(
  request: NextRequest,
  props: {params: Promise<{tenant: string; purpose: string}>},
) {
  const {tenant: tenantId, purpose} = await props.params;

  const session = await getSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  // Guard cross-tenant access: /api/* bypasses the proxy that switches sessions.
  if (session.user.tenantId !== tenantId) {
    return new NextResponse('Forbidden', {status: 403});
  }

  // purpose is in the path, so we know the size limit before reading the body
  const policy = getUploadPolicy(purpose);
  if (!policy) {
    return NextResponse.json({error: 'Unknown upload purpose'}, {status: 404});
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return new NextResponse('Bad request', {status: 400});
  }
  const {client} = tenant;
  const storagePath = tenant.config.aos.storage;

  if (!request.body) {
    return NextResponse.json({error: 'Missing file'}, {status: 400});
  }

  // fast-path: reject when the declared length already exceeds the limit
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > policy.maxBytes) {
    return NextResponse.json({error: 'File too large'}, {status: 413});
  }

  const fileName = decodeFileName(request.headers.get('x-upload-filename'));
  const fileType =
    request.headers.get('content-type') || 'application/octet-stream';

  /*
   * Stream the body to disk, capping at the policy limit (counts actual bytes,
   * independent of any Content-Length header). Done outside any DB transaction
   * so a slow upload never pins a database connection.
   */
  const written = await writeToStorage(request.body, {
    fileName,
    maxBytes: policy.maxBytes,
    storagePath,
  });
  if (written === null) {
    return NextResponse.json({error: 'File too large'}, {status: 413});
  }
  if (written.size === 0) {
    await fs.promises
      .rm(path.resolve(storagePath, written.filePath), {force: true})
      .catch(() => {});
    return NextResponse.json({error: 'Missing file'}, {status: 400});
  }

  // from here the on-disk blob is ours: remove it on any failure below
  try {
    if (policy.file) {
      /*
       * Validate type/content against the policy. `fs.openAsBlob` backs the File
       * with the on-disk blob lazily, so mime/size checks read only metadata and
       * a content `.refine()` reads from disk on demand.
       */
      const blob = await fs.openAsBlob(
        path.resolve(storagePath, written.filePath),
        {type: fileType},
      );
      policy.file.parse(new File([blob], fileName, {type: fileType}));
    }

    // own the transaction so the meta_file row + claim commit atomically
    const staged = await client.$transaction(txClient =>
      stageUpload({
        purpose,
        owner: session.user.id,
        client: txClient,
        fileName,
        filePath: written.filePath,
        fileType,
        size: written.size,
      }),
    );
    return NextResponse.json(staged);
  } catch (error: unknown) {
    await fs.promises
      .rm(path.resolve(storagePath, written.filePath), {force: true})
      .catch(() => {});

    // file policy violations (mime/refinements) surface as a clean 400
    if (error instanceof z.ZodError) {
      return NextResponse.json({error: z.prettifyError(error)}, {status: 400});
    }
    console.error('Stage upload error:', error);
    return NextResponse.json(
      {error: 'Upload could not be staged'},
      {status: 500},
    );
  }
}
