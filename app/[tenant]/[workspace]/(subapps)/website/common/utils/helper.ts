import {SUBAPP_CODES} from '@/constants';
import type {MountType} from '../types';
import {MOUNT_TYPE} from '../constants';
import {camelCase} from 'lodash-es';

export function getMetaFileURL(props: {
  metaFile: {id: string | number} | undefined;
  websiteSlug: string;
  websitePageSlug?: string;
  path: string;
  workspaceURI: string;
  contentId?: string | number;
  mountType: MountType;
}) {
  const {workspaceURI, metaFile} = props;
  if (!metaFile?.id || !props.contentId) return '';

  const contentId = encodeURIComponent(props.contentId);
  const path = encodeURIComponent(props.path);
  const websiteSlug = encodeURIComponent(props.websiteSlug);
  const websitePageSlug = encodeURIComponent(
    props.mountType === MOUNT_TYPE.PAGE
      ? props.websitePageSlug!
      : props.mountType,
  );
  const mountType = encodeURIComponent(props.mountType);

  return `${workspaceURI}/${SUBAPP_CODES.website}/api/templates/${mountType}/${websiteSlug}/${websitePageSlug}/${contentId}/${path}/${metaFile.id}`;
}

const BATCH_SIZE = 10;

export async function processBatch<T, R>(
  data: T[],
  action: (data: NoInfer<T>) => Promise<R>,
  batchSize: number = BATCH_SIZE,
): Promise<PromiseSettledResult<R>[]> {
  const chunks = chunkArray(data, batchSize);

  const results: PromiseSettledResult<R>[] = [];
  for (const chunk of chunks) {
    const result = await Promise.allSettled(chunk.map(data => action(data)));
    results.push(...result);
  }
  return results;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export class Cache<T = any> {
  private store = new Map<string, T>();

  set(key: string, value: T): void {
    this.store.set(key, value);
  }

  get(key: string): T | undefined {
    return this.store.get(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  values(): T[] {
    return Array.from(this.store.values());
  }

  entries(): [string, T][] {
    return Array.from(this.store.entries());
  }
}

export function formatCustomFieldName(name: string, prefix?: string) {
  prefix = prefix || '';
  return camelCase(`${prefix} ${name}`);
}
