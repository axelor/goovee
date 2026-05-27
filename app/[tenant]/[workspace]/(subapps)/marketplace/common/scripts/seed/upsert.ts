import type {Client} from '@/goovee/.generated/client';
import type {
  AOSMarketplaceProductVersion,
  AOSProduct,
} from '@/goovee/.generated/models';
import {getFileSizeText} from '@/utils/files';
import {sql} from '@/utils/template-string';
import {BigDecimal, type CreateArgs} from '@goovee/orm';
import {MARKETPLACE_ICONS} from '../../constants/icons';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {syncProductVersionPointers} from '../../orm/versions';
import {slugify} from '../../utils/slugify';
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
  ProductSeed,
  VersionSeed,
} from './validators';

export type WorkspaceContext = {
  workspaceId: string;
  supplierPartnerId: string;
  defaults: {
    unitId: string;
    productFamilyId: string;
    inAti: boolean;
  };
};

const SCREENSHOT_PREFIX = 'mkt-demo-screenshot';
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

export async function upsertCategory(
  client: Client,
  data: CategorySeed,
  workspaceId: string,
) {
  const existing = await client.aOSProductCategory.findOne({
    where: {code: data.code},
    select: {id: true, version: true},
  });
  const payload = {
    code: data.code,
    name: data.name,
    /* `slug` is derived from the name (lower-kebab) so the URL surface
     * for category pages stays readable. AOS doesn't enforce a unique
     * constraint, but two categories with the same slug would collide
     * downstream so the seed-validator would catch that case. */
    slug: slugify(data.name),
    forMarketPlace: true,
    iconCode: data.iconCode ?? null,
    colorTheme: data.colorTheme ?? null,
    /* Scope the category to the workspace passed via --workspace. The
     * marketplace's category-access filter already keys off this. */
    portalWorkspace: {select: {id: workspaceId}},
  };
  if (existing) {
    return client.aOSProductCategory.update({
      data: {...payload, id: existing.id, version: existing.version},
      select: {id: true, code: true},
    });
  }
  return client.aOSProductCategory.create({
    data: payload,
    select: {id: true, code: true},
  });
}

export async function upsertCompatibilityVersion(
  client: Client,
  data: CompatibilityVersionSeed,
) {
  const existing = await client.aOSMarketplaceAxelorVersion.findOne({
    where: {name: data.name},
    select: {id: true, version: true},
  });
  const payload = {
    name: data.name,
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

/* Single shared zip used as every seeded version's bundle. Lives next
 * to this script so the data file doesn't have to carry per-version
 * paths. Uploaded once per run to deterministic `mkt-demo-bundle.zip`
 * filePath under tenant storage. */
const SHARED_BUNDLE_FILENAME = 'mkt-demo-bundle.zip';

export async function upsertSharedBundleMetaFile({
  client,
  storage,
}: {
  client: Client;
  storage: string;
}): Promise<string> {
  const sourcePath = path.resolve(__dirname, SHARED_BUNDLE_FILENAME);
  const buffer = await fsp.readFile(sourcePath);
  const filePath = SHARED_BUNDLE_FILENAME;
  const fileType = 'application/zip';

  await pipeline(
    Readable.from(buffer),
    fs.createWriteStream(path.resolve(storage, filePath)),
  );

  const payload = {
    fileName: SHARED_BUNDLE_FILENAME,
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
 * AOSProductPicture rows just link to these shared ids so a fleet of
 * demo products doesn't bloat the metafile table. */
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

/* Replaces all seeded screenshot links for a product with a fresh set
 * of length `desiredMetaIds.length`. Allowed to repeat the same metafile
 * across rows — the demo intentionally cycles through the same two
 * shared images to vary the per-product screenshot count. Idempotent
 * via blanket-delete-then-create scoped to our SCREENSHOT_PREFIX. */
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
  await client.aOSProductPicture.deleteAll({
    where: {
      product: {id: productId},
      picture: {filePath: {like: `${SCREENSHOT_PREFIX}-%`}},
    },
  });
  for (const metaId of desiredMetaIds) {
    await client.aOSProductPicture.create({
      data: {
        product: {select: {id: productId}},
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
  defaultSupplierPartnerId: string,
  saleCurrencyId: string,
) {
  const category = await findCategoryByCode(client, product.categoryCode);
  const supplierPartnerId = product.supplierEmail
    ? (await findCustomerPartnerByEmail(client, product.supplierEmail)).id
    : defaultSupplierPartnerId;

  const slug = product.slug;

  const existing = await client.aOSProduct.findOne({
    where: {code: product.code},
    select: {id: true, version: true},
  });

  const data = {
    // TODO: revisit how dtype should be populated.
    // base_product.dtype is the single-table inheritance discriminator
    // and is NOT NULL at the DB level. AOS uses 'Product' for plain
    // products and 'ProductCompany' for per-company overlays; we
    // hardcode 'Product' here, but ideally goovee ORM would default it
    // from the schema entity name.
    dtype: 'Product',
    code: product.code,
    slug,
    name: product.name,
    /* AOS computes `fullName` as `[code] name` in ProductBaseRepository.save();
     * goovee writes bypass that hook, so we have to set it explicitly. */
    fullName: `[${product.code}] ${product.name}`,
    description: product.description ?? null,
    longDescription: product.longDescription ?? null,
    marketplaceTypeSelect: product.type,
    marketplaceCoverStyle: product.coverStyle,
    marketplaceIconCode: getRandomIconCode(product.code),
    documentationUrl: product.documentationUrl ?? null,
    supportIssuesUrl: product.supportIssuesUrl ?? null,
    supportContactUrl: product.supportContactUrl ?? null,
    installCount: product.installCount ?? 0,
    averageRating: new BigDecimal('0'),
    ratingCount: 0,
    productCategory: {select: {id: category.id}},
    salePrice: new BigDecimal(String(product.price)),
    saleCurrency: {select: {id: saleCurrencyId}},
    unit: {select: {id: ctx.defaults.unitId}},
    productFamily: {select: {id: ctx.defaults.productFamilyId}},
    inAti: ctx.defaults.inAti,
    productTypeSelect: 'service',
    sellable: true,
    purchasable: false,
    isMarketPlace: true,
    portalWorkspace: {select: {id: ctx.workspaceId}},
    defaultSupplierPartner: {select: {id: supplierPartnerId}},
  } satisfies CreateArgs<AOSProduct>;

  if (existing) {
    await client.aOSProduct.update({
      data: {...data, id: existing.id, version: existing.version},
      select: {id: true},
    });
    return {id: existing.id, supplierPartnerId};
  }
  const created = await client.aOSProduct.create({
    data,
    select: {id: true},
  });
  return {id: created.id, supplierPartnerId};
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
      findCompatibilityVersionByName(client, name).then(row => ({id: row.id})),
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
      product: {id: productId},
      vMajor: parts.vMajor,
      vMinor: parts.vMinor,
      vPatch: parts.vPatch,
      vPreRelease:
        parts.vPreRelease === null ? {eq: null} : {eq: parts.vPreRelease},
    },
    select: {id: true, version: true},
  });

  const data = {
    product: {select: {id: productId}},
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
  } satisfies CreateArgs<AOSMarketplaceProductVersion>;

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

/* Promotes the product's `currentVersion` and `latestVersion` pointers
 * (matches what `saveVersion` does in the live app). */
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
    where: {product: {id: productId}, author: {id: author.id}},
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
      product: {select: {id: productId}},
      author: {select: {id: author.id}},
    },
    select: {id: true},
  });
}

/* Rebuilds (averageRating, ratingCount) from review rows for a set of
 * products in one raw UPDATE — avoids the read-modify-write race that
 * per-row helpers like `addRating`/`replaceRating` would cause across
 * idempotent re-runs. */
export async function recomputeRatings(client: Client, productIds: string[]) {
  if (productIds.length === 0) return;
  await client.$raw(
    sql`
      UPDATE base_product p
      SET
        average_rating = COALESCE(s.avg, 0),
        rating_count = COALESCE(s.cnt, 0)
      FROM
        (
          SELECT
            product AS pid,
            AVG(rating)::numeric(5, 2) AS avg,
            COUNT(*) AS cnt
          FROM
            portal_marketplace_review
          WHERE
            product = ANY ($1::BIGINT[])
          GROUP BY
            product
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
