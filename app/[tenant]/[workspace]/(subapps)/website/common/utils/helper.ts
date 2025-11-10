import {SUBAPP_CODES} from '@/constants';
import type {MountType, TemplateProps} from '../types';
import {MOUNT_TYPE} from '../constants';
import {camelCase} from 'lodash-es';
import {
  TemplateSchema,
  Model,
  MetaSelection,
  ImageType,
} from '../types/templates';

type FileURLProps = {
  websiteSlug: string;
  websitePageSlug?: string;
  path: string;
  workspaceURI: string;
  contentId?: string | number;
  mountType: MountType;
};

export function getMetaFileURL(
  props: FileURLProps & {metaFile: {id: string | number} | undefined},
) {
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

export function getPaddingBottom(image?: ImageType): string {
  if (!image || !image.width || !image.height || image.width === 0) {
    return '0%';
  }
  return `${(image.height / image.width) * 100}%`;
}

export function getImage(
  props: FileURLProps & {
    image:
      | {
          id: string;
          version: number;
          attrs: {
            alt: string;
            height: number;
            width: number;
            image: {
              id: string;
              version: number;
              fileName?: string;
              filePath?: string;
              fileType?: string;
            };
          };
        }
      | undefined;
  },
): ImageType {
  const {image: imageObj, path, ...rest} = props;
  if (!imageObj?.attrs) {
    return {url: '', alt: '', width: 0, height: 0, metaFile: null};
  }
  const {image, alt, width, height} = imageObj.attrs;
  const url = getMetaFileURL({
    ...rest,
    metaFile: image,
    path: `${path}.attrs.image`,
  });
  return {url, alt, width, height, metaFile: image};
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

export function chunkArray<T>(array: T[], size: number): T[][] {
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

export function formatComponentCode(name: string) {
  return camelCase(name);
}

export function getTemplateId(props: TemplateProps): string {
  const {contentId, mountType, lineId, code} = props;
  return [code, lineId, contentId, mountType].filter(Boolean).join('-');
}

export function collectModels(
  schema: TemplateSchema | Model,
  models: Model[] = [],
): Model[] {
  if (schema.models?.length) {
    for (const model of schema.models) {
      models.push(model);
      collectModels(model, models);
    }
  }
  return models;
}

export function collectSelections(
  schema: TemplateSchema | Model,
  selections: MetaSelection[] = [],
): MetaSelection[] {
  if (schema.selections?.length) {
    for (const selection of schema.selections) {
      selections.push(selection);
    }
  }

  if (schema.models?.length) {
    for (const model of schema.models) {
      collectSelections(model, selections);
    }
  }
  return selections;
}

export function collectUniqueModels(
  schema: TemplateSchema | Model,
  models = new Map<string, Model>(),
): Map<string, Model> {
  if (schema.models?.length) {
    for (const model of schema.models) {
      models.set(model.name, model);
      collectUniqueModels(model, models);
    }
  }
  return models;
}

export function collectUniqueSelections(
  schema: TemplateSchema | Model,
  selections = new Map<string, MetaSelection>(),
): Map<string, MetaSelection> {
  if (schema.selections?.length) {
    for (const selection of schema.selections) {
      selections.set(selection.name, selection);
    }
  }
  if (schema.models?.length) {
    for (const model of schema.models) {
      collectUniqueSelections(model, selections);
    }
  }
  return selections;
}
