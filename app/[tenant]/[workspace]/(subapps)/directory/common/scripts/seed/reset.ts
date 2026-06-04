import '@/load-swc-env';

import {manager} from '@/tenant';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {findPartnerByEmail} from './lookups';
import {resetDirectoryContact, resetDirectoryProfile} from './upsert';
import {SeedSchema} from './validators';

/* Reset / teardown for the directory seed.
 *
 * Scope: the partners listed in seed.json. For each, it pulls the account
 * back out of the directory (isInDirectory=false), clears the seeded
 * description, and turns the visibility flags off. Shared partner data
 * (portalCompanyName, webSite) is intentionally left in place — it may be
 * used outside the directory. Partners not found are skipped. */

const args = process.argv.slice(2).filter(arg => arg !== '--');
const {values} = parseArgs({
  args,
  options: {
    tenant: {type: 'string'},
    file: {type: 'string'},
    yes: {type: 'boolean'},
    help: {type: 'boolean'},
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  console.log(`
Directory Reset

Usage:
  pnpm directory:reset --tenant=<id> [--yes]

Options:
  --tenant <id>   Tenant ID (defaults to 'd' if MULTI_TENANCY=false)
  --file <path>   Path to seed.json (defaults to local seed.json)
  --yes           Skip the confirmation prompt
  --help          Show this help
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

if (!tenantId) fail('--tenant is required (or set MULTI_TENANCY=false).');

async function confirm(): Promise<boolean> {
  if (values.yes) return true;
  return new Promise(resolve => {
    process.stdout.write(
      `\x1b[33m? This will remove the seeded directory profiles from their partners on tenant '${tenantId}'. Continue? [y/N] \x1b[0m`,
    );
    const onData = (chunk: Buffer) => {
      process.stdin.removeListener('data', onData);
      process.stdin.pause();
      const answer = chunk.toString().trim().toLowerCase();
      resolve(answer === 'y' || answer === 'yes');
    };
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
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

  if (!(await confirm())) {
    console.log('Aborted.');
    process.exit(0);
  }

  const tenant = await manager.getTenant(tenantId!);
  if (!tenant) fail(`Tenant '${tenantId}' not found.`);
  const {client} = tenant;

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

  console.log(
    `\x1b[32m🔥 Reset done — tenant=${tenantId}.\x1b[0m\n` +
      `  ${summary.reset} profiles reset, ${summary.missing} skipped (no partner).`,
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
