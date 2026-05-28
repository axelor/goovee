'use server';

import {DEFAULT_CURRENCY_CODE} from '@/constants';
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
  findDefaultCurrency,
  findMyProductWithVersions,
  findPartnerCurrency,
  findProductsBySearch,
  type ProductSearchResult,
  syncProductImages,
} from '../orm';
import {productSchema} from '../ui/components/forms/product-form/validator';
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
    marketplaceLicense: {select: {id: payload.marketplaceLicenseId}},
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
