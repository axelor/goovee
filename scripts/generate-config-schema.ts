import fs from 'node:fs';
import path from 'node:path';

import prettier from 'prettier';
import {z} from 'zod';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';

import {configDocumentSchema} from '@/tenant/schema';

const SCHEMA_FILE = path.join(process.cwd(), 'tenants.config.schema.json');

const RELATIVE_PATH = path.relative(process.cwd(), SCHEMA_FILE);

/*
 * The document schema as JSON Schema, formatted the way the repository formats
 * every other JSON file so that generating it and running `pnpm format` do not
 * fight over the result.
 *
 * `io: 'input'` is what makes the file describe a document as an operator writes
 * it: the schema settles two values as it parses — the per-tenant storage root
 * and a Keycloak issuer's trailing slash — and the output side would describe
 * them as they end up rather than as they are written.
 *
 * A rule no JSON Schema keyword expresses is dropped silently here, which is why
 * the two that matter to an editor are carried explicitly in the schema's own
 * metadata: the either-or on aos.auth, and the tenant id pattern. The document's
 * "at least one tenant" rule is deliberately not among them. It is expressible —
 * `not: {propertyNames: {pattern: "^\\$(schema|global)$"}}` says no document
 * consists only of reserved keys — but an editor reports a failed `not` as
 * "matches a schema that is not allowed", against the whole document and naming
 * nothing, which tells an operator less than the load's own message does.
 */
async function render(): Promise<string> {
  const schema = z.toJSONSchema(configDocumentSchema, {
    target: 'draft-7',
    io: 'input',
  });

  const config = await prettier.resolveConfig(SCHEMA_FILE);

  return prettier.format(JSON.stringify(schema), {
    ...config,
    filepath: SCHEMA_FILE,
  });
}

runScript({
  command: 'pnpm config:schema',
  title: 'Configuration schema generation',
  summary: `Writes ${RELATIVE_PATH} from the zod schema the loader validates
against, so an operator's editor and the running server agree on what a valid
configuration document holds. Run it after changing lib/core/tenant/schema.ts;
--check reports a stale file instead of writing one, which is what the format
job on CI runs so that the committed file cannot drift from the schema.`,
  options: command =>
    command.option(
      '--check',
      'Report whether the committed file is up to date, without writing it',
    ),
  run: async ({values}: {values: {check?: boolean}}) => {
    const generated = await render();

    if (values.check) {
      const committed = fs.existsSync(SCHEMA_FILE)
        ? fs.readFileSync(SCHEMA_FILE, 'utf8')
        : '';

      if (committed !== generated) {
        out.fail(
          `${RELATIVE_PATH} does not match lib/core/tenant/schema.ts. ` +
            `Run \`pnpm config:schema\` and commit the result.`,
        );
      }

      out.ok(`${RELATIVE_PATH} is up to date.`);
      return;
    }

    fs.writeFileSync(SCHEMA_FILE, generated);
    out.ok(`Wrote ${RELATIVE_PATH}.`);
  },
});
