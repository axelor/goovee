/*
 * Tunables for served image derivatives. The ladder and output format are fixed
 * constants; the cache location and budget are env-overridable and read at their
 * calling site, so this file never touches process.env.
 */

/**
 * Widths a derivative may be requested at.
 *
 * These are exactly the candidate widths the image component puts in a srcset —
 * the framework's own device and image size lists, merged. Requests are refused
 * for anything else, so the number of derivatives per file is bounded and a
 * caller cannot fill the disk by walking arbitrary widths.
 */
export const IMAGE_WIDTHS = [
  32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840,
] as const;

/**
 * Qualities a derivative may be requested at. One value keeps the cache
 * one-dimensional; it matches the image component's own default allowance, so a
 * caller asking for the default never falls outside the list.
 */
export const IMAGE_QUALITIES = [75] as const;

export const DEFAULT_IMAGE_QUALITY = 75;

/**
 * Output format for every derivative.
 *
 * WebP is served to all browsers the application supports. AVIF compresses
 * better but costs several times the CPU to encode, which is the wrong trade
 * when the encode happens on demand rather than once at publish time.
 */
export const IMAGE_FORMAT = 'webp';
export const IMAGE_MIME = 'image/webp';

/** CPU effort for the encoder, 0 (fastest) to 6. The library's own default. */
export const IMAGE_EFFORT = 4;

/**
 * Refuse to decode an image larger than this many pixels.
 *
 * A modest file can declare enormous dimensions and expand to many gigabytes
 * once decoded. 8192x8192 is far above anything a portal displays and well
 * below the library's own default allowance.
 */
export const MAX_INPUT_PIXELS = 8192 * 8192;

/**
 * How many derivatives may be produced at once.
 *
 * Encoding is CPU-bound and the imaging library runs its own thread pool per
 * operation, so unbounded concurrency oversubscribes the machine as soon as a
 * page of cold thumbnails is opened. Requests past the limit wait rather than
 * fail.
 *
 * Kept well below the runtime's own worker pool, which defaults to four
 * threads. Each encode occupies one of those threads for its whole duration, so
 * matching the two numbers would let a page of cold images take the entire pool
 * and stall every unrelated file read, upload and name lookup in the process.
 * A deployment that raises `UV_THREADPOOL_SIZE` can raise this with it.
 */
export const MAX_CONCURRENT_RESIZES = 2;

/**
 * How many requests may wait for an encoding slot.
 *
 * The queue exists to smooth a burst, not to absorb an unbounded one. Past this
 * the file is served whole instead: a larger response now is better than one
 * that arrives after the reader has given up, and it keeps a flood of cold
 * requests from delaying every other image on the site behind it.
 */
export const MAX_WAITING_RESIZES = 32;

/**
 * Largest file that will be resized.
 *
 * `MAX_INPUT_PIXELS` bounds what is decoded, but only after the header has been
 * read and believed. This is the cruder guard that applies first, and it matters
 * because the portal's upload limits do not: images written by the ERP never
 * pass through them.
 */
export const MAX_SOURCE_BYTES = 40 * 1024 * 1024; // 40 MB

/** Default ceiling for the derivative cache on disk, overridable in bytes. */
export const DEFAULT_CACHE_MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

/**
 * How long one image may spend being encoded.
 *
 * Without a limit a single pathological file occupies one of the few encoding
 * slots indefinitely, and enough of them stop every image on the site from being
 * served. Matches the framework's own allowance.
 */
export const ENCODE_TIMEOUT_SECONDS = 7;

/**
 * Threads the imaging library may use inside a single operation.
 *
 * This is the other half of `MAX_CONCURRENT_RESIZES`: bounding how many images
 * encode at once achieves nothing if each one is free to occupy every core, so
 * the two are set together to cap total CPU use.
 */
export const LIBVIPS_CONCURRENCY = 2;

/**
 * Formats served as they are rather than resized, recognised from the first
 * bytes of the file before anything else reads it.
 *
 * Two reasons a format is here. Some the imaging library cannot decode at all,
 * and letting it discover that costs an open and a thrown error per request.
 * Vector images it can decode, but doing so means handing a document to an XML
 * parser that will follow what the document tells it — and merely asking the
 * library what the file is, is enough to make that happen. So the decision is
 * taken from the raw bytes here, before the file is offered to it.
 *
 * Recognising the file ourselves is also what makes the decision cheap enough to
 * remember: a format the library rejects by throwing leaves nothing to record.
 */
export const BYPASS_SIGNATURES: ReadonlyArray<{
  format: string;
  matches: (head: Buffer) => boolean;
}> = [
  {format: 'bmp', matches: head => head[0] === 0x42 && head[1] === 0x4d},
  {
    format: 'ico',
    matches: head =>
      head[0] === 0x00 &&
      head[1] === 0x00 &&
      (head[2] === 0x01 || head[2] === 0x02),
  },
  {
    format: 'jxl',
    matches: head => head[0] === 0xff && head[1] === 0x0a,
  },
  {
    /* Vector images are text; the root element may follow a byte-order mark,
     * whitespace, an XML declaration, a doctype or comments. */
    format: 'svg',
    matches: head => {
      const text = head.toString('utf8').replace(/^﻿/, '').trimStart();
      return (
        text.startsWith('<?xml') ||
        text.startsWith('<svg') ||
        text.startsWith('<!DOCTYPE svg')
      );
    },
  },
];

/** How many bytes are read to recognise the format. */
export const SIGNATURE_BYTES = 512;

/**
 * Bumped when the meaning of a cache key changes — a different encoder setting,
 * ladder, or naming scheme. Entries written by an older scheme then miss rather
 * than being served under the new rules.
 */
export const CACHE_VERSION = 1;
