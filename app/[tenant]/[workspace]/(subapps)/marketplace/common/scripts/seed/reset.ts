import '@/load-swc-env';
import {manager} from '@/tenant';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';

/* Reset / teardown for the marketplace seed.
 *
 * Scope: everything created by `run.ts` and nothing else. The seeded
 * rows are identified by stable prefixes:
 *   - AOSProduct.code        LIKE 'mkt-demo-%'
 *   - AOSMetaFile.filePath   LIKE 'mkt-demo-%'  (bundles + screenshots)
 *
 * Intentionally NOT touched:
 *   - AOSProductCategory rows — may be referenced by non-seeded
 *     products, the cleanup is conservative.
 *   - AOSMarketplaceAxelorVersion rows — shared dictionary.
 *
 * Storage files (mkt-demo-bundle-*, mkt-demo-screenshot-*) are removed
 * from disk best-effort after the DB transaction commits. */

const args = process.argv.slice(2).filter(arg => arg !== '--');
const {values} = parseArgs({
  args,
  options: {
    tenant: {type: 'string'},
    yes: {type: 'boolean'},
    help: {type: 'boolean'},
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  console.log(`
Marketplace Reset

Usage:
  pnpm marketplace:reset --tenant=<id> [--yes]

Options:
  --tenant <id>   Tenant ID (defaults to 'd' if MULTI_TENANCY=false)
  --yes           Skip the confirmation prompt
  --help          Show this help
`);
  process.exit(0);
}

const tenantId =
  values.tenant ?? (process.env.MULTI_TENANCY === 'true' ? undefined : 'd');

function fail(message: string): never {
  console.error(`\x1b[31m✖ ${message}\x1b[0m`);
  process.exit(1);
}

if (!tenantId) fail('--tenant is required (or set MULTI_TENANCY=false).');

async function confirm(): Promise<boolean> {
  if (values.yes) return true;
  return new Promise(resolve => {
    process.stdout.write(
      `\x1b[33m? This will delete every marketplace row with code LIKE 'mkt-demo-%' on tenant '${tenantId}'. Continue? [y/N] \x1b[0m`,
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
  if (!(await confirm())) {
    console.log('Aborted.');
    process.exit(0);
  }

  const tenant = await manager.getTenant(tenantId!);
  if (!tenant) fail(`Tenant '${tenantId}' not found.`);
  const {client, config} = tenant;
  const storage = config.aos.storage;

  await client.$transaction(async txClient => {
    /* Pull the seeded products with the bits we need for the cleanup
     * dance: id+version for optimistic-lock updates, currentVersion to
     * detach the M2O before deleting the version row it points at. */
    const products = await txClient.aOSProduct.find({
      where: {code: {like: 'mkt-demo-%'}},
      select: {
        id: true,
        version: true,
        currentVersion: {id: true},
      },
    });
    if (products.length === 0) return;
    const productIds = products.map(p => p.id);
    const productFilter = {product: {id: {in: productIds}}} as const;

    /* 1. Child rows scoped to the seeded products. */
    await txClient.aOSMarketplaceReview.deleteAll({where: productFilter});
    await txClient.aOSMarketplaceDownload.deleteAll({where: productFilter});
    await txClient.aOSMarketplaceProductPurchase.deleteAll({
      where: productFilter,
    });
    await txClient.aOSProductPicture.deleteAll({where: productFilter});

    /* 2. Versions — the compatibilitySet M2M must be `remove`d before
     *    the parent rows can be deleted, otherwise the join rows orphan
     *    against a missing version. Same for the product.currentVersion
     *    M2O pointer: detach before the version it references is gone. */
    const versions = await txClient.aOSMarketplaceProductVersion.find({
      where: productFilter,
      select: {
        id: true,
        version: true,
        compatibilitySet: {select: {id: true}},
      },
    });
    for (const v of versions) {
      const compatIds =
        v.compatibilitySet
          ?.map(row => row.id)
          .filter((id): id is string => !!id) ?? [];
      if (compatIds.length === 0) continue;
      await txClient.aOSMarketplaceProductVersion.update({
        data: {
          id: v.id,
          version: v.version,
          compatibilitySet: {remove: compatIds},
        },
        select: {id: true},
      });
    }
    for (const p of products) {
      if (!p.currentVersion?.id) continue;
      await txClient.aOSProduct.update({
        data: {
          id: p.id,
          version: p.version,
          currentVersion: {select: {id: null}},
        },
        select: {id: true},
      });
    }
    await txClient.aOSMarketplaceProductVersion.deleteAll({
      where: productFilter,
    });

    /* 3. Products themselves. */
    await txClient.aOSProduct.deleteAll({
      where: {id: {in: productIds}},
    });

    /* 4. Orphan MetaFile rows whose filePath we stamped (`mkt-demo-…`).
     *    Covers bundles + screenshots in one shot. */
    await txClient.aOSMetaFile.deleteAll({
      where: {filePath: {like: 'mkt-demo-%'}},
    });
  });

  // Best-effort: remove the on-disk files matching our prefixes.
  let removedFiles = 0;
  try {
    const entries = await fs.readdir(storage);
    for (const name of entries) {
      if (name.startsWith('mkt-demo-')) {
        await fs.unlink(path.resolve(storage, name)).catch(() => {});
        removedFiles++;
      }
    }
  } catch (err) {
    console.warn(
      `\x1b[33m⚠ Could not clean storage dir '${storage}': ${(err as Error).message}\x1b[0m`,
    );
  }

  console.log(
    `\x1b[32m🔥 Reset done — tenant=${tenantId}\x1b[0m\n` +
      `  All rows with code/file_path LIKE 'mkt-demo-%' deleted.\n` +
      `  ${removedFiles} on-disk storage files removed.`,
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
