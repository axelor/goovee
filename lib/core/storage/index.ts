import type {TenantConfig} from '@/config/schema';

import {FileSystemStore} from './filesystem';
import {S3Store} from './s3';
import {storeScratchDir} from './scratch';
import type {FileStore} from './store';

export {resolveStoragePath} from './paths';
export {storeScratchDir} from './scratch';
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

type StorageConfig = TenantConfig['aos']['storage'];
export type StorageProvider = StorageConfig['provider'];

type StorageConfigFor<P extends StorageProvider> = Extract<
  StorageConfig,
  {provider: P}
>;

/*
 * One entry per provider the configuration admits. Adding a kind of storage is
 * a value in the schema's `provider` enum, a group of settings beside it, an
 * implementation of `FileStore`, and a line here — the type refuses a provider
 * the schema names and this does not build.
 */
const PROVIDERS: {
  [P in StorageProvider]: (
    storage: StorageConfigFor<P>,
    where: {aosTenantId: string | undefined; scratchDir: string},
  ) => FileStore;
} = {
  filesystem: (storage, {aosTenantId}) =>
    new FileSystemStore({dir: storage.filesystem.dir, tenantId: aosTenantId}),
  s3: (storage, {aosTenantId, scratchDir}) =>
    new S3Store({config: storage.s3, aosTenantId, scratchDir}),
};

/**
 * The store a tenant's files live in, built from its AOS settings: the provider
 * and its settings say where, and the AOS tenant id says which part of it is
 * this tenant's. Built once per tenant, when it connects.
 *
 * `tenantId` is the portal's own id for the tenant, which names the scratch
 * directory a store that cannot be appended to stages a write in. It is not the
 * AOS tenant id: one names a directory this deployment owns, the other a prefix
 * shared with the AOS instance, and a deployment can have the second unset.
 */
export function createStore(
  aos: TenantConfig['aos'],
  tenantId: string,
): FileStore {
  /* The record pairs each provider with the configuration shape it takes, but
   * indexing it by a value the union does not narrow loses that pairing; the
   * schema's own check has already guaranteed it. */
  const build = PROVIDERS[aos.storage.provider] as (
    storage: StorageConfig,
    where: {aosTenantId: string | undefined; scratchDir: string},
  ) => FileStore;

  return build(aos.storage, {
    aosTenantId: aos.tenantId,
    scratchDir: storeScratchDir(tenantId),
  });
}
