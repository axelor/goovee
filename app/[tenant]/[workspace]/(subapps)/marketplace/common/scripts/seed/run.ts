import '@/load-swc-env';

import {DEFAULT_CURRENCY_CODE, SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {getMarketplaceConfig, resolveNewListingCurrency} from '../../orm';
import {slugify} from '../../utils/slugify';
import {hash} from '../../utils/string';
import {demoKey} from './constants';
import {findCustomerPartnerByEmail, findWorkspaceByUrl} from './lookups';
import {
  recomputeRatings,
  refreshCurrentVersion,
  uploadScreenshotFiles,
  upsertCategory,
  upsertCompatibilityVersion,
  upsertLicense,
  upsertProduct,
  upsertPublisherRequest,
  type PublisherGrantOutcome,
  upsertReview,
  upsertScreenshots,
  upsertSharedBundleMetaFile,
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
  --tenant <id>         Tenant ID (defaults to 'd' unless MULTI_TENANCY=true)
  --workspace <url>     Workspace URL (required for seeding)
  --suppliers <emails>  Comma-separated supplier emails; each must be a
                        customer partner (required for seeding). Re-running
                        with the same list in the same order keeps every
                        product's owner; a product's own supplierEmail wins
                        over the assignment.
  --file <path>         Path to seed.json (defaults to local seed.json)
  --validate            Run only validation (schema + cross-field rules);
                        makes no database connection
  --help                Show this help message

Example:
  pnpm marketplace:seed \\
    --tenant d \\
    --workspace http://localhost:3000/d/atlas-clients \\
    --suppliers info@apollo.fr,info@blueberry-telecom.fr
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

const GREEN = (text: string) => `\x1b[32m${text}\x1b[0m`;
const YELLOW = (text: string) => `\x1b[33m${text}\x1b[0m`;

function grantOutcomeLine(
  label: string,
  outcome: PublisherGrantOutcome,
): string {
  switch (outcome) {
    case 'granted':
      return `${GREEN('✓')} publisher access ${label}`;
    case 'already-granted':
      return `${GREEN('✓')} publisher access ${label} (already granted)`;
    case 're-approved':
      return `${GREEN('✓')} publisher access ${label} (re-approved a seeded request that had been declined)`;
    case 'left-banned':
      return `${YELLOW('!')} ${label} is banned from publishing here — left banned, so these listings stay unmanageable`;
    case 'left-approved':
      return `${GREEN('✓')} publisher access ${label} (granted outside the seeder, left untouched)`;
    case 'left-blocked':
      return `${YELLOW('!')} ${label} has a publisher request nobody seeded that does not grant access — left untouched, so these listings stay unmanageable`;
  }
}

/**
 * Says what each publisher will actually meet in the storefront. Resolved per
 * publisher the way `ensureAccess` resolves it, so it cannot answer differently
 * from the real gate. None of it blocks seeding: the rows are still worth
 * having for back-office work, so shortfalls only warn.
 */
async function reportPublisherReachability({
  client,
  workspaceURL,
  publishers,
}: {
  client: Client;
  workspaceURL: string;
  publishers: Map<string, string>;
}) {
  for (const [publisherPartnerId, label] of publishers) {
    /* One lookup answers both halves of the publish gate. It has to be per
     * publisher: the app config hangs off a partner's own membership of the
     * workspace, so two publishers here can be governed by different configs.
     * A publisher is always a company — the supplier lookup rejects contacts,
     * whose access runs through their parent company instead. */
    const workspace = await findWorkspace({
      url: workspaceURL,
      user: {
        id: publisherPartnerId,
        isContact: false,
        mainPartnerId: publisherPartnerId,
      },
      client,
    });
    const subapp = workspace?.apps.find(
      app => app.code === SUBAPP_CODES.marketplace,
    );
    if (!workspace || !subapp) {
      console.log(
        `  ${YELLOW('!')} ${label} cannot reach the marketplace in this workspace — they will not see these listings until they are a member with the app enabled`,
      );
      continue;
    }

    const config = await getMarketplaceConfig(workspace.config.id, client);
    if (config?.allowToPublish !== true) {
      console.log(
        `  ${YELLOW('!')} publishing is switched off for ${label} here — their grant cannot be used until "allow to publish" is on for their workspace membership`,
      );
    }
  }
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

  /* Every publisher the run gave a listing to, by the label to report them
   * under, kept for the post-commit reachability report. */
  const seededPublishers = new Map<string, string>();

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

    /* Price each seeded listing in the currency the app would give a listing
     * its publisher created — their own partner currency, falling back to the
     * app-wide default — so seeded and hand-created listings by the same
     * publisher agree. Each partner is resolved once and reused. */
    const saleCurrencyIdByPartner = new Map<string, string>();
    const saleCurrencyIdFor = async (publisherPartnerId: string) => {
      const cached = saleCurrencyIdByPartner.get(publisherPartnerId);
      if (cached) return cached;
      const currency = await resolveNewListingCurrency({
        client: txClient,
        mainPartnerId: publisherPartnerId,
      });
      if (!currency) {
        /* A publisher without a currency of their own falls back, so the only
         * way to get here is the app-wide default row being absent. */
        throw new Error(
          `No currency available: the app-wide default '${DEFAULT_CURRENCY_CODE}' currency is missing.`,
        );
      }
      saleCurrencyIdByPartner.set(publisherPartnerId, currency.id);
      return currency.id;
    };

    const ctx: WorkspaceContext = {
      workspaceId: workspace.id,
      supplierPartnerId: suppliers[0]!.id /* Default to first supplier */,
      workspaceDefaultProductId:
        workspace.config.defaultProductForMarketplace!.id,
      defaults: {
        inAti: workspace.config.defaultProductForMarketplace?.inAti === true,
      },
      saleCurrencyIdFor,
    };

    /* Assign each product to a supplier by a stable hash of its slug rather
     * than its position, so reordering the seed file does not reshuffle
     * ownership and a re-run with the same `--suppliers` list keeps the same
     * owner. Which supplier a product lands on is arbitrary: a hash spreads
     * the catalogue without balancing it, so with three or more suppliers the
     * counts differ. */
    const productSupplierMap = new Map<string, string>();
    data.products.forEach(product => {
      const slug = slugify(product.name);
      productSupplierMap.set(
        slug,
        suppliers[hash(slug) % suppliers.length]!.id,
      );
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

    /* The shared screenshot files are written to storage once. Each product
     * gets a varying number of pictures (0..9, cycling deterministically by
     * index so re-runs stay stable); each picture is its own MetaFile,
     * cycling through these files. */
    const screenshots = await uploadScreenshotFiles({storage, publicRoot});

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
        productSupplierMap.get(slugify(product.name)) || ctx.supplierPartnerId;
      const {id: productId, supplierPartnerId} = await upsertProduct(
        txClient,
        ctx,
        product,
        supplierIdForProduct,
        product.price > 0 ? paidLicenseCodes : freeLicenseCodes,
      );
      seededProductIds.push(productId);
      /* A product's own supplierEmail can override the assignment, so the
       * owner is whoever the upsert settled on. Label them by name when they
       * came from the CLI list, otherwise by the email that named them. */
      seededPublishers.set(
        supplierPartnerId,
        suppliers.find(supplier => supplier.id === supplierPartnerId)?.name ??
          product.supplierEmail ??
          supplierPartnerId,
      );

      const screenshotCount = index % 10; // 0,1,2,…,9,0,1,…
      await upsertScreenshots({
        client: txClient,
        productId,
        count: screenshotCount,
        screenshots,
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
       * pick the published version with the latest `publishDateTime`,
       * matching what `refreshCurrentVersion` chose for the product. */
      const latestPublishedId = [...versionByNumber.values()]
        .filter(v => v.statusSelect === 'published' && v.publishDateTime)
        .sort(
          (a, b) =>
            new Date(b.publishDateTime!).getTime() -
            new Date(a.publishDateTime!).getTime(),
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

      const ownerLabel = seededPublishers.get(supplierPartnerId);
      console.log(
        `  ${GREEN('✓')} product ${demoKey(slugify(product.name))} (${product.versions.length} versions${product.reviews?.length ? `, ${product.reviews.length} reviews` : ''}) → ${ownerLabel}`,
      );
    }

    await recomputeRatings(txClient, seededProductIds);

    /* Give every publisher the seeder handed listings to the grant the
     * storefront checks, so they can manage what they appear to own. */
    for (const [publisherPartnerId, label] of seededPublishers) {
      const outcome = await upsertPublisherRequest({
        client: txClient,
        ctx,
        publisherPartnerId,
      });
      console.log(`  ${grantOutcomeLine(label, outcome)}`);
    }
  });

  /* Reported once the seed is safely committed. These reads only diagnose what
   * the publisher will meet in the storefront, so neither a failure nor a
   * shortfall may undo or fail the rows that were just written. */
  try {
    await reportPublisherReachability({
      client,
      workspaceURL: workspaceURL!,
      publishers: seededPublishers,
    });
  } catch (err) {
    console.log(
      `  ${YELLOW('!')} could not check what these publishers will reach: ${(err as Error).message}`,
    );
  }

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
