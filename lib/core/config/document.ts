/*
 * What the two readers build between them: the nested document the schema
 * parses, and the source each setting in it came from. The environment is read
 * first and the configuration files after it. Each reader admits a key before
 * writing it — a schema key by lookup, a tenant id by the pattern below — and
 * `setAt` writes what it is given, so that screening is the readers' job.
 */

import {ENV_PREFIX} from './names';

/** A variable or a file entry that could not be placed. */
export type SourceIssue = {name: string; message: string};

/**
 * Whether a recorded source names a file rather than a variable. Every variable
 * carries the prefix and no file name does, which is the whole distinction.
 */
export function isFileSource(source: string): boolean {
  return !source.startsWith(ENV_PREFIX);
}

export type ConfigDocument = {
  /** The nested document, as `configSchema` expects it. */
  document: Record<string, unknown>;
  /**
   * Where each setting came from — a variable's name, or a file's — keyed by
   * the setting's dotted path.
   */
  sources: Map<string, string>;
};

/*
 * A tenant id becomes a property name on the document as it stands, and only
 * lowercase letters and digits are safe to write there unexamined: "__proto__"
 * or "constructor" would reach the prototype rather than a tenant. Both readers
 * refuse an id this does not match before writing it; the schema repeats the
 * rule with the fuller explanation of what an id is for.
 */
export const WRITABLE_TENANT_ID = /^[a-z0-9]+$/;

export function setAt(
  document: Record<string, unknown>,
  keys: string[],
  value: unknown,
) {
  let node = document;

  for (const key of keys.slice(0, -1)) {
    const next = node[key];

    if (typeof next === 'object' && next !== null) {
      node = next as Record<string, unknown>;
    } else {
      const created: Record<string, unknown> = {};
      node[key] = created;
      node = created;
    }
  }

  node[keys[keys.length - 1]] = value;
}
