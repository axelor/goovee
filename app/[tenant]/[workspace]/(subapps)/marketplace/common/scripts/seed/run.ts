import '@/load-swc-env';

import {DEFAULT_CURRENCY_CODE} from '@/constants';
import {manager} from '@/tenant';
import {hash} from '../../utils/string';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {
  findCurrencyByCode,
  findCustomerPartnerByEmail,
  findPartnerCurrencies,
  findWorkspaceByUrl,
} from './lookups';
import {
  recomputeRatings,
  refreshCurrentVersion,
  upsertCategory,
  upsertCompatibilityVersion,
  upsertLicense,
  upsertProduct,
  upsertReview,
  upsertScreenshots,
  upsertSharedBundleMetaFile,
  upsertSharedScreenshotMetaFiles,
  upsertVersion,
  type WorkspaceContext,
} from './upsert';
import {validateCrossFieldRules} from './validate';
import {SeedSchema} from './validators';

/* `pnpm <script> -- --flag` forwards a bare `--` as its own argv token,
 * which `parseArgs` then treats as the positional separator. Strip it
 * so both `pnpm marketplace:seed --help` and the pnpm-conventional
 * `pnpm marketplace:seed -- --help` work the same way. */
const args = process.argv.slice(2).filter(arg => arg !== '--');

const {values} = parseArgs({
  args,
  options: {
    tenant: {type: 'string'},
    workspace: {type: 'string'},
    suppliers: {type: 'string'},
    file: {type: 'string'},
    validate: {type: 'boolean'},
    help: {type: 'boolean'},
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  console.log(`
Marketplace Seeder

Usage:
  pnpm marketplace:seed [options]

Options:
  --tenant <id>         Tenant ID (defaults to 'd' if MULTI_TENANCY=false)
  --workspace <url>     Workspace URL (required for seeding)
  --suppliers <emails>  Comma-separated supplier emails (required for seeding)
                        Apps and skills distributed equally among suppliers
  --file <path>         Path to seed.json (defaults to local seed.json)
  --validate            Run only validation (schema + cross-field rules)
  --help                Show this help message
`);
  process.exit(0);
}

const tenantId =
  values.tenant ?? (process.env.MULTI_TENANCY === 'true' ? undefined : 'd');
const workspaceURL = values.workspace;
const suppliersInput = values.suppliers;
const seedFile = values.file ?? path.resolve(__dirname, 'seed.json');

function fail(message: string): never {
  console.error(`\x1b[31m✖ ${message}\x1b[0m`);
  process.exit(1);
}

if (!values.validate) {
  if (!tenantId) fail('--tenant is required (or set MULTI_TENANCY=false).');
  if (!workspaceURL) fail('--workspace=<url> is required.');
  if (!suppliersInput) fail('--suppliers=<email1,email2,...> is required.');
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
  const {client, config} = tenant;
  const storage = config.aos.storage;
  const publicRoot = path.resolve(process.cwd(), 'public');

  console.log(
    `\x1b[36m→ Tenant=${tenantId} workspace=${workspaceURL} suppliers=${suppliersInput}\x1b[0m`,
  );
  console.log(
    `\x1b[36m→ ${data.categories?.length ?? 0} categories, ${data.compatibilityVersions?.length ?? 0} compat versions, ${data.products.length} products\x1b[0m`,
  );

  await client.$transaction(async txClient => {
    const workspace = await findWorkspaceByUrl(txClient, workspaceURL!);

    /* Parse and validate all suppliers */
    const supplierEmails = suppliersInput!.split(',').map(s => s.trim());
    const suppliers = await Promise.all(
      supplierEmails.map(email => findCustomerPartnerByEmail(txClient, email)),
    );

    console.log(
      `\x1b[36m→ ${suppliers.length} suppliers: ${suppliers.map(s => s.name).join(', ')}\x1b[0m`,
    );

    const ctx: WorkspaceContext = {
      workspaceId: workspace.id,
      supplierPartnerId: suppliers[0]!.id /* Default to first supplier */,
      defaults: {
        unitId: workspace.config.marketplaceDefaultUnit!.id,
        productFamilyId: workspace.config.marketplaceDefaultProductFamily!.id,
        inAti: workspace.config.marketplaceInAti === true,
      },
    };

    /* Per-supplier currency resolution: each product's saleCurrency
     * follows its supplier's partner currency, falling back to the
     * app-wide DEFAULT_CURRENCY_CODE when the supplier has none. Mirrors
     * the runtime behaviour in saveProduct. */
    const supplierCurrencyMap = await findPartnerCurrencies(
      txClient,
      suppliers.map(s => s.id),
    );
    const fallbackCurrency = await findCurrencyByCode(
      txClient,
      DEFAULT_CURRENCY_CODE,
    );
    const resolveSaleCurrencyId = (supplierId: string) =>
      supplierCurrencyMap.get(supplierId) ?? fallbackCurrency.id;

    /* Distribute products across suppliers: apps and skills evenly.
     * Use deterministic hash of product code to avoid bias from data ordering. */
    const appProducts = data.products.filter(p => p.type === 'app');
    const skillProducts = data.products.filter(p => p.type === 'skill');

    const productSupplierMap = new Map<string, string>();
    appProducts.forEach(p => {
      const h = hash(p.code);
      productSupplierMap.set(p.code, suppliers[h % suppliers.length]!.id);
    });
    skillProducts.forEach(p => {
      const h = hash(p.code);
      productSupplierMap.set(p.code, suppliers[h % suppliers.length]!.id);
    });

    for (const category of data.categories ?? []) {
      const row = await upsertCategory(txClient, category, ctx.workspaceId);
      console.log(`  \x1b[32m✓\x1b[0m category ${row.code}`);
    }

    for (const version of data.compatibilityVersions ?? []) {
      const row = await upsertCompatibilityVersion(txClient, version);
      console.log(`  \x1b[32m✓\x1b[0m compatibility ${row.name}`);
    }

    for (const license of data.licenses ?? []) {
      const row = await upsertLicense(txClient, license);
      console.log(`  \x1b[32m✓\x1b[0m license ${row.code}`);
    }

    /* The seed shares two screenshot files (desktop + mobile PWA shots)
     * across every product. Upload once, link a varying number (0..9)
     * cycling through them per product. The count cycles deterministically
     * by product index so re-runs stay stable. */
    const sharedScreenshotIds = await upsertSharedScreenshotMetaFiles({
      client: txClient,
      storage,
      publicRoot,
    });

    /* One tiny zip shipped with this script is used as the bundle for
     * every seeded version. AOS requires `bundleFile` to be non-null;
     * the demo doesn't care what's actually inside. */
    const sharedBundleId = await upsertSharedBundleMetaFile({
      client: txClient,
      storage,
    });

    /* Organize license codes by isPaid for random selection during product seeding */
    const paidLicenseCodes = (data.licenses ?? [])
      .filter(l => l.isPaid)
      .map(l => l.code);
    const freeLicenseCodes = (data.licenses ?? [])
      .filter(l => !l.isPaid)
      .map(l => l.code);

    const seededProductIds: string[] = [];
    for (let index = 0; index < data.products.length; index++) {
      const product = data.products[index];
      const supplierIdForProduct =
        productSupplierMap.get(product.code) || ctx.supplierPartnerId;
      const {id: productId} = await upsertProduct(
        txClient,
        ctx,
        product,
        supplierIdForProduct,
        resolveSaleCurrencyId(supplierIdForProduct),
        product.price > 0 ? paidLicenseCodes : freeLicenseCodes,
      );
      seededProductIds.push(productId);

      const screenshotCount = index % 10; // 0,1,2,…,9,0,1,…
      const desiredMetaIds = Array.from(
        {length: screenshotCount},
        (_, i) => sharedScreenshotIds[i % sharedScreenshotIds.length],
      );
      await upsertScreenshots({
        client: txClient,
        productId,
        desiredMetaIds,
      });
      const versionByNumber = new Map<
        string,
        Awaited<ReturnType<typeof upsertVersion>>
      >();
      for (const version of product.versions) {
        const row = await upsertVersion({
          client: txClient,
          productId,
          version,
          bundleMetaId: sharedBundleId,
        });
        versionByNumber.set(version.versionNumber, row);
      }
      await refreshCurrentVersion(txClient, productId);

      /* Fallback for reviews that don't pin a `reviewedVersionNumber`:
       * pick the published version with the latest `dateOfPublish`,
       * matching what `refreshCurrentVersion` chose for the product. */
      const latestPublishedId = [...versionByNumber.values()]
        .filter(v => v.statusSelect === 'published' && v.dateOfPublish)
        .sort(
          (a, b) =>
            new Date(b.dateOfPublish!).getTime() -
            new Date(a.dateOfPublish!).getTime(),
        )[0]?.id;

      for (const review of product.reviews ?? []) {
        const reviewedVersionId = review.reviewedVersionNumber
          ? versionByNumber.get(review.reviewedVersionNumber)?.id
          : latestPublishedId;
        await upsertReview({
          client: txClient,
          productId,
          authorEmail: review.authorEmail,
          rating: review.rating,
          comment: review.comment,
          reviewedVersionId,
        });
      }

      const supplierName = suppliers.find(
        s => s.id === supplierIdForProduct,
      )?.name;
      console.log(
        `  \x1b[32m✓\x1b[0m product ${product.code} (${product.versions.length} versions${product.reviews?.length ? `, ${product.reviews.length} reviews` : ''}) → ${supplierName}`,
      );
    }

    await recomputeRatings(txClient, seededProductIds);
  });

  console.log('\x1b[32m🔥 Success — marketplace seed applied.\x1b[0m');
}

main().catch(err => {
  if (err?.name === 'SeedLookupError' || err?.name === 'SeedValidationError') {
    console.error(`\x1b[31m✖ ${err.message}\x1b[0m`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
