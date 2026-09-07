/*
 * Reads the configuration out of the portal.config*.json files in the working
 * directory.
 *
 * A file holds the document the schema describes, written as it is: camelCase
 * keys, numbers and booleans as themselves, and the tenants under `tenants`,
 * keyed by id. The files are looked up where the `.env` files are and layered
 * the same way:
 *
 *   portal.config.<mode>.local.json
 *   portal.config.local.json          (skipped in test mode, as .env.local is)
 *   portal.config.<mode>.json
 *   portal.config.json
 *
 * where <mode> is development, production or test after NODE_ENV. The first file
 * to give a setting a value wins, setting by setting rather than file by file,
 * and every file ranks below the environment: a variable — set on the process or
 * read from a .env file — overrides the same setting wherever a file holds it.
 * So a portal.config.json can hold what every deployment shares, and a variable
 * or a .local file what one deployment changes.
 *
 * Every key is checked against the schema as it is read, the way a variable's
 * name is: a key no group declares is refused naming the file and the keys it
 * could have meant, rather than left to a parse that would report the setting it
 * was meant for as missing.
 */

import fs from 'node:fs';
import path from 'node:path';

import type {z} from 'zod';

import {
  type ConfigDocument,
  type SourceIssue,
  setAt,
  WRITABLE_TENANT_ID,
} from './document';
import {configSchema} from './schema';
import {recordValueOf, shapeOf} from './walk';

/** Every configuration file is `portal.config` and a suffix. */
export const CONFIG_FILE_STEM = 'portal.config';

/** The JSON Schema an editor checks a file against. Generated; see scripts. */
export const CONFIG_SCHEMA_FILE = `${CONFIG_FILE_STEM}.schema.json`;

/** The key a file may carry for its editor, naming that JSON Schema. */
const SCHEMA_KEY = '$schema';

export type ConfigMode = 'development' | 'production' | 'test';

/**
 * The mode NODE_ENV selects, read the way @next/env reads it for the .env files:
 * `production` and `test` as themselves, anything else — an unset value
 * included — as development.
 */
export function configMode(): ConfigMode {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'production';
    case 'test':
      return 'test';
    default:
      return 'development';
  }
}

/**
 * The files read for `mode`, in the order they take effect: the first to hold a
 * setting wins.
 */
export function configFileNames(mode: ConfigMode): string[] {
  return [
    `${CONFIG_FILE_STEM}.${mode}.local.json`,
    ...(mode === 'test' ? [] : [`${CONFIG_FILE_STEM}.local.json`]),
    `${CONFIG_FILE_STEM}.${mode}.json`,
    `${CONFIG_FILE_STEM}.json`,
  ];
}

export type ConfigFiles = {
  /** The files that were present, in the order they took effect. */
  files: string[];
  /** The entries that named no setting, and the files that could not be read. */
  issues: SourceIssue[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/* The keys a group declares, for a message naming what a mistyped key could
 * have meant. */
function offeringsOf(shape: Record<string, z.ZodType>): string {
  return Object.keys(shape).sort().join(', ');
}

/*
 * Places what `node` holds at `keys`, walking groups by the schema's keys and
 * the tenants by id. A leaf is written unless a higher-ranking source already
 * gave the setting a value, which is the layering.
 */
function place(
  file: string,
  schema: z.ZodType,
  node: unknown,
  keys: string[],
  into: ConfigDocument,
  issues: SourceIssue[],
) {
  const tenantSchema = recordValueOf(schema);
  const shape = tenantSchema ? null : shapeOf(schema);
  const here = keys.join('.');

  if (!tenantSchema && !shape) {
    if (into.sources.has(here)) return;

    /* Written as the file spells it — a number stays a number, a string a
     * string — and the parse reports a value the setting cannot take against
     * the file that holds it. */
    setAt(into.document, keys, node);
    into.sources.set(here, file);
    return;
  }

  if (!isPlainObject(node)) {
    issues.push({
      name: `${file}: ${here}`,
      message: tenantSchema
        ? 'holds the tenants, one object per tenant id; write an object.'
        : `is a group of settings, not a setting; write an object holding ${offeringsOf(shape!)}.`,
    });
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (keys.length === 0 && key === SCHEMA_KEY) continue;

    if (tenantSchema) {
      if (!WRITABLE_TENANT_ID.test(key)) {
        issues.push({
          name: `${file}: ${here}.${key}`,
          message:
            `names the tenant "${key}", which is not a usable tenant id: ` +
            `lowercase letters and digits only.`,
        });
        continue;
      }

      place(file, tenantSchema, value, [...keys, key], into, issues);
      continue;
    }

    /* Own keys only: a shape is an ordinary object, so "__proto__" or
     * "constructor" would otherwise resolve to an inherited member and pass
     * for a setting. */
    const child = Object.hasOwn(shape!, key) ? shape![key] : undefined;

    if (!child) {
      issues.push({
        name: `${file}: ${here ? `${here}.` : ''}${key}`,
        message: `names no setting. ${here ? `Under ${here}` : 'At the top level'}, one of: ${offeringsOf(shape!)}.`,
      });
      continue;
    }

    place(file, child, value, [...keys, key], into, issues);
  }
}

/**
 * Fills `into` from the configuration files in `dir`, leaving every setting a
 * higher-ranking source already holds as it is. The environment is read before
 * this, so what it set stands.
 */
export function readConfigFiles(
  dir: string,
  mode: ConfigMode,
  into: ConfigDocument,
): ConfigFiles {
  const files: string[] = [];
  const issues: SourceIssue[] = [];

  for (const file of configFileNames(mode)) {
    const filePath = path.join(dir, file);

    /* Absence is the ordinary case for three of the four names. Anything else
     * that keeps the file from being read is a fault of the deployment and is
     * left to surface as itself. */
    if (!fs.existsSync(filePath)) continue;

    files.push(file);

    let parsed: unknown;

    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      issues.push({
        name: file,
        message: `is not valid JSON: ${error instanceof Error ? error.message : String(error)}.`,
      });
      continue;
    }

    if (!isPlainObject(parsed)) {
      issues.push({
        name: file,
        message: `holds ${Array.isArray(parsed) ? 'an array' : `a ${typeof parsed}`} rather than an object of settings.`,
      });
      continue;
    }

    place(file, configSchema, parsed, [], into, issues);
  }

  return {files, issues};
}
