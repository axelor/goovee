/*
 * Puts the PDF reader's runtime files where the application can serve them.
 *
 * The reader fetches these by address when a document turns out to need them —
 * a worker to parse off the main thread, character maps, fonts a document may
 * assume rather than carry, image decoders, a colour profile — so they have to
 * exist as files, and they are served from here so that reading a document
 * never depends on reaching anything outside the installation.
 *
 * They are filed under the reader's version, because the worker must be the
 * same version as the page that starts it and refuses to run otherwise. Under
 * a shared address a browser would keep handing back the copy it already had
 * after an upgrade, leaving every document unreadable.
 */

import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const projectDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicDir = path.join(projectDir, 'public', 'pdfjs');

/*
 * Resolved through `react-pdf` rather than named directly, so the copy taken is
 * always the one it loads, whatever version that has become.
 */
function findReader() {
  const viewer = require.resolve('react-pdf/package.json');
  const manifest = require.resolve('pdfjs-dist/package.json', {
    paths: [path.dirname(viewer)],
  });
  return {dir: path.dirname(manifest), version: require(manifest).version};
}

/* All required. Anything missing is a reader that has moved its files, which
 * has to fail here rather than as a broken document in someone's browser. */
const ITEMS = [
  'build/pdf.worker.min.mjs',
  'cmaps',
  'iccs',
  'standard_fonts',
  'wasm',
];

async function exists(target) {
  return Boolean(await fs.stat(target).catch(() => null));
}

async function main() {
  const reader = findReader();
  const targetDir = path.join(publicDir, reader.version);

  const present = await Promise.all(
    ITEMS.map(item => exists(path.join(targetDir, item))),
  );
  if (present.every(Boolean)) {
    console.log(`pdf reader assets already at ${reader.version}`);
    return;
  }

  /* Everything goes, not just this version: the copies are addressed by
   * version, so one left behind is served forever and never asked for. */
  await fs.rm(publicDir, {recursive: true, force: true});

  /*
   * Copied aside and moved into place once it is complete. A directory exists
   * from the moment it starts being filled, so a run stopped part way through
   * would otherwise leave one that looks finished — and every later run would
   * agree and leave it that way, with a file missing or half written that only
   * shows up as an unreadable document much later.
   */
  const stagingDir = `${targetDir}.partial`;
  await fs.rm(stagingDir, {recursive: true, force: true});
  await fs.mkdir(path.join(stagingDir, 'build'), {recursive: true});

  for (const item of ITEMS) {
    await fs.cp(path.join(reader.dir, item), path.join(stagingDir, item), {
      recursive: true,
    });
  }

  await fs.rename(stagingDir, targetDir);

  console.log(`copied pdf reader assets ${reader.version} to public/pdfjs`);
}

await main();
