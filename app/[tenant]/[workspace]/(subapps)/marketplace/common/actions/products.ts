'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';
import {redeemUpload} from '@/lib/core/upload/staged-upload';
import {clone} from '@/utils';
import {unpackFromFormData} from '@/utils/formdata';
import {getTotal} from '@/utils/pagination';
import {BigDecimal} from '@goovee/orm';
import {headers} from 'next/headers';
import {z} from 'zod';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import type {MyProductForEdit, MyProductVersion} from '../orm';
import {
  findMyProductForEdit,
  findMyProductVersions,
  findProductsBySearch,
  generateUniqueProductSlug,
  resolveNewListingCurrency,
  type ProductSearchResult,
  syncProductImages,
  syncProductVersionPointers,
  withMyProductAccessFilter,
} from '../orm';
import {savePayloadSchema} from '../ui/components/product/product-edit/combined-validator';
import {VERSIONS_PAGE_SIZE} from '../ui/components/versions/version-form/validator';
import {ensureAuth} from '../utils/auth-helper';
import {parseVersionNumber} from '../utils/version-number';

const loadMyProductForEditSchema = z.object({
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
});
type LoadMyProductForEditInput = z.infer<typeof loadMyProductForEditSchema>;

export async function loadMyProductForEdit(
  input: LoadMyProductForEditInput,
): ActionResponse<{
  product: Cloned<MyProductForEdit>;
  versions: Cloned<MyProductVersion>[];
  total: number;
}> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }
  const parsed = loadMyProductForEditSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: true,
      message: z.prettifyError(parsed.error),
    };
  }
  const {productId, workspaceURL} = parsed.data;

  const {error, message, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error) {
    return {error: true, message};
  }

  if (!auth.workspace.config.allowToPublish) {
    return {
      error: true,
      message: await t('Publishing is not allowed in this workspace'),
    };
  }

  /* Load the product and its first page of versions together so the edit dialog
   * opens fully populated in one round-trip. Mirrors the full-page editor route. */
  const [product, versions] = await Promise.all([
    findMyProductForEdit({
      productId,
      mainPartnerId: auth.user.mainPartnerId,
      client: auth.tenant.client,
      workspace: auth.workspace,
    }),
    findMyProductVersions({
      productId,
      mainPartnerId: auth.user.mainPartnerId,
      client: auth.tenant.client,
      workspace: auth.workspace,
      skip: 0,
      take: VERSIONS_PAGE_SIZE,
    }),
  ]);
  if (!product) {
    return {error: true, message: await t('Product not found')};
  }
  return {
    success: true,
    data: {
      product: clone(product),
      versions: clone(versions),
      total: getTotal(versions),
    },
  };
}

const searchProductsSchema = z.object({
  search: z.string().min(1).max(200),
  workspaceURL: z.string().min(1),
  type: z.enum(MARKETPLACE_TYPE).optional(),
});

type SearchProductsInput = z.infer<typeof searchProductsSchema>;

export async function searchProducts(
  input: SearchProductsInput,
): ActionResponse<Cloned<ProductSearchResult>[]> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }
  const parsed = searchProductsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: true,
      message: z.prettifyError(parsed.error),
    };
  }
  const {search, workspaceURL, type} = parsed.data;

  const {error, auth} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: true,
  });
  if (error) {
    return {error: true, message: await t('Unauthorized')};
  }

  const products = await findProductsBySearch({
    search,
    type,
    client: auth.tenant.client,
    workspace: auth.workspace,
  });
  return {success: true, data: clone(products)};
}

/**
 * Combined save for the full-page / dialog editor: persists the product and a
 * batch of versions (edited existing rows + newly created ones) in one
 * transaction. Creates the product when no id is sent, edits it otherwise.
 * Upsert-only: versions not in the batch (untouched or unloaded) are never
 * written or deleted; version pointers are recomputed once at the end from the
 * full DB state.
 */
export async function saveProductWithVersions(
  formData: FormData,
): ActionResponse<{productId: string}> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const raw = unpackFromFormData(formData) as Record<string, unknown> & {
    workspaceURL?: string;
  };
  const workspaceURL = raw?.workspaceURL;
  if (!workspaceURL) {
    return {error: true, message: await t('Workspace is required')};
  }
  const {workspaceURL: _workspaceURL, ...rest} = raw;
  /* The editor only sends what changed (see `savePayloadSchema`): `product` is
   * present on create or a product-field edit and absent on a versions-only
   * edit; `images` is present only when the screenshots changed. So an
   * unchanged product / picture set is never re-written — no needless bump of
   * its optimistic-lock version, no false conflict with a concurrent edit. */
  const parsed = savePayloadSchema.safeParse(rest);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const payload = parsed.data;
  const product = payload.product;

  const {error, message, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error) {
    return {error: true, message};
  }
  if (!auth.workspace.config.allowToPublish) {
    return {
      error: true,
      message: await t('Publishing is not allowed in this workspace'),
    };
  }
  const {client} = auth.tenant;
  const requiresReview = auth.workspace.config.requiresReview === true;

  /* Parse every version number up front, map each row's staged status to its
   * effective status (publish → in-review when the workspace requires it), and
   * reject duplicate numbers within the batch itself. */
  const rows = [...payload.versions, ...payload.newVersions];
  const batchKeys = new Set<string>();
  const prepared: {
    row: (typeof rows)[number];
    parts: NonNullable<ReturnType<typeof parseVersionNumber>>;
    effectiveStatus: string;
  }[] = [];
  for (const row of rows) {
    /* The schema already validated the format (VERSION_NUMBER_PATTERN), so this
     * only splits a known-valid string into its columns and never returns null
     * here. */
    const parts = parseVersionNumber(row.versionNumber)!;
    const key = `${parts.vMajor}.${parts.vMinor}.${parts.vPatch}-${parts.vPreRelease ?? ''}`;
    if (batchKeys.has(key)) {
      return {
        error: true,
        message: await t('Two versions in this product share the same number'),
      };
    }
    batchKeys.add(key);
    const effectiveStatus =
      row.statusSelect === MARKETPLACE_VERSION_STATUS.DRAFT
        ? MARKETPLACE_VERSION_STATUS.DRAFT
        : row.statusSelect === MARKETPLACE_VERSION_STATUS.UNPUBLISHED
          ? MARKETPLACE_VERSION_STATUS.UNPUBLISHED
          : requiresReview
            ? MARKETPLACE_VERSION_STATUS.IN_REVIEW
            : MARKETPLACE_VERSION_STATUS.PUBLISHED;
    prepared.push({row, parts, effectiveStatus});
  }

  try {
    /* Assigned the new id in the create branch; carries the given id on edit. */
    let productId = payload.id ?? '';
    await client.$transaction(async txClient => {
      if (payload.id) {
        /* Edit: verify ownership first (always). */
        const current = await txClient.aOSMarketplaceProduct.findOne({
          where: withMyProductAccessFilter(
            auth.workspace,
            auth.user.mainPartnerId,
          )({id: payload.id}),
          select: {id: true, categorySet: {select: {id: true}}},
        });
        if (!current) throw new Error('PRODUCT_NOT_FOUND');
        /* Rewrite the product row only when a product field actually changed —
         * the editor omits the product block on a versions-only save, so it's
         * left untouched (no needless write, no bumped optimistic-lock version,
         * no false conflict with a concurrent product edit). Uses the category
         * m2m diff and the lock the form was loaded with. */
        if (product) {
          if (product.version == null) throw new Error('MISSING_VERSION');
          const productVersion = product.version;
          const desired = new Set(product.categoryIds);
          const previous = new Set(
            (current.categorySet ?? []).map(category => category.id),
          );
          const toAdd = [...desired].filter(id => !previous.has(id));
          const toRemove = [...previous].filter(id => !desired.has(id));
          await txClient.aOSMarketplaceProduct.update({
            data: {
              id: payload.id,
              version: productVersion,
              name: product.name,
              description: product.description ?? null,
              longDescription: product.longDescription || null,
              coverStyle: product.coverStyle,
              iconCode: product.iconCode,
              documentationUrl: product.documentationUrl || null,
              supportIssuesUrl: product.supportIssuesUrl || null,
              supportContactUrl: product.supportContactUrl || null,
              license: {select: {id: product.licenseId}},
              salePrice: new BigDecimal(String(product.salePrice ?? 0)),
              updatedByPartner: {select: {id: auth.user.id}},
              ...(toAdd.length || toRemove.length
                ? {
                    categorySet: {
                      ...(toAdd.length
                        ? {select: toAdd.map(id => ({id}))}
                        : {}),
                      ...(toRemove.length ? {remove: toRemove} : {}),
                    },
                  }
                : {}),
            },
            select: {id: true},
          });
        }
      } else {
        /* Create: the schema requires a product block when there's no id, so a
         * new listing always carries its full fields (and their defaults). Type/
         * slug/currency/inAti/ownership are stamped once and never rewritten on
         * edit. */
        if (!product) throw new Error('MISSING_PRODUCT');
        const workspaceDefaultProductId =
          auth.workspace.config.defaultProductForMarketplace?.id;
        if (!workspaceDefaultProductId) throw new Error('MP_NOT_CONFIGURED');
        const defaultSaleCurrency = await resolveNewListingCurrency({
          client: txClient,
          mainPartnerId: auth.user.mainPartnerId,
        });
        if (!defaultSaleCurrency) throw new Error('NO_CURRENCY');
        const slug = await generateUniqueProductSlug({
          client: txClient,
          workspaceId: auth.workspace.id,
          name: product.name,
        });
        const created = await txClient.aOSMarketplaceProduct.create({
          select: {id: true},
          data: {
            name: product.name,
            description: product.description ?? null,
            longDescription: product.longDescription || null,
            coverStyle: product.coverStyle,
            iconCode: product.iconCode,
            documentationUrl: product.documentationUrl || null,
            supportIssuesUrl: product.supportIssuesUrl || null,
            supportContactUrl: product.supportContactUrl || null,
            license: {select: {id: product.licenseId}},
            salePrice: new BigDecimal(String(product.salePrice ?? 0)),
            marketplaceTypeSelect: product.marketplaceTypeSelect,
            slug,
            inAti:
              auth.workspace.config.defaultProductForMarketplace?.inAti ??
              false,
            saleCurrency: {select: {id: defaultSaleCurrency.id}},
            publisher: {select: {id: auth.user.mainPartnerId}},
            createdByPartner: {select: {id: auth.user.id}},
            product: {select: {id: workspaceDefaultProductId}},
            portalWorkspace: {select: {id: auth.workspace.id}},
            categorySet: {select: product.categoryIds.map(id => ({id}))},
            averageRating: new BigDecimal('0'),
            ratingCount: 0,
            installCount: 0,
          },
        });
        productId = created.id;
      }

      /* Reconcile screenshots only when they changed — the editor omits the
       * `images` list otherwise, so a versions-only or product-only save won't
       * re-sequence (and re-version) every picture. An empty list is still sent
       * when the user clears all screenshots, so it reconciles to none. */
      if (payload.images !== undefined) {
        await syncProductImages({
          client: txClient,
          productId,
          owner: auth.user.id,
          images: payload.images,
        });
      }

      for (const {row, parts, effectiveStatus} of prepared) {
        /* No other version of this product may hold the same number. */
        const duplicate = await txClient.aOSMarketplaceProductVersion.findOne({
          where: {
            marketplaceProduct: {id: productId},
            vMajor: parts.vMajor,
            vMinor: parts.vMinor,
            vPatch: parts.vPatch,
            vPreRelease:
              parts.vPreRelease === null ? {eq: null} : {eq: parts.vPreRelease},
            ...(row.id ? {id: {ne: row.id}} : {}),
          },
          select: {id: true},
        });
        if (duplicate) throw new Error('DUP_VERSION');

        /* Redeem the pre-staged bundle (when the row carries a token) to its
         * meta_file id. Runs inside this transaction, so a later throw rolls
         * the single-use consume back and the token stays valid for retry. */
        let uploadedFileId: string | null = null;
        if (row.bundleToken) {
          uploadedFileId = await redeemUpload({
            token: row.bundleToken,
            purpose: 'marketplace:bundle',
            owner: auth.user.id,
            client: txClient,
          });
        }
        const compatibilityRefs = row.compatibilitySetIds.map(id => ({id}));

        if (row.id) {
          const currentVersion =
            await txClient.aOSMarketplaceProductVersion.findOne({
              where: {id: row.id},
              select: {
                id: true,
                version: true,
                statusSelect: true,
                dateOfPublish: true,
                compatibilitySet: {select: {id: true}},
              },
            });
          if (!currentVersion) throw new Error('VERSION_NOT_FOUND');
          /* A live version can't be demoted straight to draft — it must be
           * unpublished first. The UI never offers Draft for these states, so
           * this guards against a stale/forged request only. */
          if (
            effectiveStatus === MARKETPLACE_VERSION_STATUS.DRAFT &&
            (currentVersion.statusSelect ===
              MARKETPLACE_VERSION_STATUS.PUBLISHED ||
              currentVersion.statusSelect ===
                MARKETPLACE_VERSION_STATUS.IN_REVIEW)
          ) {
            throw new Error('INVALID_TRANSITION');
          }
          const existingCompatibilityIds = (
            currentVersion.compatibilitySet ?? []
          ).map(compatibility => compatibility.id);
          const compatibilityIdsToRemove = existingCompatibilityIds.filter(
            id => !compatibilityRefs.find(({id: newId}) => newId === id),
          );
          /* Stamp `dateOfPublish` only the first time it goes live. */
          const transitioningToPublished =
            effectiveStatus === MARKETPLACE_VERSION_STATUS.PUBLISHED &&
            currentVersion.statusSelect !==
              MARKETPLACE_VERSION_STATUS.PUBLISHED &&
            !currentVersion.dateOfPublish;
          await txClient.aOSMarketplaceProductVersion.update({
            select: {id: true},
            data: {
              id: row.id,
              /* Optimistic-lock against the version the form was loaded with, so
               * a concurrent edit to this row is rejected ('Optimistic lock
               * failed' → conflict message) rather than silently overwritten.
               * Falls back to the in-txn value only if the client omitted it. */
              version: row.version ?? currentVersion.version,
              vMajor: parts.vMajor,
              vMinor: parts.vMinor,
              vPatch: parts.vPatch,
              vPreRelease: parts.vPreRelease,
              changelog: row.changelog || null,
              statusSelect: effectiveStatus,
              ...(transitioningToPublished && {dateOfPublish: new Date()}),
              ...(uploadedFileId && {
                bundleFile: {select: {id: uploadedFileId}},
              }),
              compatibilitySet: {
                ...(existingCompatibilityIds.length && {
                  remove: compatibilityIdsToRemove,
                }),
                ...(compatibilityRefs.length && {select: compatibilityRefs}),
              },
            },
          });
        } else {
          /* The schema requires a bundle token on every new row (no id), so the
           * redeem above always ran and produced an id. */
          await txClient.aOSMarketplaceProductVersion.create({
            select: {id: true},
            data: {
              vMajor: parts.vMajor,
              vMinor: parts.vMinor,
              vPatch: parts.vPatch,
              vPreRelease: parts.vPreRelease,
              changelog: row.changelog || null,
              statusSelect: effectiveStatus,
              bundleFile: {select: {id: uploadedFileId!}},
              compatibilitySet: {select: compatibilityRefs},
              marketplaceProduct: {select: {id: productId}},
              dateOfSubmission: new Date(),
              ...(effectiveStatus === MARKETPLACE_VERSION_STATUS.PUBLISHED && {
                dateOfPublish: new Date(),
              }),
            },
          });
        }
      }

      /* Recompute current/latest once from the full DB state — correct no
       * matter how many rows changed status (incl. bulk unpublish). Only needed
       * when versions actually changed; a product-only edit leaves the pointers
       * (and the product row) untouched. */
      if (rows.length > 0) {
        await syncProductVersionPointers({client: txClient, productId});
      }
    });

    return {success: true, data: {productId}};
  } catch (caughtError) {
    const errorMessage =
      caughtError instanceof Error ? caughtError.message : '';
    /* The ORM throws "optimistic lock on entity X failed, version N was
     * expected, …"; match that phrasing. */
    if (/optimistic lock/i.test(errorMessage)) {
      return {
        error: true,
        message: await t(
          'This product was changed by someone else since you opened it. Reload and reapply your changes.',
        ),
      };
    }
    if (errorMessage === 'Upload not redeemable') {
      return {
        error: true,
        message: await t(
          'An uploaded file is no longer available. Re-select your screenshots and bundle, then save again.',
        ),
      };
    }
    if (errorMessage === 'DUP_VERSION') {
      return {
        error: true,
        message: await t('A version with this number already exists'),
      };
    }
    if (errorMessage === 'INVALID_TRANSITION') {
      return {
        error: true,
        message: await t(
          'A published or in-review version cannot be saved as a draft. Unpublish it first.',
        ),
      };
    }
    if (errorMessage === 'PRODUCT_NOT_FOUND') {
      return {error: true, message: await t('Product not found')};
    }
    if (errorMessage === 'MISSING_PRODUCT') {
      return {
        error: true,
        message: await t(
          'Product details are required when creating a listing. Reload and try again.',
        ),
      };
    }
    if (errorMessage === 'MISSING_VERSION') {
      return {
        error: true,
        message: await t(
          'This product is missing its version. Reload the product and try again.',
        ),
      };
    }
    if (errorMessage === 'MP_NOT_CONFIGURED') {
      return {
        error: true,
        message: await t(
          "Marketplace isn't configured for this workspace: missing workspace default product. Contact your admin.",
        ),
      };
    }
    if (errorMessage === 'NO_CURRENCY') {
      return {
        error: true,
        message: await t(
          "Marketplace isn't configured: no currency resolvable for new listings. Contact your admin.",
        ),
      };
    }
    if (errorMessage === 'VERSION_NOT_FOUND') {
      return {error: true, message: await t('Version not found')};
    }
    return {
      error: true,
      message: errorMessage || (await t('An error occurred')),
    };
  }
}
