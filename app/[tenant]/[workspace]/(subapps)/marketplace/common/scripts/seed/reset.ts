import '@/load-swc-env';
import {manager} from '@/tenant';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {DEMO_PREFIX} from './constants';

/* Reset / teardown for the marketplace seed.
 *
 * Scope: everything created by `run.ts`. The seed stamps DEMO_PREFIX (see
 * constants.ts) on the natural key of every row it persists, so the
 * teardown matches it all by that one prefix (`${DEMO_PREFIX}%`):
 *   - AOSMarketplaceProduct.slug        (+ their versions, reviews,
 *     pictures, purchases, downloads — scoped by product)
 *   - AOSMetaFile.filePath              (bundles + screenshots)
 *   - AOSMarketplaceCategory.code
 *   - AOSMarketplaceLicense.code
 *   - AOSMarketplaceAxelorVersion.name
 *
 * Because the seeded dictionaries carry the prefix, they can't collide
 * with canonical reference data (a real `MIT` license, `v9.0.0` version),
 * and reset only ever removes seed-created rows.
 *
 * Intentionally NOT touched:
 *   - The backing real AOSProduct (e.g. `defaultProductForMarketplace`)
 *     — shared, owned by the workspace config.
 *   - Partner / customer accounts referenced as publishers/authors.
 *
 * Storage files (the DEMO_PREFIX bundle + screenshots) are removed from
 * disk best-effort after the DB transaction commits. */

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
      `\x1b[33m? This will delete every ${DEMO_PREFIX}* marketplace row (products, files, categories, licenses, compat versions) on tenant '${tenantId}'. Continue? [y/N] \x1b[0m`,
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
    /* Pull the seeded MP rows with the bits we need for the cleanup
     * dance: id+version for optimistic-lock updates, currentVersion +
     * latestVersion to detach the m2o pointers before deleting the
     * version rows they reference. */
    const products = await txClient.aOSMarketplaceProduct.find({
      where: {slug: {like: `${DEMO_PREFIX}%`}},
      select: {
        id: true,
        version: true,
        currentVersion: {id: true},
        latestVersion: {id: true},
      },
    });
    const productIds = products.map(p => p.id);
    const productFilter = {marketplaceProduct: {id: {in: productIds}}} as const;

    /* Product-scoped teardown (steps 1–3) only runs when seeded products
     * exist. The MetaFile + dictionary cleanup further down runs
     * regardless, so orphaned demo rows are still swept even if the
     * products were already deleted. */
    if (productIds.length > 0) {
      /* 1. Child rows scoped to the seeded marketplace products. */
      await txClient.aOSMarketplaceReview.deleteAll({where: productFilter});
      await txClient.aOSMarketplaceDownload.deleteAll({where: productFilter});
      await txClient.aOSMarketplaceProductPurchase.deleteAll({
        where: productFilter,
      });
      await txClient.aOSMarketplaceProductPicture.deleteAll({
        where: productFilter,
      });

      /* 2. Versions — the compatibilitySet M2M must be `remove`d before
       *    the parent rows can be deleted, otherwise the join rows orphan
       *    against a missing version. Same for currentVersion/latestVersion
       *    m2o pointers on MP: detach before the referenced version is
       *    gone. */
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
            .filter((id: unknown): id is string => typeof id === 'string') ??
          [];
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
        if (!p.currentVersion?.id && !p.latestVersion?.id) continue;
        await txClient.aOSMarketplaceProduct.update({
          data: {
            id: p.id,
            version: p.version,
            currentVersion: {select: {id: null}},
            latestVersion: {select: {id: null}},
          },
          select: {id: true},
        });
      }
      await txClient.aOSMarketplaceProductVersion.deleteAll({
        where: productFilter,
      });

      /* 3. The marketplace products themselves. */
      await txClient.aOSMarketplaceProduct.deleteAll({
        where: {id: {in: productIds}},
      });
    }

    /* 4. MetaFile rows whose filePath we stamped (`portal_mkt_demo_…`) — bundles
     *    + screenshots in one shot. Runs regardless of product matches. */
    await txClient.aOSMetaFile.deleteAll({
      where: {filePath: {like: `${DEMO_PREFIX}%`}},
    });

    /* 5. Seeded dictionaries, matched by the demo prefix on their natural
     *    keys. Done after the products/versions that referenced them are
     *    gone. The prefix keeps these distinct from canonical rows (`MIT`,
     *    `v9.0.0`), so nothing shared is ever touched. The backing real
     *    AOSProduct and partner accounts are likewise left alone. */
    await txClient.aOSMarketplaceAxelorVersion.deleteAll({
      where: {name: {like: `${DEMO_PREFIX}%`}},
    });
    await txClient.aOSMarketplaceLicense.deleteAll({
      where: {code: {like: `${DEMO_PREFIX}%`}},
    });
    await txClient.aOSMarketplaceCategory.deleteAll({
      where: {code: {like: `${DEMO_PREFIX}%`}},
    });
  });

  // Best-effort: remove the on-disk files matching our prefixes.
  let removedFiles = 0;
  try {
    const entries = await fs.readdir(storage);
    for (const name of entries) {
      if (name.startsWith(DEMO_PREFIX)) {
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
      `  All ${DEMO_PREFIX}* rows deleted: products + children, files, categories,\n` +
      `  licenses, and compat versions.\n` +
      `  ${removedFiles} on-disk storage files removed.`,
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
