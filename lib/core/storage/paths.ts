import path from 'path';

/*
 * How a tenant's files are placed inside a store, spelled the way AOP spells it
 * so the two applications read and write the same locations.
 *
 * AOP keeps a tenant's files apart by its AOS tenant id: a subdirectory of
 * `data.upload.dir` on the filesystem, a key prefix in a bucket. The default
 * tenant — a dedicated instance, or the id AOP reserves for it — gets neither.
 * `meta_file.filePath` never carries the prefix; the store adds it on every
 * read and write, so a record written by either application resolves in both.
 *
 * Pure: read by the configuration checks as well as by the stores, so nothing
 * here touches the filesystem or the network.
 */

/** The tenant id AOP gives an instance that serves one tenant. */
const DEFAULT_AOS_TENANT_ID = 'default';

function isNamedTenant(tenantId: string | undefined): tenantId is string {
  return !!tenantId && tenantId !== DEFAULT_AOS_TENANT_ID;
}

/** The directory a tenant's files sit in, under the AOS instance's upload dir. */
export function filesystemRoot(
  dir: string,
  tenantId: string | undefined,
): string {
  return path.resolve(isNamedTenant(tenantId) ? path.join(dir, tenantId) : dir);
}

/** What is put in front of every object key of a tenant, `''` for the default. */
export function objectPrefix(tenantId: string | undefined): string {
  return isNamedTenant(tenantId) ? `${tenantId}/` : '';
}

/**
 * Whether a recorded path can name an object at all.
 *
 * A key is joined onto the tenant prefix as it stands, so one opening with a
 * separator, or carrying a segment that means "up" or "here", would name an
 * object outside the tenant's part of the bucket. A recorded value can reach
 * the database from outside this application, so it is checked before use.
 */
export function isObjectKey(key: string): boolean {
  if (!key || key.startsWith('/') || key.includes('\\')) return false;

  return key
    .split('/')
    .every(segment => segment !== '' && segment !== '.' && segment !== '..');
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
