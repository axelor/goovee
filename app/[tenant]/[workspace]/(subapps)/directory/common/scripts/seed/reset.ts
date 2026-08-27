import '@/load-swc-env';

import fs from 'node:fs/promises';
import path from 'node:path';

import * as out from '@/scripts/lib/output';
import {runTenantScript} from '@/scripts/lib/tenant-script';
import {findPartnerByEmail} from './lookups';
import {resetDirectoryContact, resetDirectoryProfile} from './upsert';
import {SeedSchema, type SeedData} from './validators';

const DEFAULT_SEED_FILE = path.resolve(__dirname, 'seed.json');

async function loadSeed(file: string | undefined): Promise<SeedData> {
  const seedFile = file ?? DEFAULT_SEED_FILE;

  let raw: unknown;
  try {
    raw = JSON.parse(await fs.readFile(seedFile, 'utf8'));
  } catch (error) {
    out.fail(
      `Could not read seed file '${seedFile}': ${out.describeFailure(error)}`,
    );
  }

  const parsed = SeedSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(parsed.error.issues);
    out.fail(`Seed file '${seedFile}' failed schema validation.`);
  }

  return parsed.data;
}

type Values = {file?: string};

runTenantScript<Values>({
  command: 'pnpm directory:reset',
  title: 'Directory reset',
  summary: `Takes the partners listed in seed.json back out of the directory and
clears the seeded description and visibility flags. Partner data that is used
outside the directory — company name, web site — is left in place, and a
partner that cannot be found is skipped.`,
  options: command =>
    command.option(
      '--file <path>',
      'Path to seed.json (defaults to the one beside this script)',
    ),
  run: async ({values, openTenant}) => {
    /* Read before anything is opened: a seed file that cannot be used names
     * nothing to reset. */
    const data = await loadSeed(values.file);

    const {client, tenantId} = await openTenant();
    const summary = {reset: 0, missing: 0};

    await client.$transaction(async txClient => {
      for (const profile of data.profiles) {
        const partner = await findPartnerByEmail(txClient, profile.email);
        if (!partner) {
          summary.missing++;
          continue;
        }
        await resetDirectoryProfile(txClient, partner);
        summary.reset++;
      }

      for (const contact of data.contacts ?? []) {
        const partner = await findPartnerByEmail(txClient, contact.email);
        if (!partner) {
          summary.missing++;
          continue;
        }
        await resetDirectoryContact(txClient, partner);
        summary.reset++;
      }
    });

    out.ok(
      `Reset done — tenant=${tenantId}.\n` +
        `  ${summary.reset} profiles reset, ${summary.missing} skipped (no partner).`,
    );
  },
});
