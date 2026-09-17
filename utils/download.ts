import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import type {Readable} from 'stream';

// ---- CORE IMPORTS ---- //
import {isResizable, parseImageRequest, resolveDerivative} from '@/image';
import {IMAGE_MIME} from '@/image/constants';
import {filterPrivate} from '@/orm/filter';
import type {ByteRange, FileStore} from '@/storage/index';
import type {Client} from '@/goovee/.generated/client';
import type {ID, User} from '@/types';

export type {ByteRange} from '@/storage/index';

export async function findFile({
  id,
  meta,
  client,
  store,
}: {
  id: ID;
  meta?: boolean;
  client: Client;
  store: FileStore;
}) {
  if (!id) {
    return null;
  }

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

    if (!store.accepts(record.filePath)) {
      console.error(`Meta file ${id} records a path outside the file store.`);
      return null;
    }

    filePath = record.filePath;
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

    if (!store.accepts(record.metaFile.filePath)) {
      console.error(`DMS file ${id} records a path outside the file store.`);
      return null;
    }

    filePath = record.metaFile.filePath;
    fileName = record.metaFile.fileName!;
    fileType = record.metaFile.fileType!;
  }

  return {
    record,
    fileName,
    filePath,
    fileType,
    store,
  };
}

export async function findLatestDMSFileByName({
  client,
  store,
  user,
  relatedId,
  relatedModel,
  name,
  skipUserCheck,
}: {
  client: Client;
  store: FileStore;
  relatedId: any;
  relatedModel: string;
  user?: User;
  name: string;
  skipUserCheck?: boolean;
}) {
  if (!skipUserCheck && !user) {
    return null;
  }

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

    if (!store.accepts(record.metaFile.filePath)) {
      console.error(
        `DMS file ${record.id} records a path outside the file store.`,
      );
      return null;
    }

    const filePath = record.metaFile.filePath;
    const fileName = record.metaFile.fileName!;
    const fileType = record.metaFile.fileType!;

    return {
      record,
      filePath,
      fileName,
      fileType,
      store,
    };
  } catch (error) {
    console.error('Error while getting DMS file:', error);
    return null;
  }
}

/**
 * Read a file, or a stretch of one, from its store as a stream the response can
 * hold.
 *
 * Reading is paused as soon as the response has taken as much as it wants and
 * resumed when it asks for more. Without that the file is read as fast as the
 * store delivers it and the whole of it accumulates in memory, which for a
 * download of any size costs the server the very thing streaming exists to
 * avoid.
 *
 * The file is also closed if the request it was opened for goes away. A
 * response whose client has already left is dropped without ever being read,
 * so nothing else would close it.
 *
 * `onWholeFileRead` is called once the last byte has been read out of the file,
 * and not at all if the read fails, is cancelled, or the request goes away
 * first. It says the server read the file, not that the client received it.
 */
export function createStream(
  open: () => Promise<Readable>,
  {
    signal,
    onWholeFileRead,
  }: {
    signal: AbortSignal;
    onWholeFileRead?: () => void;
  },
): ReadableStream<Uint8Array> {
  let downloadStream: Readable | null = null;

  /* Given a reason rather than closed quietly. A file closed without one
   * reports nothing, leaving the stream around it neither finished nor failed,
   * so anything still holding it would wait on it forever. */
  const close = () => {
    downloadStream?.destroy(new Error('The request for this file went away.'));
  };

  return new ReadableStream({
    async start(controller) {
      /* Already gone before the file was even opened: checking access and
       * looking the record up takes long enough for a client to give up in the
       * meantime. */
      if (signal.aborted) {
        controller.error(new Error('The request for this file went away.'));
        return;
      }

      downloadStream = await open();

      if (signal.aborted) close();
      else signal.addEventListener('abort', close, {once: true});

      downloadStream.on('data', (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
        if ((controller.desiredSize ?? 1) <= 0) downloadStream?.pause();
      });
      downloadStream.on('end', () => {
        onWholeFileRead?.();
        controller.close();
      });
      downloadStream.on('error', (error: Error) => controller.error(error));
    },
    pull() {
      downloadStream?.resume();
    },
    cancel: close,
  });
}

/**
 * The stretch of a file a `Range` header asked for, as offsets that both
 * include their end.
 *
 * `null` means serve the whole file: no range was asked for, or one was asked
 * for in a form we do not answer piecemeal. A request for several stretches at
 * once is one of those — answering it means a multipart body, and nothing that
 * reads documents here asks for more than one stretch at a time.
 *
 * `unsatisfiable` is a range that is well formed but lies outside the file, and
 * is refused rather than rounded into one that fits, so a client that has lost
 * track of the file's length is told so instead of being handed the wrong
 * bytes.
 */
type RangeRequest = ByteRange | null | 'unsatisfiable';

export function parseRange(header: string | null, size: number): RangeRequest {
  if (!header) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, from, to] = match;

  /* `bytes=-` names nothing at either end and is not a range at all. */
  if (from === '' && to === '') return null;

  /*
   * An empty file has no byte that can be named, so strictly every range
   * misses it. It is answered with the whole of it — which is nothing — rather
   * than refused, because a refusal is what the client sees: a video element
   * asks for a range before it asks for anything else, and so does the preview
   * of a text file here, and neither should report an empty file as an error.
   */
  if (size === 0) return null;

  /* `-500` counts back from the end rather than forward from the start. */
  if (from === '') {
    const length = Number(to);
    if (length === 0) return 'unsatisfiable';
    return {start: Math.max(0, size - length), end: size - 1};
  }

  const start = Number(from);
  if (start >= size) return 'unsatisfiable';

  /* A range running past the end is answered with what there is, which is what
   * a client asking for a fixed-size chunk of a shorter tail expects. */
  const end = to === '' ? size - 1 : Math.min(Number(to), size - 1);
  if (end < start) return 'unsatisfiable';

  return {start, end};
}

/**
 * Name a file in a way that survives the characters it contains.
 *
 * The plain form carries only ASCII and is quoted, so a space or a comma no
 * longer ends the name early; the starred form carries the name as it really
 * is, for anything that understands it. Both are sent because either one alone
 * loses a client.
 */
export function contentDisposition(
  kind: 'inline' | 'attachment',
  fileName: string,
): string {
  /* Directory separators are dropped rather than replaced: they are not part of
   * a file's name, and a browser saving the file would read them as a path. */
  const name = fileName.replace(/[\\/]/g, '').trim() || 'download';

  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');

  /* Percent-encode everything the header grammar does not allow unencoded.
   * `encodeURIComponent` leaves a handful of those behind. */
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
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
 * The body to answer with, or nothing when the request asked only about the
 * file rather than for it.
 *
 * A request for the headers alone runs everything below and is then sent
 * without its body, so the file is opened for a body nobody reads.
 */
function bodyFor(
  request: NextRequest,
  open: (signal: AbortSignal) => ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> | null {
  return request.method === 'HEAD' ? null : open(request.signal);
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
 * Everything served from here is marked private and revalidated on every
 * request. A client that already holds the file is answered with "not
 * modified" and transfers nothing, having still passed through the caller's
 * access check to get that answer.
 *
 * A file served whole may also be asked for a part at a time, which is what
 * lets a document be shown from its beginning while the rest is still on its
 * way, and lets an interrupted transfer resume. A resized image is not: it is
 * small, already held, and sent in one piece.
 *
 * `onWholeFileRead` is called only for the answer that hands over the whole
 * file, so never for a revalidation, a range, a request for the headers alone,
 * a resized image, or an error. It reports success only, and says the server
 * read the file, not that the client received it.
 */
export async function streamFile({
  fileName,
  filePath,
  fileType,
  store,
  request,
  onWholeFileRead,
}: {
  fileName: string;
  /** The key the file is stored under — `meta_file.filePath` as recorded. */
  filePath: string;
  fileType: string;
  store: FileStore;
  request: NextRequest;
  onWholeFileRead?: () => void;
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
      const derivative = await resolveDerivative({
        store,
        key: filePath,
        ...size,
      });

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

        /* Asked about rather than asked for. The tag is already known, and
         * producing the image only to throw it away would mean a full encode
         * per request for a body nobody reads. */
        if (request.method === 'HEAD') {
          return new NextResponse(null, {
            status: 200,
            headers: new Headers({
              'content-type': IMAGE_MIME,
              'content-disposition': 'inline',
              'cache-control': 'private, no-cache',
              etag: tag,
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

  try {
    const stored = await store.stat(filePath);

    if (!stored) {
      return new NextResponse('File not found', {status: 404});
    }

    /*
     * What identifies these bytes, for both "still the same?" and "send me the
     * rest of it": whatever the store says changes when the bytes do, so a file
     * replaced by another of the same length is told apart from the one it
     * replaced, and neither answering "unchanged" nor joining the two halves
     * together goes wrong.
     */
    const tag = `"src-${stored.tag}"`;

    const headers = new Headers({
      /*
       * Offered as a download rather than shown, which decides only what
       * happens when the address is opened on its own — a page embedding the
       * file as an image, a video or a document is unaffected either way.
       *
       * These are the bytes as they were uploaded, and the type recorded
       * against them is whatever the uploader declared. Some picture formats
       * are documents the browser will run if it is shown one directly, so
       * anything served untouched is served as a file to save. Only the
       * pictures we re-encode ourselves, above, are shown in place.
       */
      'content-disposition': contentDisposition('attachment', fileName),
      'content-type': fileType,
      /* Naming the file's length and saying parts of it may be asked for is
       * what lets a client show the beginning of a document while the rest is
       * still arriving, and lets an interrupted transfer pick up where it
       * stopped instead of starting again. */
      'accept-ranges': 'bytes',
      'cache-control': 'private, no-cache',
      etag: tag,
      'access-control-expose-headers':
        'Content-Disposition, Content-Range, Accept-Ranges',
    });

    /* Holding the current copy is answered before anything is read, whether the
     * file is being shown or downloaded. */
    if (matchesEtag(request.headers.get('if-none-match'), tag)) {
      return new NextResponse(null, {status: 304, headers});
    }

    /*
     * `If-Range` asks for a part only while the file is still exactly the one
     * the client started from. Once it has changed, the parts already held no
     * longer join up with new ones, so the whole file is sent instead.
     *
     * Compared exactly, unlike `If-None-Match` above. That comparison forgives
     * a tag that has been marked as only equivalent rather than identical,
     * which is right when the question is whether the client can reuse what it
     * has, and wrong here, where the answer decides whether bytes from one
     * version are spliced into another. A date is accepted in this header too;
     * nothing here offers one, so a header carrying one matches nothing and
     * the whole file is sent, which is the safe answer.
     */
    const ifRange = request.headers.get('if-range');
    const range =
      ifRange === null || ifRange.trim() === tag
        ? parseRange(request.headers.get('range'), stored.size)
        : null;

    if (range === 'unsatisfiable') {
      headers.set('content-range', `bytes */${stored.size}`);
      return new NextResponse(null, {status: 416, headers});
    }

    if (range) {
      headers.set('content-length', String(range.end - range.start + 1));
      headers.set(
        'content-range',
        `bytes ${range.start}-${range.end}/${stored.size}`,
      );
      return new NextResponse(
        bodyFor(request, signal =>
          createStream(() => store.read(filePath, {range}), {signal}),
        ),
        {
          status: 206,
          headers,
        },
      );
    }

    headers.set('content-length', String(stored.size));

    return new NextResponse(
      bodyFor(request, signal =>
        createStream(() => store.read(filePath), {signal, onWholeFileRead}),
      ),
      {
        status: 200,
        headers,
      },
    );
  } catch (err) {
    console.error(`Could not serve the file ${filePath}:`, err);
    return new NextResponse('Error downloading file', {status: 500});
  }
}
