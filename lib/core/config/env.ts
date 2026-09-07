/*
 * Reads the configuration out of the process environment.
 *
 * Every variable starting with `PORTAL_` names one setting, and the name spells
 * the setting's path: `PORTAL_ORIGIN` is the deployment's origin,
 * `PORTAL_TENANT_ACME_OAUTH_GOOGLE_CLIENT_ID` is the Google client id of the
 * tenant `acme`. This module turns those variables back into the nested document
 * the schema describes, so the schema stays written in the application's own
 * camelCase and the environment is the only place the uppercase spelling exists.
 *
 * Resolution is against the schema rather than by a fixed rule, because the
 * uppercase name has lost the case that told `clientId` apart from `client.id`:
 * a name is split on underscores, and the tokens are matched against the keys of
 * each group in turn, joining as many as it takes to spell one. That is what
 * lets every variable be typed with underscores alone — no hyphens, no case —
 * and still land on the right key. The schema is checked once, as it is first
 * read, for two keys that would spell the same way, so the match is never
 * ambiguous.
 *
 * A variable that names nothing is a fault, not noise: the prefix says it was
 * meant for this, so a misspelling is reported against the name and the keys
 * it could have meant rather than ignored while the setting it was for stays
 * unset.
 *
 * The environment is the first source read; the configuration files (./files)
 * come after it and fill only what no variable set.
 */

import type {z} from 'zod';

import {
  type ConfigDocument,
  type SourceIssue,
  setAt,
  WRITABLE_TENANT_ID,
} from './document';
import {ENV_PREFIX, TENANTS_KEY, envNameFor} from './names';
import {configSchema, tenantConfigSchema} from './schema';
import {coerceLeaf, leafKind, recordValueOf, shapeOf} from './walk';

export type EnvironmentDocument = ConfigDocument & {
  /** The variables that named no setting. */
  issues: SourceIssue[];
  /** How many configuration variables the environment carried. */
  count: number;
};

/* What one variable resolved to: the keys under the group it was resolved
 * against, and the leaf schema at the end of them. */
type Resolution = {keys: string[]; leaf: z.ZodType};

/* The keys and schemas a group holds, spelled the way the environment spells
 * them, so a run of tokens can be compared without allocating per key. */
type Group = {
  shape: Record<string, z.ZodType>;
  spellings: Map<string, string>; // canonical spelling -> key
};

const groups = new WeakMap<z.ZodType, Group>();

/* A key as the environment spells it, with the separators gone: `clientId` and
 * the tokens `CLIENT`, `ID` both give `clientid`. */
function canonical(value: string): string {
  return value.replace(/_/g, '').toLowerCase();
}

function groupOf(schema: z.ZodType): Group | null {
  const known = groups.get(schema);
  if (known) return known;

  const shape = shapeOf(schema);
  if (!shape) return null;

  const spellings = new Map<string, string>();

  for (const key of Object.keys(shape)) {
    const spelling = canonical(key);
    const other = spellings.get(spelling);

    /* Two keys one variable name could mean. The schema is ours, so this is a
     * fault in it rather than in a deployment, and it is raised the first time
     * the group is read rather than left to resolve by whichever key comes
     * first. */
    if (other) {
      throw new Error(
        `Configuration schema: keys "${other}" and "${key}" are spelled the ` +
          `same way in the environment (${spelling.toUpperCase()}), so a ` +
          `variable naming one could mean either. Rename one of them.`,
      );
    }

    spellings.set(spelling, key);
  }

  const group = {shape, spellings};
  groups.set(schema, group);

  return group;
}

/*
 * Every way the tokens can spell a path through the group.
 *
 * At each step the next one, two, three… tokens are joined and looked up as a
 * key; a match on a leaf that consumes every token is a resolution, and a match
 * on a group with tokens to spare recurses. More than one resolution means two
 * different key paths spell the same variable, which the per-group check above
 * cannot see because the collision spans levels — `web.push.key` beside
 * `webPush.key`, say. Every resolution is collected so that case is reported as
 * ambiguous rather than settled by search order.
 */
function resolveIn(
  schema: z.ZodType,
  tokens: string[],
  prefix: string[],
): Resolution[] {
  const group = groupOf(schema);
  if (!group) return [];

  const found: Resolution[] = [];

  for (let take = 1; take <= tokens.length; take += 1) {
    const key = group.spellings.get(canonical(tokens.slice(0, take).join('')));
    if (!key) continue;

    const child = group.shape[key];
    const rest = tokens.slice(take);
    const keys = [...prefix, key];

    if (rest.length === 0) {
      if (leafKind(child)) found.push({keys, leaf: child});
    } else {
      found.push(...resolveIn(child, rest, keys));
    }
  }

  return found;
}

/* The keys a group offers, spelled for the environment, for a message naming
 * what a mistyped variable could have meant. */
function offeringsOf(schema: z.ZodType, path: string[]): string {
  const group = groupOf(schema);
  if (!group) return '';

  const names = Object.keys(group.shape)
    .map(key => envNameFor([...path, key]))
    .sort();

  return names.join(', ');
}

/* The deepest group the tokens reach before they stop matching, for the same
 * message: the offerings of the root are rarely what was meant, the offerings of
 * `PORTAL_TENANT_ACME_OAUTH_GOOGLE_` usually are. */
function deepestReached(
  schema: z.ZodType,
  tokens: string[],
  path: string[],
): {schema: z.ZodType; path: string[]} {
  const group = groupOf(schema);
  if (!group) return {schema, path};

  for (let take = 1; take <= tokens.length; take += 1) {
    const key = group.spellings.get(canonical(tokens.slice(0, take).join('')));
    if (!key) continue;

    const child = group.shape[key];
    if (shapeOf(child)) {
      return deepestReached(child, tokens.slice(take), [...path, key]);
    }
  }

  return {schema, path};
}

const TENANT_TOKEN = 'TENANT';

/**
 * Assembles the configuration document from the variables `env` carries.
 *
 * Nothing is validated here beyond placing each variable: values are coerced to
 * the type the leaf declares where the spelling allows it and left as strings
 * otherwise, so the parse that follows reports every fault against the variable
 * at once, the way it reports a missing one.
 */
export function readEnvironmentDocument(
  env: Readonly<Record<string, string | undefined>>,
): EnvironmentDocument {
  const document: Record<string, unknown> = {[TENANTS_KEY]: {}};
  const sources = new Map<string, string>();
  const issues: SourceIssue[] = [];
  let count = 0;

  const tenantSchema = recordValueOf(configSchema.shape[TENANTS_KEY]);

  /* The record's value is the tenant schema by construction; read back rather
   * than imported so a change to how tenants are keyed lands here too. */
  const tenantShape = tenantSchema ?? tenantConfigSchema;

  for (const [variable, value] of Object.entries(env)) {
    if (!variable.startsWith(ENV_PREFIX) || value === undefined) continue;

    count += 1;

    const tokens = variable.slice(ENV_PREFIX.length).split('_');

    if (tokens.some(token => token === '')) {
      issues.push({
        name: variable,
        message:
          'holds a doubled or trailing underscore, which spells no setting.',
      });
      continue;
    }

    let schema: z.ZodType = configSchema;
    let path: string[] = [];
    let remaining = tokens;

    if (tokens[0] === TENANT_TOKEN) {
      const id = tokens[1]?.toLowerCase();

      if (!id || tokens.length < 3) {
        issues.push({
          name: variable,
          message:
            `names a tenant but no setting of it: a tenant's variables are ` +
            `${envNameFor([TENANTS_KEY, '<id>'])}_<SETTING>. ` +
            `Settings: ${offeringsOf(tenantShape, [TENANTS_KEY, '<id>'])}.`,
        });
        continue;
      }

      if (!WRITABLE_TENANT_ID.test(id)) {
        issues.push({
          name: variable,
          message:
            `names the tenant "${id}", which is not a usable tenant id: ` +
            `lowercase letters and digits only.`,
        });
        continue;
      }

      schema = tenantShape;
      path = [TENANTS_KEY, id];
      remaining = tokens.slice(2);
    }

    const resolutions = resolveIn(schema, remaining, path);

    if (resolutions.length === 1) {
      const [{keys, leaf}] = resolutions;
      const setting = keys.join('.');
      const earlier = sources.get(setting);

      /* Two spellings of one setting — CLIENT_ID and CLIENTID, say — would
       * otherwise leave whichever the environment happened to list last in
       * force, with nothing saying the other was ignored. */
      if (earlier) {
        issues.push({
          name: variable,
          message: `names the same setting as ${earlier}; keep one of them.`,
        });
        continue;
      }

      setAt(document, keys, coerceLeaf(leaf, value));
      sources.set(setting, variable);
      continue;
    }

    if (resolutions.length > 1) {
      issues.push({
        name: variable,
        message: `could mean any of ${resolutions
          .map(({keys}) => keys.join('.'))
          .join(', ')}; the schema has to be changed to tell them apart.`,
      });
      continue;
    }

    const reached = deepestReached(schema, remaining, path);
    const where = reached.path.length
      ? `${envNameFor(reached.path)}_`
      : ENV_PREFIX;

    issues.push({
      name: variable,
      message: `names no setting. After ${where}, one of: ${offeringsOf(reached.schema, reached.path)}.`,
    });
  }

  return {document, sources, issues, count};
}

/**
 * The variables a nested document spells out to, one per leaf, in the order the
 * document holds them. The inverse of `readEnvironmentDocument`, for whatever
 * writes configuration rather than reads it.
 */
export function flattenToEnvironment(
  document: Record<string, unknown>,
): Array<[string, string]> {
  const lines: Array<[string, string]> = [];

  const visit = (node: unknown, path: string[]) => {
    if (node === undefined || node === null) return;

    if (typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        visit(value, [...path, key]);
      }
      return;
    }

    lines.push([envNameFor(path), String(node)]);
  };

  visit(document, []);

  return lines;
}
