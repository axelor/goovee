import type {TenantConfig} from '@/config/schema';

import {FileSystemStore} from './filesystem';
import type {FileStore} from './store';

export {resolveStoragePath} from './paths';
export {
  MetaFileStoreType,
  StoreKeyError,
  StoreStateError,
  type ByteRange,
  type FileStore,
  type ReadOptions,
  type ResumableWrite,
  type WriteState,
  type StoredFile,
  type WriteOptions,
} from './store';

/**
 * The store a tenant's files live in, built from its AOS storage settings and
 * made ready when the tenant connects.
 *
 * The configured directory already names this tenant's own root: a tenant on a
 * shared AOS instance has its `aos.tenantId` segment joined on as the
 * configuration is read, so the store is handed the root as it stands.
 */
export function createStore(aos: TenantConfig['aos']): FileStore {
  return new FileSystemStore({dir: aos.storage, tenantId: undefined});
}
