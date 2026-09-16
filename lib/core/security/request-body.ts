/*
 * NOTE: [Request body limit]
 *
 * A route handler is handed its body as it arrives off the network, so reading
 * a whole body accumulates it in memory and an unbounded read is a request of
 * any size held in the process. Every handler that reads a whole body states
 * the largest one it will hold, and the readers here refuse the rest before
 * reading it.
 *
 * The limit rests on the bytes actually read: they are counted chunk by chunk
 * and the body is refused as soon as the count passes it. The `content-length`
 * header is the sender's own claim, so it only saves work — a body declaring
 * more than the limit is refused before a byte is read, while one declaring
 * less than it sends, or declaring nothing at all, is still refused by the
 * count. Either way the stream is cancelled rather than drained.
 */

/**
 * Raised when a request carries more than the caller agreed to hold.
 *
 * Answer it with 413; the body is not read any further, so nothing of the
 * oversized request is kept.
 */
export class RequestBodyTooLarge extends Error {
  constructor(readonly maxBytes: number) {
    super(`Request body is larger than ${maxBytes} bytes`);
    this.name = 'RequestBodyTooLarge';
  }
}

/**
 * Yields a request body chunk by chunk, refusing one larger than `maxBytes`.
 *
 * See NOTE: [Request body limit].
 */
async function* chunksWithin(
  request: Request,
  maxBytes: number,
): AsyncGenerator<Uint8Array> {
  const declared = Number(request.headers.get('content-length'));

  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new RequestBodyTooLarge(maxBytes);
  }

  if (!request.body) return;

  const reader = request.body.getReader();

  let held = 0;

  try {
    for (;;) {
      const {done, value} = await reader.read();

      if (done) break;
      if (!value) continue;

      held += value.byteLength;

      if (held > maxBytes) {
        throw new RequestBodyTooLarge(maxBytes);
      }

      yield value;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/**
 * Reads a request body as text, refusing one larger than `maxBytes`.
 *
 * For a handler that reads the body itself. One that has to pass the body on
 * should use `readBytesWithin` instead, which does not decode.
 *
 * See NOTE: [Request body limit].
 *
 * @param maxBytes - the largest body to hold, counted in bytes rather than
 *   characters, so a multi-byte character counts as the bytes it occupies
 * @returns the body as text, empty for a request that carries none
 * @throws RequestBodyTooLarge before the whole body has been held
 */
export async function readTextWithin(
  request: Request,
  maxBytes: number,
): Promise<string> {
  const decoder = new TextDecoder();

  let text = '';

  for await (const chunk of chunksWithin(request, maxBytes)) {
    // `stream: true` keeps a character split across two chunks whole.
    text += decoder.decode(chunk, {stream: true});
  }

  return text + decoder.decode();
}

/**
 * Reads a request body as bytes, refusing one larger than `maxBytes`.
 *
 * For a handler that bounds a body in order to hand it on rather than to read
 * it. The bytes are returned exactly as they arrived, so a body that is not
 * text — a file in a multipart form, anything binary — survives being counted:
 * decoding one to a string and encoding it back substitutes a replacement
 * character for every byte that is not valid UTF-8, which changes the content
 * and its length without failing.
 *
 * See NOTE: [Request body limit].
 *
 * @param maxBytes - the largest body to hold
 * @returns the body as it arrived, empty for a request that carries none
 * @throws RequestBodyTooLarge before the whole body has been held
 */
export async function readBytesWithin(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const chunks: Uint8Array[] = [];

  let held = 0;

  for await (const chunk of chunksWithin(request, maxBytes)) {
    chunks.push(chunk);
    held += chunk.byteLength;
  }

  const body = new Uint8Array(held);

  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
}
