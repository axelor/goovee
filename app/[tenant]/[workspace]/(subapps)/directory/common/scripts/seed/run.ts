import '@/load-swc-env';

import fs from 'node:fs/promises';
import path from 'node:path';

import * as out from '@/scripts/lib/output';
import {runTenantScript} from '@/scripts/lib/tenant-script';
import {findPartnerByEmail} from './lookups';
import {upsertDirectoryContact, upsertDirectoryProfile} from './upsert';
import {validateCrossFieldRules} from './validate';
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

  /* A rule violation is a problem with the file, not a fault to report with a
   * stack trace. */
  try {
    validateCrossFieldRules(parsed.data);
  } catch (error) {
    out.fail(out.describeFailure(error));
  }

  return parsed.data;
}

type Values = {file?: string; validate?: boolean};

runTenantScript<Values>({
  command: 'pnpm directory:seed',
  title: 'Directory seeder',
  summary: `Seeds directory profiles onto existing customer partners. The target
accounts are the emails listed in seed.json; an email with no matching partner
in the tenant is skipped, and so is a partner that is not a customer.`,
  options: command =>
    command
      .option(
        '--file <path>',
        'Path to seed.json (defaults to the one beside this script)',
      )
      .option(
        '--validate',
        'Validate the seed file and stop, without touching a tenant',
      ),
  run: async ({values, openTenant}) => {
    const data = await loadSeed(values.file);

    if (values.validate) {
      out.ok('Seed file is valid (schema + cross-field rules).');
      return;
    }

    const {client, tenantId} = await openTenant();
    const contacts = data.contacts ?? [];

    out.note(
      `Tenant=${tenantId}, ${data.profiles.length} companies + ${contacts.length} contacts to apply`,
    );

    const companies = {seeded: 0, missing: 0, wrongType: 0};
    const contactStats = {seeded: 0, missing: 0, wrongType: 0};

    await client.$transaction(async txClient => {
      for (const profile of data.profiles) {
        const partner = await findPartnerByEmail(txClient, profile.email);

        if (!partner) {
          companies.missing++;
          out.skip(`${profile.email} (no partner)`);
          continue;
        }
        if (!partner.isCustomer) {
          companies.wrongType++;
          out.skip(`${profile.email} (not a customer)`);
          continue;
        }

        await upsertDirectoryProfile(txClient, partner, profile);
        companies.seeded++;
        console.log(
          `  ✓ ${partner.simpleFullName ?? partner.name ?? profile.email}`,
        );
      }

      for (const contact of contacts) {
        const partner = await findPartnerByEmail(txClient, contact.email);

        if (!partner) {
          contactStats.missing++;
          out.skip(`${contact.email} (no partner)`);
          continue;
        }
        if (!partner.isContact) {
          contactStats.wrongType++;
          out.skip(`${contact.email} (not a contact)`);
          continue;
        }

        await upsertDirectoryContact(txClient, partner, contact);
        contactStats.seeded++;
        console.log(
          `  ✓ ${partner.simpleFullName ?? partner.name ?? contact.email} (contact)`,
        );
      }
    });

    out.ok(
      `Directory seed applied.\n` +
        `  companies: ${companies.seeded} seeded, ${companies.missing} no-partner, ${companies.wrongType} not-customer\n` +
        `  contacts:  ${contactStats.seeded} seeded, ${contactStats.missing} no-partner, ${contactStats.wrongType} not-contact`,
    );
  },
});
