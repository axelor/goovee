import '@/load-swc-env';

import {DEFAULT_CURRENCY_CODE, SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {findWorkspace} from '@/orm/workspace';
import * as out from '@/scripts/lib/output';
import {runTenantScript, type TenantHandle} from '@/scripts/lib/tenant-script';
import fs from 'node:fs/promises';
import path from 'node:path';
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
import {SeedSchema, type SeedData} from './validators';

type Values = {
  workspace?: string;
  suppliers?: string;
  file?: string;
  validate?: boolean;
};

/* What the seed needs beyond the tenant: the file it was given, already read
 * and checked, and the two arguments it cannot run without. */
type MarketplaceSeed = TenantHandle & {
  data: SeedData;
  workspaceURL: string;
  suppliersInput: string;
};

const DEFAULT_SEED_FILE = path.resolve(__dirname, 'seed.json');

const MISSING_WORKSPACE = '--workspace=<url> is required.';
const MISSING_SUPPLIERS = '--suppliers=<email1,email2,...> is required.';

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

const TICK = `${out.GREEN}✓${out.RESET}`;
const ALERT = `${out.YELLOW}!${out.RESET}`;

function grantOutcomeLine(
  label: string,
  outcome: PublisherGrantOutcome,
): string {
  switch (outcome) {
    case 'granted':
      return `${TICK} publisher access ${label}`;
    case 'already-granted':
      return `${TICK} publisher access ${label} (already granted)`;
    case 're-approved':
      return `${TICK} publisher access ${label} (re-approved a seeded request that had been declined)`;
    case 'left-banned':
      return `${ALERT} ${label} is banned from publishing here — left banned, so these listings stay unmanageable`;
    case 'left-approved':
      return `${TICK} publisher access ${label} (granted outside the seeder, left untouched)`;
    case 'left-blocked':
      return `${ALERT} ${label} has a publisher request nobody seeded that does not grant access — left untouched, so these listings stay unmanageable`;
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
        `  ${ALERT} ${label} cannot reach the marketplace in this workspace — they will not see these listings until they are a member with the app enabled`,
      );
      continue;
    }

    const config = await getMarketplaceConfig(workspace.config.id, client);
    if (config?.allowToPublish !== true) {
      console.log(
        `  ${ALERT} publishing is switched off for ${label} here — their grant cannot be used until "allow to publish" is on for their workspace membership`,
      );
    }
  }
}

async function seedMarketplace({
  client,
  config,
  tenantId,
  data,
  workspaceURL,
  suppliersInput,
}: MarketplaceSeed) {
  const storage = config.aos.storage;
  const publicRoot = path.resolve(process.cwd(), 'public');

  out.note(
    `Tenant=${tenantId} workspace=${workspaceURL} suppliers=${suppliersInput}`,
  );
  out.note(
    `${data.categories?.length ?? 0} categories, ${data.compatibilityVersions?.length ?? 0} compat versions, ${data.products.length} products`,
  );

  /* Every publisher the run gave a listing to, by the label to report them
   * under, kept for the post-commit reachability report. */
  const seededPublishers = new Map<string, string>();

  await client.$transaction(async txClient => {
    const workspace = await findWorkspaceByUrl(txClient, workspaceURL);

    /* Parse and validate all suppliers */
    const supplierEmails = suppliersInput.split(',').map(s => s.trim());
    const suppliers = await Promise.all(
      supplierEmails.map(email => findCustomerPartnerByEmail(txClient, email)),
    );

    out.note(
      `${suppliers.length} suppliers: ${suppliers.map(s => s.name).join(', ')}`,
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
      console.log(`  ${TICK} category ${row.code}`);
    }

    for (const version of data.compatibilityVersions ?? []) {
      const row = await upsertCompatibilityVersion(txClient, version);
      console.log(`  ${TICK} compatibility ${row.name}`);
    }

    for (const license of data.licenses ?? []) {
      const row = await upsertLicense(txClient, license);
      console.log(`  ${TICK} license ${row.code}`);
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
        `  ${TICK} product ${demoKey(slugify(product.name))} (${product.versions.length} versions${product.reviews?.length ? `, ${product.reviews.length} reviews` : ''}) → ${ownerLabel}`,
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
      workspaceURL,
      publishers: seededPublishers,
    });
  } catch (err) {
    console.log(
      `  ${ALERT} could not check what these publishers will reach: ${out.describeFailure(err)}`,
    );
  }

  out.ok('Marketplace seed applied.');
}

runTenantScript<Values>({
  command: 'pnpm marketplace:seed',
  title: 'Marketplace seeder',
  summary: `Seeds marketplace categories, licences, compatibility versions and
listings, assigning the listings to the given suppliers and granting each of
them the publisher access the storefront checks.

Example:
  pnpm marketplace:seed --tenant=d \\
    --workspace=http://localhost:3000/d/atlas-clients \\
    --suppliers=info@apollo.fr,info@blueberry-telecom.fr`,
  options: command =>
    command
      .option('--workspace <url>', 'Workspace URL (required for seeding)')
      .option(
        '--suppliers <emails>',
        "Comma-separated supplier emails; each must be a customer partner (required for seeding). Re-running with the same list in the same order keeps every product's owner; a product's own supplierEmail wins over the assignment",
      )
      .option(
        '--file <path>',
        'Path to seed.json (defaults to the one beside this script)',
      )
      .option(
        '--validate',
        'Validate the seed file and stop, without opening a database connection',
      ),
  /* A partner or workspace the seed file names but the tenant does not have is
   * a problem with the inputs, not a fault to report with a stack trace. */
  explain: error =>
    error instanceof Error &&
    (error.name === 'SeedLookupError' || error.name === 'SeedValidationError')
      ? error.message
      : undefined,
  run: async ({values, openTenant}) => {
    const data = await loadSeed(values.file);

    if (values.validate) {
      out.ok('Seed file is valid (schema + cross-field rules).');
      return;
    }

    /* Checked before anything is opened, so a missing argument costs nothing:
     * the seed writes files as well as rows. */
    const workspaceURL = values.workspace ?? out.fail(MISSING_WORKSPACE);
    const suppliersInput = values.suppliers ?? out.fail(MISSING_SUPPLIERS);

    await seedMarketplace({
      ...(await openTenant()),
      data,
      workspaceURL,
      suppliersInput,
    });
  },
});
