import type {Stats} from 'fs';
import fs from 'fs';
import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import type {ReadableOptions} from 'stream';

// ---- CORE IMPORTS ---- //
import {
  isResizable,
  parseImageRequest,
  resolveDerivative,
} from '@/lib/core/image';
import {IMAGE_MIME} from '@/lib/core/image/constants';
import {filterPrivate} from '@/orm/filter';
import {resolveStoragePath} from '@/storage/index';
import type {Client} from '@/goovee/.generated/client';
import type {ID, User} from '@/types';

export async function findFile({
  id,
  meta,
  client,
  storage,
}: {
  id: ID;
  meta?: boolean;
  client: Client;
  storage: string | undefined | null;
}) {
  if (!id) {
    return null;
  }

  if (!storage) return null;

  let record, filePath, fileName, fileType;

  if (meta) {
    record = await client.aOSMetaFile.findOne({
      where: {id},
      select: {
        filePath: true,
        fileName: true,
        fileType: true,
      },
    });

    if (!record?.filePath) {
      return null;
    }

    filePath = resolveStoragePath(storage, record.filePath);

    if (!filePath) {
      console.error(
        `Meta file ${id} records a path outside the storage directory.`,
      );
      return null;
    }

    fileName = record.fileName!;
    fileType = record.fileType!;
  } else {
    record = await client.aOSDMSFile.findOne({
      where: {id},
      select: {
        metaFile: {
          filePath: true,
          fileName: true,
          fileType: true,
        },
      },
    });

    if (!record?.metaFile?.filePath) {
      return null;
    }

    filePath = resolveStoragePath(storage, record.metaFile.filePath);

    if (!filePath) {
      console.error(
        `DMS file ${id} records a path outside the storage directory.`,
      );
      return null;
    }

    fileName = record.metaFile.fileName!;
    fileType = record.metaFile.fileType!;
  }

  return {
    record,
    fileName,
    filePath,
    fileType,
  };
}

export async function findLatestDMSFileByName({
  client,
  storage,
  user,
  relatedId,
  relatedModel,
  name,
  skipUserCheck,
}: {
  client: Client;
  storage: string | undefined | null;
  relatedId: any;
  relatedModel: string;
  user?: User;
  name: string;
  skipUserCheck?: boolean;
}) {
  if (!skipUserCheck && !user) {
    return null;
  }

  if (!storage) return null;

  try {
    const record = await client.aOSDMSFile.findOne({
      where: {
        isDirectory: false,
        relatedId,
        relatedModel,
        parent: {relatedModel},
        fileName: {like: `%${name}%`},
        ...(skipUserCheck ? {} : filterPrivate({user})),
      },
      select: {
        metaFile: {
          filePath: true,
          fileName: true,
          fileType: true,
        },
      },
      orderBy: {
        updatedOn: 'DESC',
      } as any,
    });

    if (!record?.metaFile?.filePath) return null;

    const filePath = resolveStoragePath(storage, record.metaFile.filePath);

    if (!filePath) {
      console.error(
        `DMS file ${record.id} records a path outside the storage directory.`,
      );
      return null;
    }

    const fileName = record.metaFile.fileName!;
    const fileType = record.metaFile.fileType!;

    return {
      record,
      filePath,
      fileName,
      fileType,
    };
  } catch (error) {
    console.error('Error while getting DMS file:', error);
    return null;
  }
}

export function createStream(
  path: string,
  options?: ReadableOptions,
): ReadableStream<Uint8Array> {
  const downloadStream = fs.createReadStream(path, options);

  return new ReadableStream({
    start(controller) {
      downloadStream.on('data', (chunk: Buffer) =>
        controller.enqueue(new Uint8Array(chunk)),
      );
      downloadStream.on('end', () => controller.close());
      downloadStream.on('error', (error: NodeJS.ErrnoException) =>
        controller.error(error),
      );
    },
    cancel() {
      downloadStream.destroy();
    },
  });
}

/**
 * Whether the tag we would return is one the requester already holds.
 *
 * `If-None-Match` carries a list, may name any tag, and may be weakened along
 * the way by anything the response passes through — a comparison against the
 * whole header would miss all three and send the image again every time.
 */
function matchesEtag(header: string | null, tag: string): boolean {
  if (!header) return false;
  if (header.trim() === '*') return true;

  return header
    .split(',')
    .map(candidate => candidate.trim().replace(/^W\//, ''))
    .includes(tag);
}

/**
 * Serve a file, resized when the caller asked for a display size.
 *
 * Passing `request` lets an image be returned at the size it will be drawn at
 * instead of whole. It is the calling route that decides who may see the file,
 * and it has done so before reaching here, on this request — the resized copies
 * are shared between viewers, so the check can never be carried over from an
 * earlier one.
 *
 * A resized image is marked private and revalidated on every request. A viewer
 * that already holds it is answered with "not modified" and transfers nothing,
 * having still passed through the caller's access check to get that answer.
 */
export async function streamFile({
  fileName,
  filePath,
  fileType,
  request,
}: {
  fileName: string;
  filePath: string;
  fileType: string;
  request: NextRequest;
}) {
  if (!(fileName && filePath && fileType)) {
    return new NextResponse('Bad request', {status: 400});
  }

  const size = isResizable(fileType)
    ? parseImageRequest(request.nextUrl)
    : ({kind: 'none'} as const);

  /* A size we do not serve is refused rather than answered with the whole file,
   * so a mistaken address shows up as a mistake instead of as unexplained
   * traffic. */
  if (size.kind === 'invalid') {
    return new NextResponse('Unsupported size', {status: 400});
  }

  if (size.kind === 'size') {
    try {
      /* Null means the file is one to serve untouched — an animation, or a
       * format we do not render. It falls through to the original below. */
      const derivative = await resolveDerivative({filePath, ...size});

      if (derivative) {
        const tag = `"${derivative.etag}"`;

        /* Answered before the image is read or produced: the tag comes from the
         * file's identity, so a viewer who already holds it costs nothing but
         * the access check they have just passed. */
        if (
          derivative.held &&
          matchesEtag(request.headers.get('if-none-match'), tag)
        ) {
          return new NextResponse(null, {
            status: 304,
            headers: new Headers({
              etag: tag,
              'cache-control': 'private, no-cache',
            }),
          });
        }

        const buffer = await derivative.read();

        if (buffer) {
          /* A view over the same memory rather than a copy — the body would
           * otherwise hold a second full-size copy of every image in flight. */
          const body = new Uint8Array(
            buffer.buffer as ArrayBuffer,
            buffer.byteOffset,
            buffer.byteLength,
          );

          return new NextResponse(body, {
            status: 200,
            headers: new Headers({
              'content-type': IMAGE_MIME,
              'content-length': String(buffer.byteLength),
              'content-disposition': 'inline',
              'cache-control': 'private, no-cache',
              etag: tag,
            }),
          });
        }
      }
    } catch (error) {
      console.error('[IMAGE] failed to resize, serving the original:', error);
    }
  }

  /* Whether the file is being shown on a page rather than downloaded. An image
   * that could not be resized is still an image on a page, so it is served for
   * display and given something to revalidate against — otherwise it would be
   * transferred again in full on every visit. */
  const displaying = size.kind === 'size';

  try {
    const stats: Stats = await fs.promises.stat(filePath);
    const tag = `"src-${stats.size}-${stats.mtimeMs}"`;

    if (displaying && matchesEtag(request.headers.get('if-none-match'), tag)) {
      return new NextResponse(null, {
        status: 304,
        headers: new Headers({etag: tag, 'cache-control': 'private, no-cache'}),
      });
    }

    const headers = new Headers({
      'content-disposition': displaying
        ? 'inline'
        : `attachment; filename=${fileName}`,
      'content-type': fileType,
      'content-length': stats.size + '',
      'access-control-expose-headers': 'Content-Disposition',
    });

    if (displaying) {
      headers.set('cache-control', 'private, no-cache');
      headers.set('etag', tag);
    }

    const data: ReadableStream<Uint8Array> = createStream(filePath);

    return new NextResponse(data, {status: 200, headers});
  } catch (err) {
    return new NextResponse('Error downloading file', {status: 500});
  }
}
