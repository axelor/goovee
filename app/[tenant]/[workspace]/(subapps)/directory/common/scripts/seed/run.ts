import '@/load-swc-env';

import {manager} from '@/tenant';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {findPartnerByEmail} from './lookups';
import {upsertDirectoryContact, upsertDirectoryProfile} from './upsert';
import {validateCrossFieldRules} from './validate';
import {SeedSchema} from './validators';

/* `pnpm <script> -- --flag` forwards a bare `--` as its own argv token,
 * which `parseArgs` then treats as the positional separator. Strip it
 * so both `pnpm directory:seed --help` and the pnpm-conventional
 * `pnpm directory:seed -- --help` work the same way. */
const args = process.argv.slice(2).filter(arg => arg !== '--');

const {values} = parseArgs({
  args,
  options: {
    tenant: {type: 'string'},
    file: {type: 'string'},
    validate: {type: 'boolean'},
    help: {type: 'boolean'},
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  console.log(`
Directory Seeder

Seeds directory profiles onto existing customer partners. The target
accounts are the emails listed in seed.json; any email without a matching
partner in the tenant is skipped, and any partner that is not a customer
is skipped too.

Usage:
  pnpm directory:seed [options]

Options:
  --tenant <id>   Tenant ID (defaults to 'd' if MULTI_TENANCY=false)
  --file <path>   Path to seed.json (defaults to local seed.json)
  --validate      Run only validation (schema + cross-field rules)
  --help          Show this help message
`);
  process.exit(0);
}

const tenantId =
  values.tenant ?? (process.env.MULTI_TENANCY === 'true' ? undefined : 'd');
const seedFile = values.file ?? path.resolve(__dirname, 'seed.json');

function fail(message: string): never {
  console.error(`\x1b[31m✖ ${message}\x1b[0m`);
  process.exit(1);
}

if (!values.validate && !tenantId) {
  fail('--tenant is required (or set MULTI_TENANCY=false).');
}

async function main() {
  let raw: unknown;
  try {
    raw = JSON.parse(await fs.readFile(seedFile, 'utf8'));
  } catch (err) {
    fail(`Could not read seed file '${seedFile}': ${(err as Error).message}`);
  }

  const parsed = SeedSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('\x1b[31m✖ Seed file failed schema validation:\x1b[0m');
    console.error(parsed.error.issues);
    process.exit(1);
  }
  const data = parsed.data;
  validateCrossFieldRules(data);

  if (values.validate) {
    console.log(
      '\x1b[32m✔ Seed file is valid (schema + cross-field rules).\x1b[0m',
    );
    process.exit(0);
  }

  const tenant = await manager.getTenant(tenantId!);
  if (!tenant) fail(`Tenant '${tenantId}' not found.`);
  const {client} = tenant;

  const contacts = data.contacts ?? [];
  console.log(
    `\x1b[36m→ Tenant=${tenantId}, ${data.profiles.length} companies + ${contacts.length} contacts to apply\x1b[0m`,
  );

  const companies = {seeded: 0, missing: 0, wrongType: 0};
  const contactStats = {seeded: 0, missing: 0, wrongType: 0};

  await client.$transaction(async txClient => {
    for (const profile of data.profiles) {
      const partner = await findPartnerByEmail(txClient, profile.email);

      if (!partner) {
        companies.missing++;
        console.log(`  \x1b[33m∅ skip\x1b[0m ${profile.email} (no partner)`);
        continue;
      }
      if (!partner.isCustomer) {
        companies.wrongType++;
        console.log(
          `  \x1b[33m∅ skip\x1b[0m ${profile.email} (not a customer)`,
        );
        continue;
      }

      await upsertDirectoryProfile(txClient, partner, profile);
      companies.seeded++;
      console.log(
        `  \x1b[32m✓\x1b[0m ${partner.simpleFullName ?? partner.name ?? profile.email}`,
      );
    }

    for (const contact of contacts) {
      const partner = await findPartnerByEmail(txClient, contact.email);

      if (!partner) {
        contactStats.missing++;
        console.log(`  \x1b[33m∅ skip\x1b[0m ${contact.email} (no partner)`);
        continue;
      }
      if (!partner.isContact) {
        contactStats.wrongType++;
        console.log(`  \x1b[33m∅ skip\x1b[0m ${contact.email} (not a contact)`);
        continue;
      }

      await upsertDirectoryContact(txClient, partner, contact);
      contactStats.seeded++;
      console.log(
        `  \x1b[32m✓\x1b[0m ${partner.simpleFullName ?? partner.name ?? contact.email} (contact)`,
      );
    }
  });

  console.log(
    `\x1b[32m🔥 Success — directory seed applied.\x1b[0m\n` +
      `  companies: ${companies.seeded} seeded, ${companies.missing} no-partner, ${companies.wrongType} not-customer\n` +
      `  contacts:  ${contactStats.seeded} seeded, ${contactStats.missing} no-partner, ${contactStats.wrongType} not-contact`,
  );
}

main().catch(err => {
  if (err?.name === 'SeedValidationError') {
    console.error(`\x1b[31m✖ ${err.message}\x1b[0m`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
