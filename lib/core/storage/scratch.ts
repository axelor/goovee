import os from 'os';
import path from 'path';

// ---- CORE IMPORTS ---- //
import {getDeploymentConfig} from '@/tenant/config';

/*
 * Where a store that cannot be appended to stages a write in progress.
 *
 * An object store refuses a part below a floor of its own and cannot extend one
 * already stored, so pieces are gathered on local disk until they fill a part.
 * A store that can be appended to needs none of this.
 *
 * Per tenant, so a name recorded in one tenant's database can never resolve
 * into another's staged bytes.
 */

const DEFAULT_SCRATCH_ROOT = path.join(os.tmpdir(), 'portal', 'uploads');

function scratchRoot(): string {
  return getDeploymentConfig().upload?.tempDir ?? DEFAULT_SCRATCH_ROOT;
}

/**
 * The directory this tenant's in-progress writes are staged in.
 *
 * Derived from configuration alone, so the same tenant resolves to the same
 * directory in every process. The store creates it when the tenant connects.
 */
export function storeScratchDir(tenantId: string): string {
  return path.resolve(scratchRoot(), tenantId);
}
