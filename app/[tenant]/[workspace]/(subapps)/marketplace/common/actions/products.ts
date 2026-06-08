'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';
import {clone} from '@/utils';
import {unpackFromFormData} from '@/utils/formdata';
import {BigDecimal} from '@goovee/orm';
import fs from 'fs';
import {headers} from 'next/headers';
import {z} from 'zod';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import type {MyProductForEdit} from '../orm';
import {
  findMyProductForEdit,
  findProductsBySearch,
  generateUniqueProductSlug,
  resolveNewListingCurrency,
  type ProductSearchResult,
  syncProductImages,
  syncProductVersionPointers,
  uploadBundle,
  withMyProductAccessFilter,
} from '../orm';
import {combinedEditSchema} from '../ui/components/product/product-edit/combined-validator';
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

  const product = await findMyProductForEdit({
    productId,
    mainPartnerId: auth.user.mainPartnerId,
    client: auth.tenant.client,
    workspace: auth.workspace,
  });
  if (!product) {
    return {error: true, message: await t('Product not found')};
  }
  return {success: true, data: {product: clone(product)}};
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
  const parsed = combinedEditSchema.safeParse(rest);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const payload = parsed.data;

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

  const storage = auth.tenant.config.aos.storage;
  if (!storage) {
    return {error: true, message: await t('Storage not configured')};
  }
  if (!fs.existsSync(storage)) fs.mkdirSync(storage, {recursive: true});

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

  const productData = {
    name: payload.name,
    description: payload.description ?? null,
    longDescription: payload.longDescription || null,
    coverStyle: payload.coverStyle,
    iconCode: payload.iconCode,
    documentationUrl: payload.documentationUrl || null,
    supportIssuesUrl: payload.supportIssuesUrl || null,
    supportContactUrl: payload.supportContactUrl || null,
    license: {select: {id: payload.licenseId}},
    salePrice: new BigDecimal(String(payload.salePrice ?? 0)),
  };

  try {
    /* Assigned the new id in the create branch; carries the given id on edit. */
    let productId = payload.id ?? '';
    await client.$transaction(async txClient => {
      if (payload.id) {
        /* Edit: ownership-checked update with the category m2m diff and the
         * optimistic lock the form was loaded with. */
        if (payload.version == null) throw new Error('MISSING_VERSION');
        const productVersion = payload.version;
        const current = await txClient.aOSMarketplaceProduct.findOne({
          where: withMyProductAccessFilter(
            auth.workspace,
            auth.user.mainPartnerId,
          )({id: payload.id}),
          select: {id: true, categorySet: {select: {id: true}}},
        });
        if (!current) throw new Error('PRODUCT_NOT_FOUND');
        const desired = new Set(payload.categoryIds);
        const previous = new Set(
          (current.categorySet ?? []).map(category => category.id),
        );
        const toAdd = [...desired].filter(id => !previous.has(id));
        const toRemove = [...previous].filter(id => !desired.has(id));
        await txClient.aOSMarketplaceProduct.update({
          data: {
            id: payload.id,
            version: productVersion,
            ...productData,
            updatedByPartner: {select: {id: auth.user.id}},
            ...(toAdd.length || toRemove.length
              ? {
                  categorySet: {
                    ...(toAdd.length ? {select: toAdd.map(id => ({id}))} : {}),
                    ...(toRemove.length ? {remove: toRemove} : {}),
                  },
                }
              : {}),
          },
          select: {id: true},
        });
      } else {
        /* Create: mirror the standalone product create — type, slug, currency,
         * inAti and ownership are stamped once and never rewritten on edit. */
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
          name: payload.name,
        });
        const created = await txClient.aOSMarketplaceProduct.create({
          select: {id: true},
          data: {
            ...productData,
            marketplaceTypeSelect: payload.marketplaceTypeSelect,
            slug,
            inAti:
              auth.workspace.config.defaultProductForMarketplace?.inAti ??
              false,
            saleCurrency: {select: {id: defaultSaleCurrency.id}},
            publisher: {select: {id: auth.user.mainPartnerId}},
            createdByPartner: {select: {id: auth.user.id}},
            product: {select: {id: workspaceDefaultProductId}},
            portalWorkspace: {select: {id: auth.workspace.id}},
            categorySet: {select: payload.categoryIds.map(id => ({id}))},
            averageRating: new BigDecimal('0'),
            ratingCount: 0,
            installCount: 0,
          },
        });
        productId = created.id;
      }

      await syncProductImages({
        client: txClient,
        productId,
        storage,
        images: payload.images,
      });

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

        let uploadedFileId: string | null = null;
        if (row.bundleFile) {
          uploadedFileId = await uploadBundle(
            row.bundleFile,
            storage,
            txClient,
          );
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
          /* The schema requires a bundle on every new row (no id), so the
           * upload above always ran and produced an id. */
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
       * matter how many rows changed status (incl. bulk unpublish). */
      await syncProductVersionPointers({client: txClient, productId});
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
