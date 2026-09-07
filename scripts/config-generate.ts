import fs from 'node:fs';
import path from 'node:path';

import prettier from 'prettier';
import {z} from 'zod';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';

import {CONFIG_FILE_STEM, CONFIG_SCHEMA_FILE} from '@/config/files';
import {envNameFor, TENANTS_KEY} from '@/config/names';
import {configSchema} from '@/config/schema';
import {
  descriptionOf,
  enumValues,
  isOptional,
  leafKind,
  recordValueOf,
  shapeOf,
} from '@/config/walk';

const SCHEMA_SOURCE = 'lib/core/config/schema.ts';

const ENV_EXAMPLE_FILE = 'env.example';
const JSON_EXAMPLE_FILE = `${CONFIG_FILE_STEM}.example.json`;

/* The tenant the examples are written for. Any lowercase alphanumeric id works;
 * this one is short and reads as a placeholder. */
const EXAMPLE_TENANT = 'acme';

const WIDTH = 78;

/* A paragraph as comment lines, wrapped at the width a terminal shows without
 * scrolling sideways. */
function comment(text: string): string[] {
  const lines: string[] = [];
  let line = '#';

  for (const word of text.split(/\s+/)) {
    if (line.length + 1 + word.length > WIDTH && line !== '#') {
      lines.push(line);
      line = '#';
    }
    line += ` ${word}`;
  }

  lines.push(line);

  return lines;
}

const HEADER = `
Portal configuration.

Every setting is one environment variable starting with PORTAL_. The name
spells the setting: PORTAL_ORIGIN is the deployment's origin, and
PORTAL_TENANT_ACME_DB_URL is the database of the tenant "acme". Names are
uppercase with underscores; there is nothing else to spell.

A tenant is declared by its variables: every PORTAL_TENANT_<ID>_… variable
adds to the tenant <ID>, and a deployment serves every tenant so declared.
Repeat the tenant block below once per tenant, replacing ACME with the
tenant's id — a lowercase letter, then lowercase letters or digits, at most
15 characters. The id is also the first segment of every address of that
tenant, unless the tenant is routed by host.

Required settings are written out below; optional ones are commented out
with their defaults described. Quote a value that holds a space, a # or a
quote (in single quotes), and write a literal $ as \\$ — the loader expands
\${VAR} references in values.

The same settings can be written as a JSON document instead: ${CONFIG_FILE_STEM}.json
in the working directory, with the keys ${CONFIG_SCHEMA_FILE} describes
and ${JSON_EXAMPLE_FILE} starts from. The files layer like the .env
files — ${CONFIG_FILE_STEM}.<mode>.local.json, ${CONFIG_FILE_STEM}.local.json,
${CONFIG_FILE_STEM}.<mode>.json, ${CONFIG_FILE_STEM}.json, the first to hold a
setting winning — and every variable, set on the process or read from a .env
file, overrides the same setting in any of them.

Where the variables go: this file, copied to .env, for pnpm dev and next
start; the same file passed with docker run --env-file, or as env_file: in
compose; individual variables with -e or a Kubernetes Secret. Validate a
configuration with pnpm config:check, and write one from the variables of a
release before with pnpm config:migrate — as ${CONFIG_FILE_STEM}.json, or as
these variables with --format env.

Generated from ${SCHEMA_SOURCE} by pnpm config:generate. Edit the schema,
not this file.
`.trim();

const FOOTER = `
The one browser variable read from the environment rather than the
configuration: it is inlined into the client bundle at build time, so
changing it means rebuilding the app, and no ${CONFIG_FILE_STEM} file can carry
it. Empty for a root deployment, or a subpath like /portal.
`.trim();

function placeholder(schema: z.ZodType): string {
  switch (leafKind(schema)) {
    case 'boolean':
      return 'true';
    case 'enum':
      return enumValues(schema)[0] ?? '';
    default:
      return '';
  }
}

/* One setting: its description, then the variable. A setting that may be left
 * out — or that sits inside a group that may be — is commented out, so that
 * copying the file as it stands declares exactly what has to be declared. */
function renderLeaf(
  schema: z.ZodType,
  keyPath: string[],
  required: boolean,
): string[] {
  const lines: string[] = [];
  const description = descriptionOf(schema);
  const kind = leafKind(schema);

  const notes: string[] = [];
  if (description) notes.push(description);
  if (kind === 'enum') notes.push(`One of: ${enumValues(schema).join(', ')}.`);
  if (kind === 'integer') notes.push('A whole number.');
  else if (kind === 'number') notes.push('A number.');
  else if (kind === 'boolean') notes.push('true or false.');

  if (notes.length) lines.push(...comment(notes.join(' ')));

  const assignment = `${envNameFor(keyPath)}=${placeholder(schema)}`;
  lines.push(required ? assignment : `#${assignment}`);

  return lines;
}

/* A group: its description once, then every setting under it, with groups
 * nested inside it following after their own blank line. */
function renderGroup(
  schema: z.ZodType,
  keyPath: string[],
  required: boolean,
): string[] {
  const shape = shapeOf(schema);
  if (!shape) return [];

  const lines: string[] = [];
  const leaves = Object.entries(shape).filter(([, child]) => leafKind(child));
  const groups = Object.entries(shape).filter(([, child]) => shapeOf(child));

  /* Settings with nothing said about them sit on consecutive lines; a blank line
   * separates a documented setting from its neighbours so its comment reads as
   * its own. */
  let previousDocumented = false;

  for (const [key, child] of leaves) {
    const block = renderLeaf(
      child,
      [...keyPath, key],
      required && !isOptional(child),
    );
    const documented = block.length > 1;

    if (lines.length && (documented || previousDocumented)) lines.push('');

    lines.push(...block);
    previousDocumented = documented;
  }

  if (leaves.length) lines.push('');

  for (const [key, child] of groups) {
    const description = descriptionOf(child);
    const childRequired = required && !isOptional(child);

    lines.push(`# --- ${envNameFor([...keyPath, key])}_… ---`);
    if (description) {
      lines.push(...comment(description));
    }
    if (!childRequired) {
      lines.push(
        ...comment(
          'Optional as a whole; leave every variable out to turn it off.',
        ),
      );
    }
    lines.push('');
    lines.push(...renderGroup(child, [...keyPath, key], childRequired));
  }

  return lines;
}

/* Prose written as paragraphs separated by blank lines, as comment lines: each
 * paragraph wrapped on its own, the blank lines kept as bare `#`. A line
 * opening a section (`## … ##`) is kept as it stands. */
function commentBlock(text: string): string[] {
  return text.split(/\n\s*\n/).flatMap((paragraph, index) => {
    const separator = index ? ['#'] : [];

    if (paragraph.startsWith('## ')) return [...separator, paragraph];

    return [...separator, ...comment(paragraph.replace(/\n/g, ' '))];
  });
}

function renderEnvExample(): string {
  const lines: string[] = [...commentBlock(HEADER), ''];

  lines.push('## Deployment ##', '');

  const deploymentShape = {...configSchema.shape};
  const tenantsSchema = deploymentShape[TENANTS_KEY];
  delete (deploymentShape as Record<string, unknown>)[TENANTS_KEY];

  for (const [key, child] of Object.entries(deploymentShape)) {
    if (leafKind(child)) {
      lines.push(...renderLeaf(child, [key], !isOptional(child)), '');
    } else {
      lines.push(...renderGroup(child, [key], !isOptional(child)));
    }
  }

  const tenantSchema = recordValueOf(tenantsSchema);

  if (tenantSchema) {
    lines.push(`## Tenant "${EXAMPLE_TENANT}" ##`, '');
    lines.push(
      ...renderGroup(tenantSchema, [TENANTS_KEY, EXAMPLE_TENANT], true),
    );
  }

  lines.push(
    '## Build-time ##',
    '',
    ...commentBlock(FOOTER),
    'NEXT_PUBLIC_BASE_PATH=',
    '',
  );

  return lines.join('\n');
}

/* The value a required leaf is written with in the JSON example: something of
 * the right type that reads as a blank to fill in. */
function exampleValue(schema: z.ZodType): unknown {
  switch (leafKind(schema)) {
    case 'boolean':
      return true;
    case 'integer':
    case 'number':
      return 0;
    case 'enum':
      return enumValues(schema)[0] ?? '';
    default:
      return '';
  }
}

/* A group with every required setting in it and nothing else, since JSON has
 * no way to write an optional setting out without also setting it; the
 * optional ones are what the schema file describes for an editor. A required
 * group whose every member is optional — the AOS credentials, one of two ways —
 * is written with its first setting rather than empty, so the example shows
 * there is something to fill in. The tenants come as the one example tenant. */
function exampleGroup(schema: z.ZodType): Record<string, unknown> {
  const shape = shapeOf(schema);
  if (!shape) return {};

  const entries = Object.entries(shape);
  const required = entries.filter(([, child]) => !isOptional(child));
  const shown = required.length ? required : entries.slice(0, 1);

  const result: Record<string, unknown> = {};

  for (const [key, child] of shown) {
    const tenantSchema = recordValueOf(child);

    result[key] = tenantSchema
      ? {[EXAMPLE_TENANT]: exampleGroup(tenantSchema)}
      : shapeOf(child)
        ? exampleGroup(child)
        : exampleValue(child);
  }

  return result;
}

/* Formatted the way the repository formats every other JSON file, so that
 * generating a file and running `pnpm format` do not fight over the result. */
async function renderJson(file: string, value: unknown): Promise<string> {
  const filePath = path.join(process.cwd(), file);
  const config = await prettier.resolveConfig(filePath);

  return prettier.format(JSON.stringify(value), {
    ...config,
    filepath: filePath,
  });
}

function renderJsonExample(): Promise<string> {
  return renderJson(JSON_EXAMPLE_FILE, {
    $schema: `./${CONFIG_SCHEMA_FILE}`,
    ...exampleGroup(configSchema),
  });
}

/*
 * `io: 'input'` is what makes the schema describe a document as an operator
 * writes it: the parse settles two values on the way through — the per-tenant
 * storage root and a Keycloak issuer's trailing slash — and the output side
 * would describe them as they end up rather than as they are written.
 *
 * A rule no JSON Schema keyword expresses — a refinement, the checks that
 * compare tenants against each other — is dropped silently, so the file tells
 * an editor the shape and the descriptions and leaves the rest to the load.
 *
 * The root admits a `$schema` key, which the zod schema does not declare: the
 * loader skips it, and a file naming this schema would otherwise be told by its
 * own schema that the key is not allowed.
 */
function renderJsonSchema(): Promise<string> {
  const schema = z.toJSONSchema(configSchema, {
    target: 'draft-7',
    io: 'input',
  }) as {properties?: Record<string, unknown>};

  schema.properties = {
    $schema: {
      type: 'string',
      description: 'The JSON Schema an editor checks this file against.',
    },
    ...schema.properties,
  };

  return renderJson(CONFIG_SCHEMA_FILE, schema);
}

type Output = {file: string; render: () => string | Promise<string>};

const OUTPUTS: Output[] = [
  {file: ENV_EXAMPLE_FILE, render: renderEnvExample},
  {file: CONFIG_SCHEMA_FILE, render: renderJsonSchema},
  {file: JSON_EXAMPLE_FILE, render: renderJsonExample},
];

runScript({
  command: 'pnpm config:generate',
  title: 'Configuration reference generation',
  summary: `Writes ${OUTPUTS.map(output => output.file).join(', ')} from the
schema the loader validates against, so the references an operator writes
their configuration from — and the JSON Schema their editor checks a
${CONFIG_FILE_STEM} file against — agree with the running server on what a valid
configuration holds. Run it after changing ${SCHEMA_SOURCE}; --check reports a
stale file instead of writing one, which is what the format job on CI runs so
that the committed files cannot drift from the schema.`,
  options: command =>
    command.option(
      '--check',
      'Report whether the committed files are up to date, without writing them',
    ),
  run: async ({values}: {values: {check?: boolean}}) => {
    const stale: string[] = [];

    for (const {file, render} of OUTPUTS) {
      const filePath = path.join(process.cwd(), file);
      const generated = await render();

      if (values.check) {
        const committed = fs.existsSync(filePath)
          ? fs.readFileSync(filePath, 'utf8')
          : '';

        if (committed !== generated) stale.push(file);
        continue;
      }

      fs.writeFileSync(filePath, generated);
      out.ok(`Wrote ${file}.`);
    }

    if (stale.length) {
      out.fail(
        `${stale.join(', ')} ${stale.length === 1 ? 'does' : 'do'} not match ` +
          `${SCHEMA_SOURCE}. Run \`pnpm config:generate\` and commit the result.`,
      );
    }

    if (values.check) {
      out.ok(
        `${OUTPUTS.map(output => output.file).join(', ')} are up to date.`,
      );
    }
  },
});
