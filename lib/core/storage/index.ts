import fs from 'fs';
import path from 'path';

export function getStoragePath() {
  const storage = process.env.DATA_STORAGE;

  if (!storage) {
    return `${process.cwd()}/storage`;
  }

  if (!fs.existsSync(storage)) {
    fs.mkdirSync(storage, {recursive: true});
  }

  return storage;
}

/**
 * Resolves a path recorded on a file record into an absolute path, and returns
 * `null` unless the result is contained in the storage directory.
 *
 * The recorded path is expected to be relative to the storage root, but nothing
 * guarantees it: the value can reach the database from outside this application
 * and may contain parent-directory segments, or be absolute.
 *
 * The containment check carries the whole guarantee and is not redundant
 * alongside `path.resolve`. `path.resolve` lets an absolute recorded path win
 * outright, so a root of `/var/data/storage` and a recorded `/etc/passwd`
 * resolve to `/etc/passwd`; only the check keeps that value out. Resolving is
 * safe here because the result is verified, and unsafe without it.
 *
 * Comparing against `root + path.sep` rather than `root` alone rejects the
 * escape and also stops a sibling directory such as `/var/data/storage-old`
 * from passing as a prefix of `/var/data/storage`. It rejects `root` itself
 * too, which is a directory and never a file to serve or delete.
 *
 * Containment is lexical: a symlink inside the storage directory pointing out
 * of it is not detected, which keeps this synchronous.
 */
export function resolveStoragePath(
  storage: string,
  recordedPath: string,
): string | null {
  const root = path.resolve(storage);
  const target = path.resolve(root, recordedPath);

  return target.startsWith(root + path.sep) ? target : null;
}
