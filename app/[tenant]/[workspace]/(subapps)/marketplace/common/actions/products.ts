'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';
import {clone} from '@/utils';
import {unpackFromFormData} from '@/utils/formdata';
import {BigDecimal} from '@goovee/orm';
import {headers} from 'next/headers';
import {z} from 'zod';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import type {MyProductWithVersions} from '../orm';
import {
  findMyProductWithVersions,
  findProductsBySearch,
  generateUniqueProductSlug,
  resolveNewListingCurrency,
  type ProductSearchResult,
  syncProductImages,
  withMyProductAccessFilter,
} from '../orm';
import {productSchema} from '../ui/components/forms/product-form/validator';
import {ensureAuth} from '../utils/auth-helper';

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

  const {error, message, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error) {
    return {error: true, message};
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
): ActionResponse<{productId: string; version: number}> {
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

  const {error, message, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error) {
    return {error: true, message};
  }
  const {client} = auth.tenant;

  if (!payload.id && !auth.workspace.config.allowToPublish) {
    return {
      error: true,
      message: await t('Publishing is not allowed in this workspace'),
    };
  }

  /* The form supplies marketplace identity + price overrides only. The
   * workspace default Product is fixed per workspace via
   * `PortalAppConfig.defaultProductForMarketplace` (a service product with
   * the right accounting/tax setup). Tax, currency, unit etc. are read
   * from that workspace default Product at checkout time. */
  const productData = {
    name: payload.name,
    description: payload.description ?? null,
    longDescription: payload.longDescription || null,
    marketplaceTypeSelect: payload.marketplaceTypeSelect,
    coverStyle: payload.coverStyle,
    iconCode: payload.iconCode,
    documentationUrl: payload.documentationUrl || null,
    supportIssuesUrl: payload.supportIssuesUrl || null,
    supportContactUrl: payload.supportContactUrl || null,
    license: {select: {id: payload.licenseId}},
    salePrice: new BigDecimal(String(payload.salePrice ?? 0)),
  };

  try {
    let productId: string;
    let productVersion: number;
    if (payload.id) {
      /* Optimistic lock: an edit must carry the version the form was loaded
       * with so a concurrent save by someone else is rejected (goovee-orm
       * throws "Optimistic lock failed") instead of silently overwritten. */
      if (payload.version == null) {
        return {
          error: true,
          message: await t(
            'This product is missing its version. Reload the product and try again.',
          ),
        };
      }
      /* Ownership check fused with the categorySet fetch: the filter only
       * resolves products published by the caller's partner. */
      const current = await client.aOSMarketplaceProduct.findOne({
        where: withMyProductAccessFilter(
          auth.workspace,
          auth.user.mainPartnerId,
        )({id: payload.id}),
        select: {id: true, categorySet: {select: {id: true}}},
      });
      if (!current) {
        return {error: true, message: await t('Product not found')};
      }
      /* m2m: compute add/remove diff so the update applies exactly the
       * requested set without dropping rows that are still selected. */
      const desired = new Set(payload.categoryIds);
      const previous = new Set((current.categorySet ?? []).map(c => c.id));
      const toAdd = [...desired].filter(id => !previous.has(id));
      const toRemove = [...previous].filter(id => !desired.has(id));
      const updated = await client.aOSMarketplaceProduct.update({
        data: {
          id: payload.id,
          /* The client's loaded version — NOT a freshly-fetched one — is
           * what makes the lock meaningful. */
          version: payload.version,
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
      productId = payload.id;
      productVersion = updated.version ?? 0;
    } else {
      const workspaceDefaultProductId =
        auth.workspace.config.defaultProductForMarketplace?.id;
      if (!workspaceDefaultProductId) {
        return {
          error: true,
          message: await t(
            "Marketplace isn't configured for this workspace: missing workspace default product. Contact your admin.",
          ),
        };
      }
      /* Stamp saleCurrency once at create. Same resolver the form uses
       * for its display symbol, so the price the supplier just typed is
       * interpreted in the currency that gets persisted. Never rewritten
       * on edit. */
      const defaultSaleCurrency = await resolveNewListingCurrency({
        client,
        mainPartnerId: auth.user.mainPartnerId,
      });
      if (!defaultSaleCurrency) {
        return {
          error: true,
          message: await t(
            "Marketplace isn't configured: no currency resolvable for new listings. Contact your admin.",
          ),
        };
      }
      const slug = await generateUniqueProductSlug({
        client,
        workspaceId: auth.workspace.id,
        name: payload.name,
      });
      const created = await client.aOSMarketplaceProduct.create({
        select: {id: true},
        data: {
          ...productData,
          slug,
          /* Seed inAti from the workspace default product so the
           * salePrice the user just typed is interpreted in the same
           * basis as that configured product. Admin can flip it
           * later per-MP if needed. */
          inAti:
            auth.workspace.config.defaultProductForMarketplace?.inAti ?? false,
          saleCurrency: {select: {id: defaultSaleCurrency.id}},
          publisher: {select: {id: auth.user.mainPartnerId}},
          createdByPartner: {select: {id: auth.user.id}},
          product: {select: {id: workspaceDefaultProductId}},
          portalWorkspace: {select: {id: auth.workspace.id}},
          categorySet: {
            select: payload.categoryIds.map(id => ({id})),
          },
          averageRating: new BigDecimal('0'),
          ratingCount: 0,
          installCount: 0,
        },
      });
      productId = created.id;
      productVersion = created.version ?? 0;
    }

    await syncProductImages({
      client,
      productId,
      storage: auth.tenant.config.aos.storage,
      images: payload.images,
    });

    return {success: true, data: {productId, version: productVersion}};
  } catch (e) {
    const raw = e instanceof Error ? e.message : '';
    if (raw.includes('Optimistic lock failed')) {
      return {
        error: true,
        message: await t(
          'This product was changed by someone else since you opened it. Reload and reapply your changes.',
        ),
      };
    }
    return {error: true, message: raw || (await t('An error occurred'))};
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
