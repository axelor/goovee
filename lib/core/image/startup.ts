// ---- LOCAL IMPORTS ---- //
import {probeCache} from './cache';
import {encodeProbe} from './index';

/**
 * Report at startup whether images can actually be resized.
 *
 * Resizing degrades quietly by design: anything that goes wrong serves the whole
 * file instead, which is correct for a single request and invisible across a
 * whole deployment. Every way it can be off looks the same from outside — a
 * missing platform binary left behind by the build, a cache directory that
 * cannot be written, a library that fails to load — and in each case the portal
 * keeps working while sending full-size images to every visitor.
 *
 * So it is stated once, at boot, rather than left to be inferred from bandwidth.
 * The check does the same work a request does: it loads the library and encodes
 * a small image, which is the only thing that proves the native library
 * underneath it is present and usable, and it writes to the cache directory.
 *
 * Failing does not stop the server. Serving whole images is a working portal,
 * just an expensive one, and refusing to start would turn a performance fault
 * into an outage.
 */
export async function checkImageResizing(): Promise<void> {
  try {
    const {width, height, bytes} = await encodeProbe();
    const {entries, bytes: cached} = await probeCache();

    console.log(
      `[IMAGE][STARTUP] resizing available — probe ${width}x${height} encoded to ${bytes} bytes; ` +
        `cache holds ${entries} ${entries === 1 ? 'entry' : 'entries'} (${Math.round(cached / 1024)} KB)`,
    );
  } catch (error) {
    console.error(
      '[IMAGE][STARTUP] resizing is NOT available — every image will be served at full size. ' +
        'Check that the imaging library and its platform binaries survived the build, ' +
        'and that the cache directory is writable.',
      error,
    );
  }
}
