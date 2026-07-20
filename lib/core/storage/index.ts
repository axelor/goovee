import fs from 'fs';

/* Make sure a tenant's storage directory exists. Called once when the tenant
 * connects (see the tenant manager). Storage paths are per-tenant config, so
 * there is no process-wide default. */
export function ensureStorageDir(storagePath: string): void {
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, {recursive: true});
  }
}
