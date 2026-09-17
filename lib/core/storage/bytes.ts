import type fs from 'fs';

/**
 * Write the whole buffer, however many calls it takes.
 *
 * `FileHandle.write` reports how many bytes it wrote and does not loop: on a
 * local filesystem it writes all of them, but on a network mount it may write
 * fewer and resolve successfully. The filesystem store appends into the AOS
 * instance's own upload directory, which is as often a mount shared with that
 * instance as it is a local disk — and a short write there would leave a gap
 * the caller counted as written.
 *
 * @throws when the file accepts no bytes at all, which would otherwise loop
 */
export async function writeAll(
  handle: fs.promises.FileHandle,
  data: Uint8Array,
): Promise<void> {
  let written = 0;

  while (written < data.byteLength) {
    const {bytesWritten} = await handle.write(data.subarray(written));

    if (!bytesWritten) {
      throw new Error(
        `Wrote ${written} of ${data.byteLength} bytes before the file stopped accepting them.`,
      );
    }

    written += bytesWritten;
  }
}
