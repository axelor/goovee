'use server';

import {DEFAULT_CURRENCY_CODE} from '@/constants';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import type {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';
import {clone} from '@/utils';
import {unpackFromFormData, zodSafeParseFormData} from '@/utils/formdata';
import {BigDecimal} from '@goovee/orm';
import fs from 'fs';
import {headers} from 'next/headers';
import {z} from 'zod';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import type {MyProductWithVersions} from '../orm';
import {
  findDefaultCurrency,
  findMyProductWithVersions,
  findNewestPublishedVersion,
  findPartnerCurrency,
  findProductsBySearch,
  findPublishedAlternateVersions,
  type ProductSearchResult,
  syncProductImages,
  updateProductCurrentVersion,
  updateVersionStatus,
  uploadBundle,
} from '../orm';
import {productSchema} from '../ui/components/forms/product-form/validator';
import {
  MAX_BUNDLE_SIZE,
  versionSchema,
} from '../ui/components/forms/version-form/validator';
import {ensureAuth} from '../utils/auth-helper';
import {slugify} from '../utils/slugify';

const loadMyProductForEditSchema = z.object({
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
});
type LoadMyProductForEditInput = z.infer<typeof loadMyProductForEditSchema>;

export async function loadMyProductForEdit(
  input: LoadMyProductForEditInput,
): ActionResponse<Cloned<MyProductWithVersions>> {
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

  const {error, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const product = await findMyProductWithVersions({
    productId,
    mainPartnerId: auth.user.mainPartnerId,
    client: auth.tenant.client,
    workspace: auth.workspace,
  });
  if (!product) {
    return {error: true, message: await t('Product not found')};
  }
  return {success: true, data: clone(product)};
}

export async function saveProduct(
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
  const {workspaceURL: _, ...rest} = raw;
  const parsed = productSchema.safeParse(rest);
  if (!parsed.success) {
    return {
      error: true,
      message: z.prettifyError(parsed.error),
    };
  }
  const payload = parsed.data;

  const {error, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const {client} = auth.tenant;

  if (!payload.id && !auth.workspace.config.allowToPublish) {
    return {
      error: true,
      message: await t('Publishing is not allowed in this workspace'),
    };
  }

  if (payload.id) {
    const existing = await findMyProductWithVersions({
      productId: payload.id,
      mainPartnerId: auth.user.mainPartnerId,
      client,
      workspace: auth.workspace,
    });
    if (!existing) {
      return {error: true, message: await t('Product not found')};
    }
  }

  const priceDefaults = {
    unit: auth.workspace.config.marketplaceDefaultUnit,
    productFamily: auth.workspace.config.marketplaceDefaultProductFamily,
    inAti: auth.workspace.config.marketplaceInAti === true,
  };

  const productData = {
    name: payload.name,
    description: payload.description ?? null,
    longDescription: payload.longDescription || null,
    marketplaceTypeSelect: payload.marketplaceTypeSelect,
    marketplaceCoverStyle: payload.marketplaceCoverStyle,
    marketplaceIconCode: payload.marketplaceIconCode,
    documentationUrl: payload.documentationUrl || null,
    supportIssuesUrl: payload.supportIssuesUrl || null,
    supportContactUrl: payload.supportContactUrl || null,
    productCategory: {select: {id: payload.productCategoryId}},
    salePrice: new BigDecimal(String(payload.salePrice ?? 0)),
  };

  try {
    let productId: string;
    if (payload.id) {
      const current = await client.aOSProduct.findOne({
        where: {id: payload.id},
        select: {id: true, version: true},
      });
      if (!current) {
        return {error: true, message: await t('Product not found')};
      }
      await client.aOSProduct.update({
        data: {
          id: payload.id,
          version: current.version,
          ...productData,
          marketplaceUpdatedBy: {select: {id: auth.user.id}},
        },
        select: {id: true},
      });
      productId = payload.id;
    } else {
      if (!priceDefaults.unit?.id || !priceDefaults.productFamily?.id) {
        return {
          error: true,
          message: await t(
            "Marketplace pricing isn't configured for this workspace. Contact your admin.",
          ),
        };
      }
      /* saleCurrency is stamped at creation only and never rewritten on
       * later updates — historical products must keep showing the price
       * in the currency they were created with, even if the publisher's
       * partner currency later changes. Resolution order:
       *   1. publisher's partner currency
       *   2. AOS currency matching DEFAULT_CURRENCY_CODE */
      const partnerCurrency = await findPartnerCurrency({
        client,
        mainPartnerId: auth.user.mainPartnerId,
      });
      let saleCurrencyId = partnerCurrency?.id ?? null;
      if (!saleCurrencyId) {
        const defaultCurrency = await findDefaultCurrency(client);
        saleCurrencyId = defaultCurrency?.id ?? null;
      }
      if (!saleCurrencyId) {
        return {
          error: true,
          message: await t(
            "No currency is configured for this publisher and the fallback currency '{0}' is missing in AOS.",
            DEFAULT_CURRENCY_CODE,
          ),
        };
      }
      const code = `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const slug = slugify(payload.name);
      const created = await client.aOSProduct.create({
        select: {id: true},
        data: {
          ...productData,
          // TODO: revisit — base_product.dtype is NOT NULL and goovee
          // doesn't default it from the schema entity name; hardcoded
          // here so creates don't fail with a constraint violation.
          dtype: 'Product',
          code,
          slug,
          fullName: `[${code}] ${payload.name}`,
          isMarketPlace: true,
          portalWorkspace: {select: {id: auth.workspace.id}},
          defaultSupplierPartner: {select: {id: auth.user.mainPartnerId}},
          marketplaceCreatedBy: {select: {id: auth.user.id}},
          saleCurrency: {select: {id: saleCurrencyId}},
          unit: {select: {id: priceDefaults.unit.id}},
          productFamily: {select: {id: priceDefaults.productFamily.id}},
          inAti: priceDefaults.inAti,
          productTypeSelect: 'service',
          sellable: true,
          purchasable: false,
          averageRating: new BigDecimal('0'),
          ratingCount: 0,
          installCount: 0,
        },
      });
      productId = created.id;
    }

    await syncProductImages({
      client,
      productId,
      storage: auth.tenant.config.aos.storage,
      keepImageIds: payload.existingImageIds,
      newImages: payload.newImages,
    });

    return {success: true, data: {productId}};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : await t('An error occurred');
    return {error: true, message};
  }
}

export async function saveVersion(
  formData: FormData,
): ActionResponse<{versionId: string}> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const parsed = zodSafeParseFormData(
    formData,
    versionSchema.safeExtend({workspaceURL: z.string().min(1)}),
  );
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const payload = parsed.data;

  const {error, auth} = await ensureAuth(payload.workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const {client} = auth.tenant;

  if (!payload.id && !auth.workspace.config.allowToPublish) {
    return {
      error: true,
      message: await t('Publishing is not allowed in this workspace'),
    };
  }

  if (payload.bundleFile && payload.bundleFile.size > MAX_BUNDLE_SIZE) {
    return {error: true, message: await t('Bundle exceeds 20 MB limit')};
  }

  const existingProduct = await findMyProductWithVersions({
    productId: payload.productId,
    mainPartnerId: auth.user.mainPartnerId,
    client,
    workspace: auth.workspace,
  });
  if (!existingProduct) {
    return {error: true, message: await t('Product not found')};
  }

  const tenant = await manager.getTenant(tenantId);
  const storage = tenant?.config.aos.storage;
  if (!storage) {
    return {error: true, message: await t('Storage not configured')};
  }
  if (!fs.existsSync(storage)) fs.mkdirSync(storage, {recursive: true});

  const effectiveStatus =
    payload.statusSelect === MARKETPLACE_VERSION_STATUS.DRAFT
      ? MARKETPLACE_VERSION_STATUS.DRAFT
      : auth.workspace.config.requiresReview
        ? MARKETPLACE_VERSION_STATUS.IN_REVIEW
        : MARKETPLACE_VERSION_STATUS.PUBLISHED;

  try {
    let uploadedFileId: string | null = null;
    if (payload.bundleFile) {
      uploadedFileId = await uploadBundle(payload.bundleFile, storage, client);
    }

    const compatRefs = payload.compatibilitySetIds.map(id => ({id}));
    let versionId: string;

    if (payload.id) {
      const current = await client.aOSMarketplaceProductVersion.findOne({
        where: {id: payload.id},
        select: {
          id: true,
          version: true,
          statusSelect: true,
          compatibilitySet: {select: {id: true}},
        },
      });
      if (!current) {
        return {error: true, message: await t('Version not found')};
      }
      if (payload.statusSelect === MARKETPLACE_VERSION_STATUS.DRAFT) {
        if (current.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED) {
          return {
            error: true,
            message: await t(
              'A published version cannot be saved as a draft. Unpublish it first.',
            ),
          };
        }
        if (current.statusSelect === MARKETPLACE_VERSION_STATUS.IN_REVIEW) {
          return {
            error: true,
            message: await t(
              'An in-review version cannot be saved as a draft. Unpublish it first.',
            ),
          };
        }
      }
      const existingCompat = (current.compatibilitySet ?? []).map(c => c.id);
      const toRemove = existingCompat.filter(
        id => !compatRefs.find(({id: newId}) => newId === id),
      );
      await client.aOSMarketplaceProductVersion.update({
        select: {id: true},
        data: {
          id: payload.id,
          version: current.version,
          versionNumber: payload.versionNumber,
          changelog: payload.changelog || null,
          statusSelect: effectiveStatus,
          ...(uploadedFileId && {
            bundleFile: {select: {id: uploadedFileId}},
          }),
          compatibilitySet: {
            ...(existingCompat.length && {remove: toRemove}),
            ...(compatRefs.length && {select: compatRefs}),
          },
        },
      });
      versionId = payload.id;
    } else {
      if (!uploadedFileId) {
        return {error: true, message: await t('Bundle file is required')};
      }
      const created = await client.aOSMarketplaceProductVersion.create({
        select: {id: true},
        data: {
          versionNumber: payload.versionNumber,
          changelog: payload.changelog || null,
          statusSelect: effectiveStatus,
          bundleFile: {select: {id: uploadedFileId}},
          compatibilitySet: {select: compatRefs},
          product: {select: {id: payload.productId}},
          dateOfSubmission: new Date(),
          ...(effectiveStatus === MARKETPLACE_VERSION_STATUS.PUBLISHED && {
            dateOfApproval: new Date(),
          }),
        },
      });
      versionId = created.id;
    }

    //BUG: this whole process is broken. We need to let the user choose which
    //version to promote as the current version.
    const publishedNewest = await findNewestPublishedVersion({
      client,
      productId: payload.productId,
    });
    if (publishedNewest) {
      const productNow = await client.aOSProduct.findOne({
        where: {id: payload.productId},
        select: {id: true, version: true},
      });
      if (productNow) {
        await updateProductCurrentVersion({
          client,
          productId: payload.productId,
          version: productNow.version,
          currentVersionId: publishedNewest.id,
        });
      }
    }

    return {success: true, data: {versionId}};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : await t('An error occurred');
    return {error: true, message};
  }
}

const unpublishVersionSchema = z.object({
  versionId: z.string().min(1),
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
  newCurrentVersionId: z.string().min(1).optional(),
});

type UnpublishVersionInput = z.infer<typeof unpublishVersionSchema>;

export async function unpublishVersion(
  input: UnpublishVersionInput,
): ActionResponse<true> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }
  const parsed = unpublishVersionSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {versionId, productId, workspaceURL, newCurrentVersionId} = parsed.data;

  const {error, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const {client} = auth.tenant;

  const owned = await findMyProductWithVersions({
    productId,
    mainPartnerId: auth.user.mainPartnerId,
    client,
    workspace: auth.workspace,
  });
  if (!owned) {
    return {error: true, message: await t('Product not found')};
  }

  const current = await client.aOSMarketplaceProductVersion.findOne({
    where: {id: versionId, product: {id: productId}},
    select: {id: true, version: true, statusSelect: true},
  });
  if (!current) {
    return {error: true, message: await t('Version not found')};
  }
  if (
    current.statusSelect !== MARKETPLACE_VERSION_STATUS.PUBLISHED &&
    current.statusSelect !== MARKETPLACE_VERSION_STATUS.IN_REVIEW
  ) {
    return {
      error: true,
      message: await t(
        'Only published or in-review versions can be unpublished',
      ),
    };
  }

  const isCurrent = owned.currentVersion?.id === versionId;
  let promotedId: string | undefined;
  if (isCurrent) {
    const alternates = await findPublishedAlternateVersions({
      client,
      productId,
      excludeVersionId: versionId,
    });
    if (alternates.length > 0) {
      if (!newCurrentVersionId) {
        return {
          error: true,
          message: await t('Pick a version to promote as the current version'),
        };
      }
      if (!alternates.some(v => v.id === newCurrentVersionId)) {
        return {
          error: true,
          message: await t(
            'Replacement must be another published version of this product',
          ),
        };
      }
      promotedId = newCurrentVersionId;
    }
  }

  try {
    await updateVersionStatus({
      client,
      versionId: current.id,
      version: current.version,
      statusSelect: MARKETPLACE_VERSION_STATUS.UNPUBLISHED,
    });

    if (promotedId) {
      const productNow = await client.aOSProduct.findOne({
        where: {id: productId},
        select: {id: true, version: true},
      });
      if (productNow) {
        await updateProductCurrentVersion({
          client,
          productId,
          version: productNow.version,
          currentVersionId: promotedId,
        });
      }
    }

    return {success: true, data: true};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : await t('An error occurred');
    return {error: true, message};
  }
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
