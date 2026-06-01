import type {Client} from '@/goovee/.generated/client';
import type {
  AOSMarketplaceProduct,
  AOSMarketplaceProductVersion,
} from '@/goovee/.generated/models';
import {getFileSizeText} from '@/utils/files';
import {sql} from '@/utils/template-string';
import {BigDecimal, type CreateArgs} from '@goovee/orm';
import {MARKETPLACE_ICONS} from '../../constants/icons';
import {DEMO_PREFIX, demoKey} from './constants';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {syncProductVersionPointers} from '../../orm/versions';
import {parseVersionNumber} from '../../utils/version-number';
import {
  findCategoryByCode,
  findCompatibilityVersionByName,
  findCustomerPartnerByEmail,
  findPartnerByEmail,
} from './lookups';
import type {
  CategorySeed,
  CompatibilityVersionSeed,
  LicenseSeed,
  ProductSeed,
  VersionSeed,
} from './validators';

export type WorkspaceContext = {
  workspaceId: string;
  supplierPartnerId: string;
  /** The workspace's backing real Product (PortalAppConfig.defaultProductForMarketplace).
   *  Every seeded MarketplaceProduct points at this; tax/currency/unit
   *  live there and the marketplace product only overrides salePrice/inAti. */
  backingProductId: string;
  defaults: {
    inAti: boolean;
    saleCurrencyId: string;
  };
};

const SCREENSHOT_PREFIX = `${DEMO_PREFIX}screenshot`;
const MIME_BY_EXT: Record<string, string> = {
  '.zip': 'application/zip',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
};

function getRandomIconCode(productCode: string): string {
  /* Deterministically select an icon based on product code hash
   * so the same icon is always chosen for the same product across runs. */
  let hash = 0;
  for (let i = 0; i < productCode.length; i++) {
    hash = (hash << 5) - hash + productCode.charCodeAt(i);
    hash = hash & hash;
  }
  return MARKETPLACE_ICONS[Math.abs(hash) % MARKETPLACE_ICONS.length]!.code;
}

function getRandomLicenseCode(
  productCode: string,
  licenseCodes: string[],
): string | null {
  /* Deterministically select a license code based on product code hash
   * so the same license is always chosen for the same product across runs. */
  if (!licenseCodes.length) return null;
  let hash = 0;
  for (let i = 0; i < productCode.length; i++) {
    hash = (hash << 5) - hash + productCode.charCodeAt(i);
    hash = hash & hash;
  }
  return licenseCodes[Math.abs(hash) % licenseCodes.length]!;
}

export async function upsertCategory(
  client: Client,
  data: CategorySeed,
  _workspaceId: string,
) {
  const code = demoKey(data.code);
  const existing = await client.aOSMarketplaceCategory.findOne({
    where: {code},
    select: {id: true, version: true},
  });
  const payload = {
    code,
    name: data.name,
  };
  if (existing) {
    return client.aOSMarketplaceCategory.update({
      data: {...payload, id: existing.id, version: existing.version},
      select: {id: true, code: true},
    });
  }
  return client.aOSMarketplaceCategory.create({
    data: payload,
    select: {id: true, code: true},
  });
}

export async function upsertLicense(client: Client, data: LicenseSeed) {
  const code = demoKey(data.code);
  const existing = await client.aOSMarketplaceLicense.findOne({
    where: {code},
    select: {id: true, version: true},
  });
  const payload = {
    code,
    name: data.name,
    url: data.url ?? null,
    description: data.description ?? null,
    isPaid: data.isPaid ?? false,
    sequence: data.sequence ?? 0,
  };
  if (existing) {
    return client.aOSMarketplaceLicense.update({
      data: {...payload, id: existing.id, version: existing.version},
      select: {id: true, code: true},
    });
  }
  return client.aOSMarketplaceLicense.create({
    data: payload,
    select: {id: true, code: true},
  });
}

export async function upsertCompatibilityVersion(
  client: Client,
  data: CompatibilityVersionSeed,
) {
  const name = demoKey(data.name);
  const existing = await client.aOSMarketplaceAxelorVersion.findOne({
    where: {name},
    select: {id: true, version: true},
  });
  const payload = {
    name,
    title: data.title,
    ...(data.releasedOn && {releasedOn: new Date(data.releasedOn)}),
  };
  if (existing) {
    return client.aOSMarketplaceAxelorVersion.update({
      data: {...payload, id: existing.id, version: existing.version},
      select: {id: true, name: true},
    });
  }
  return client.aOSMarketplaceAxelorVersion.create({
    data: payload,
    select: {id: true, name: true},
  });
}

/* Single shared zip used as every seeded version's bundle. Lives next to
 * this script under a STABLE name (independent of DEMO_PREFIX) — like the
 * shared screenshots, only the storage filePath carries the prefix so
 * reset can match it. Changing DEMO_PREFIX never requires renaming this
 * file. */
const BUNDLE_SOURCE_FILE = 'bundle.zip';
const BUNDLE_FILE_PATH = `${DEMO_PREFIX}bundle.zip`;

export async function upsertSharedBundleMetaFile({
  client,
  storage,
}: {
  client: Client;
  storage: string;
}): Promise<string> {
  const sourcePath = path.resolve(__dirname, BUNDLE_SOURCE_FILE);
  const buffer = await fsp.readFile(sourcePath);
  const filePath = BUNDLE_FILE_PATH;
  const fileType = 'application/zip';

  await pipeline(
    Readable.from(buffer),
    fs.createWriteStream(path.resolve(storage, filePath)),
  );

  const payload = {
    fileName: BUNDLE_SOURCE_FILE,
    filePath,
    fileType,
    fileSize: String(buffer.length),
    sizeText: getFileSizeText(buffer.length),
  };
  const existing = await client.aOSMetaFile.findOne({
    where: {filePath},
    select: {id: true, version: true},
  });
  const meta = existing
    ? await client.aOSMetaFile.update({
        data: {...payload, id: existing.id, version: existing.version},
        select: {id: true},
      })
    : await client.aOSMetaFile.create({data: payload, select: {id: true}});
  return meta.id;
}

/* The seed shares two hardcoded screenshot files across every product
 * instead of accepting per-product paths in the JSON. Uploads each file
 * to storage exactly once (deterministic filePath under the
 * SCREENSHOT_PREFIX) and returns the two MetaFile ids; subsequent
 * AOSMarketplaceProductPicture rows just link to these shared ids so a
 * fleet of demo products doesn't bloat the metafile table. */
const SHARED_SCREENSHOT_ASSETS = [
  'pwa/screenshots/desktop-screenshot.png',
  'pwa/screenshots/mobile-screenshot.png',
] as const;

export async function upsertSharedScreenshotMetaFiles({
  client,
  storage,
  publicRoot,
}: {
  client: Client;
  storage: string;
  publicRoot: string;
}): Promise<string[]> {
  const ids: string[] = [];
  for (const assetPath of SHARED_SCREENSHOT_ASSETS) {
    const sourcePath = path.resolve(publicRoot, assetPath);
    const buffer = await fsp.readFile(sourcePath);
    const ext = path.extname(assetPath).toLowerCase();
    const baseName = path.basename(assetPath);
    const filePath = `${SCREENSHOT_PREFIX}-${baseName}`;
    const fileType = MIME_BY_EXT[ext] ?? 'application/octet-stream';

    await pipeline(
      Readable.from(buffer),
      fs.createWriteStream(path.resolve(storage, filePath)),
    );

    const payload = {
      fileName: baseName,
      filePath,
      fileType,
      fileSize: String(buffer.length),
      sizeText: getFileSizeText(buffer.length),
    };
    const existing = await client.aOSMetaFile.findOne({
      where: {filePath},
      select: {id: true, version: true},
    });
    const meta = existing
      ? await client.aOSMetaFile.update({
          data: {...payload, id: existing.id, version: existing.version},
          select: {id: true},
        })
      : await client.aOSMetaFile.create({data: payload, select: {id: true}});
    ids.push(meta.id);
  }
  return ids;
}

/* Replaces all seeded screenshot links for a marketplace product with a
 * fresh set of length `desiredMetaIds.length`. Allowed to repeat the
 * same metafile across rows — the demo intentionally cycles through the
 * same two shared images to vary the per-product screenshot count.
 * Idempotent via blanket-delete-then-create scoped to our
 * SCREENSHOT_PREFIX. */
export async function upsertScreenshots({
  client,
  productId,
  desiredMetaIds,
}: {
  client: Client;
  productId: string;
  /** Ordered list of AOSMetaFile ids to link; duplicates allowed. */
  desiredMetaIds: string[];
}) {
  await client.aOSMarketplaceProductPicture.deleteAll({
    where: {
      marketplaceProduct: {id: productId},
      picture: {filePath: {like: `${SCREENSHOT_PREFIX}-%`}},
    },
  });
  for (const metaId of desiredMetaIds) {
    await client.aOSMarketplaceProductPicture.create({
      data: {
        marketplaceProduct: {select: {id: productId}},
        picture: {select: {id: metaId}},
      },
      select: {id: true},
    });
  }
}

export async function upsertProduct(
  client: Client,
  ctx: WorkspaceContext,
  product: ProductSeed,
  defaultPublisherPartnerId: string,
  licenseCodes: string[] = [],
) {
  const category = await findCategoryByCode(
    client,
    demoKey(product.categoryCode),
  );
  const publisherPartnerId = product.supplierEmail
    ? (await findCustomerPartnerByEmail(client, product.supplierEmail)).id
    : defaultPublisherPartnerId;

  /* Slug carries DEMO_PREFIX like every other seeded key (category/license/
   * compat resolved above). reset.ts matches it by `slug LIKE DEMO_PREFIX%`,
   * and it doubles as the re-run idempotency key. */
  const slug = demoKey(product.slug);
  const existing = await client.aOSMarketplaceProduct.findOne({
    where: {slug},
    select: {id: true, version: true},
  });

  /* Randomly select a license code */
  const selectedLicenseCode = getRandomLicenseCode(product.code, licenseCodes);

  const data: CreateArgs<AOSMarketplaceProduct> = {
    slug,
    name: product.name,
    description: product.description ?? null,
    longDescription: product.longDescription ?? null,
    marketplaceTypeSelect: product.type,
    coverStyle: product.coverStyle,
    iconCode: getRandomIconCode(product.code),
    documentationUrl: product.documentationUrl ?? null,
    supportIssuesUrl: product.supportIssuesUrl ?? null,
    supportContactUrl: product.supportContactUrl ?? null,
    installCount: product.installCount ?? 0,
    averageRating: new BigDecimal('0'),
    ratingCount: 0,
    categorySet: {select: [{id: category.id}]},
    ...(selectedLicenseCode && {
      license: {select: {code: demoKey(selectedLicenseCode)}},
    }),
    salePrice: new BigDecimal(String(product.price)),
    inAti: ctx.defaults.inAti,
    saleCurrency: {select: {id: ctx.defaults.saleCurrencyId}},
    product: {select: {id: ctx.backingProductId}},
    portalWorkspace: {select: {id: ctx.workspaceId}},
    publisher: {select: {id: publisherPartnerId}},
    createdByPartner: {select: {id: publisherPartnerId}},
  };

  if (existing) {
    await client.aOSMarketplaceProduct.update({
      data: {...data, id: existing.id, version: existing.version},
      select: {id: true},
    });
    return {id: existing.id, supplierPartnerId: publisherPartnerId};
  }
  const created = await client.aOSMarketplaceProduct.create({
    data,
    select: {id: true},
  });
  return {id: created.id, supplierPartnerId: publisherPartnerId};
}

export async function upsertVersion({
  client,
  productId,
  version,
  bundleMetaId,
}: {
  client: Client;
  productId: string;
  version: VersionSeed;
  /** Id of the shared bundle MetaFile uploaded once at the top of the
   *  run. Every seeded version reuses the same zip; AOS only needs a
   *  non-null `bundleFile` reference. */
  bundleMetaId: string;
}) {
  const compatIds = await Promise.all(
    (version.compatibilityVersions ?? []).map(name =>
      findCompatibilityVersionByName(client, demoKey(name)).then(row => ({
        id: row.id,
      })),
    ),
  );

  /* Dates flow straight through from the seed file. validate.ts has
   * already enforced "draft → no dates" and "published → both dates,
   * ordered" before we get here, so the AOS values are always coherent. */
  const dateOfSubmission = version.submittedAt
    ? new Date(version.submittedAt)
    : null;
  const dateOfPublish = version.releasedAt
    ? new Date(version.releasedAt)
    : null;

  const parts = parseVersionNumber(version.versionNumber);
  if (!parts) {
    throw new Error(`Invalid version number: ${version.versionNumber}`);
  }

  const existing = await client.aOSMarketplaceProductVersion.findOne({
    where: {
      marketplaceProduct: {id: productId},
      vMajor: parts.vMajor,
      vMinor: parts.vMinor,
      vPatch: parts.vPatch,
      vPreRelease:
        parts.vPreRelease === null ? {eq: null} : {eq: parts.vPreRelease},
    },
    select: {id: true, version: true},
  });

  const data: CreateArgs<AOSMarketplaceProductVersion> = {
    marketplaceProduct: {select: {id: productId}},
    vMajor: parts.vMajor,
    vMinor: parts.vMinor,
    vPatch: parts.vPatch,
    vPreRelease: parts.vPreRelease,
    changelog: version.changelog ?? null,
    statusSelect: version.status,
    dateOfSubmission,
    dateOfPublish,
    bundleFile: {select: {id: bundleMetaId}},
    compatibilitySet: {select: compatIds},
  };

  if (existing) {
    return client.aOSMarketplaceProductVersion.update({
      data: {...data, id: existing.id, version: existing.version},
      select: {id: true, statusSelect: true, dateOfPublish: true},
    });
  }
  return client.aOSMarketplaceProductVersion.create({
    data,
    select: {id: true, statusSelect: true, dateOfPublish: true},
  });
}

/* Promotes the marketplace product's `currentVersion` and `latestVersion`
 * pointers (matches what `saveVersion` does in the live app). */
export async function refreshCurrentVersion(client: Client, productId: string) {
  await syncProductVersionPointers({client, productId});
}

export async function upsertReview({
  client,
  productId,
  authorEmail,
  rating,
  comment,
  reviewedVersionId,
}: {
  client: Client;
  productId: string;
  authorEmail: string;
  rating: number;
  comment?: string;
  reviewedVersionId?: string;
}) {
  const author = await findPartnerByEmail(client, authorEmail);
  const existing = await client.aOSMarketplaceReview.findOne({
    where: {marketplaceProduct: {id: productId}, author: {id: author.id}},
    select: {id: true, version: true},
  });
  const payload = {
    rating,
    reviewComment: comment ?? null,
    ...(reviewedVersionId && {
      reviewedVersion: {select: {id: reviewedVersionId}},
    }),
  };
  if (existing) {
    return client.aOSMarketplaceReview.update({
      data: {...payload, id: existing.id, version: existing.version},
      select: {id: true},
    });
  }
  return client.aOSMarketplaceReview.create({
    data: {
      ...payload,
      marketplaceProduct: {select: {id: productId}},
      author: {select: {id: author.id}},
    },
    select: {id: true},
  });
}

/* Rebuilds (averageRating, ratingCount) from review rows for a set of
 * marketplace products in one raw UPDATE — avoids the read-modify-write
 * race that per-row helpers like `addRating`/`replaceRating` would cause
 * across idempotent re-runs. */
export async function recomputeRatings(client: Client, productIds: string[]) {
  if (productIds.length === 0) return;
  await client.$raw(
    sql`
      UPDATE portal_marketplace_product p
      SET
        average_rating = COALESCE(s.avg, 0),
        rating_count = COALESCE(s.cnt, 0)
      FROM
        (
          SELECT
            marketplace_product AS pid,
            AVG(rating)::numeric(5, 2) AS avg,
            COUNT(*) AS cnt
          FROM
            portal_marketplace_review
          WHERE
            marketplace_product = ANY ($1::BIGINT[])
          GROUP BY
            marketplace_product
        ) s
      WHERE
        p.id = ANY ($1::BIGINT[])
        AND (
          s.pid IS NULL
          OR p.id = s.pid
        )
    `,
    productIds.map(id => Number(id)),
  );
}
