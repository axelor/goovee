'use server';

import type {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {after} from 'next/server';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {getLoginURL} from '@/utils/url';

// ---- LOCAL IMPORTS ---- //
import {ensureAuth} from '../utils/auth-helper';
import {
  findProductAccess,
  findProductsBySearch,
  type ProductSearchResult,
  recordPurchases,
  attachInvoiceToPurchases,
} from '../orm/orm';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import {getPaymentInfo} from '../utils/payment-info';
import {validateCart} from './cart-validation';
import {createMarketplaceOrder, findInvoiceBySaleOrderId} from '../service';
import {markPaymentAsProcessed} from '@/payment/common/orm';
import {PaymentOption} from '@/types';
import {getPaymentModeId} from '@/utils/payment';
import {WorkspaceURLSchema} from '@/utils/validators';

import fs from 'fs';
import {manager} from '@/tenant';
import {clone} from '@/utils';
import {zodSafeParseFormData} from '@/utils/formdata';
import type {Cloned} from '@/types/util';
import {
  findMyProductWithVersions,
  uploadBundle,
  addRating,
  replaceRating,
  removeRating,
} from '../orm/orm';
import type {MyProductWithVersions} from '../orm/orm';
import {slugify} from '../utils/slugify';
import {BigDecimal} from '@goovee/orm';
import {
  productSchema,
  versionSchema,
  MAX_BUNDLE_SIZE,
} from '../ui/components/product-form/schema';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import {
  saveReviewSchema,
  deleteReviewSchema,
  type SaveReviewInput,
  type DeleteReviewInput,
} from '../constants/review';

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
    partnerId: auth.user.mainPartnerId,
    client: auth.tenant.client,
    workspace: auth.workspace,
  });
  if (!product) {
    return {error: true, message: await t('Product not found')};
  }
  return {success: true, data: clone(product)};
}

// ---- SAVE PRODUCT (create or update) ---- //
type SaveProductInput = z.infer<typeof productSchema> & {workspaceURL: string};

export async function saveProduct(
  input: SaveProductInput,
): ActionResponse<{productId: string}> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const {workspaceURL, ...rest} = input;
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
      partnerId: auth.user.mainPartnerId,
      client,
      workspace: auth.workspace,
    });
    if (!existing) {
      return {error: true, message: await t('Product not found')};
    }
  }

  /* Pricing defaults live on the workspace config. All three relations
   * (currency / unit / productFamily) must be present for a paid product
   * to flow through the standard AOS sale-order / invoice path. We gate
   * creation on them so a supplier never ends up with a product that
   * silently can't be sold. Updates skip the gate because we don't
   * retroactively rewrite system fields. */
  const priceDefaults = {
    saleCurrency: auth.workspace.config.marketplaceDefaultSaleCurrency,
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
      if (
        !priceDefaults.saleCurrency?.id ||
        !priceDefaults.unit?.id ||
        !priceDefaults.productFamily?.id
      ) {
        return {
          error: true,
          message: await t(
            "Marketplace pricing isn't configured for this workspace. Contact your admin.",
          ),
        };
      }
      const code = `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const slug = slugify(payload.name);
      const created = await client.aOSProduct.create({
        data: {
          ...productData,
          code,
          slug,
          isMarketPlace: true,
          defaultSupplierPartner: {select: {id: auth.user.mainPartnerId}},
          marketplaceCreatedBy: {select: {id: auth.user.id}},
          saleCurrency: {select: {id: priceDefaults.saleCurrency.id}},
          unit: {select: {id: priceDefaults.unit.id}},
          productFamily: {select: {id: priceDefaults.productFamily.id}},
          inAti: priceDefaults.inAti,
          productTypeSelect: 'service',
          sellable: true,
          purchasable: false,
        },
        select: {id: true},
      });
      productId = created.id;
    }
    return {success: true, data: {productId}};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : await t('An error occurred');
    return {error: true, message};
  }
}

// ---- SAVE VERSION (create or update) ---- //
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
    partnerId: auth.user.mainPartnerId,
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

  /* Drafts always stay drafts. Anything else (a "publish" intent today, or
   * any future non-draft status the form might send) collapses to in_review
   * when the workspace requires review, else to published. */
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
      // Demotion to draft is only allowed from states where the author is
      // iterating: draft (stay), rejected (fix and resubmit), unpublished
      // (rework and resubmit). Published and in-review must go through the
      // explicit Unpublish flow first.
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
      await client.aOSMarketplaceProductVersion.update({
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
            ...(existingCompat.length && {remove: existingCompat}),
            ...(compatRefs.length && {select: compatRefs}),
          },
        },
        select: {id: true},
      });
      versionId = payload.id;
    } else {
      if (!uploadedFileId) {
        return {error: true, message: await t('Bundle file is required')};
      }
      const created = await client.aOSMarketplaceProductVersion.create({
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
        select: {id: true},
      });
      versionId = created.id;
    }

    // Promote currentVersion to the newest published version. If no published
    // version exists (e.g. the only published one just moved to in_review),
    // leave the pointer as-is — the listing filter requires at least one
    // published version on the product, so the product is unlisted regardless.
    const publishedNewest = await client.aOSMarketplaceProductVersion.findOne({
      where: {
        product: {id: payload.productId},
        statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
      },
      orderBy: {versionNumber: 'DESC'},
      select: {id: true},
    });
    if (publishedNewest) {
      const productNow = await client.aOSProduct.findOne({
        where: {id: payload.productId},
        select: {id: true, version: true},
      });
      if (productNow) {
        await client.aOSProduct.update({
          data: {
            id: payload.productId,
            version: productNow.version,
            currentVersion: {select: {id: publishedNewest.id}},
          },
          select: {id: true},
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

// ---- UNPUBLISH VERSION ---- //
const unpublishVersionSchema = z.object({
  versionId: z.string().min(1),
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
  /** Optional published version to promote into currentVersion. */
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

  // Owner check: caller must own the parent product.
  const owned = await findMyProductWithVersions({
    productId,
    partnerId: auth.user.mainPartnerId,
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

  // Decide whether to touch currentVersion. We only do so when the version
  // being unpublished IS the current one. In that case, if any other
  // published version exists, the caller must pick one to promote.
  const isCurrent = owned.currentVersion?.id === versionId;
  let promotedId: string | undefined;
  if (isCurrent) {
    const alternates = await client.aOSMarketplaceProductVersion.find({
      where: {
        product: {id: productId},
        statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
        id: {ne: versionId},
      },
      select: {id: true},
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
    await client.aOSMarketplaceProductVersion.update({
      data: {
        id: current.id,
        version: current.version,
        statusSelect: MARKETPLACE_VERSION_STATUS.UNPUBLISHED,
      },
      select: {id: true},
    });

    if (promotedId) {
      const productNow = await client.aOSProduct.findOne({
        where: {id: productId},
        select: {id: true, version: true},
      });
      if (productNow) {
        await client.aOSProduct.update({
          data: {
            id: productId,
            version: productNow.version,
            currentVersion: {select: {id: promotedId}},
          },
          select: {id: true},
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

// ---- SAVE / DELETE REVIEW ---- //

export async function saveReview(
  input: SaveReviewInput,
): ActionResponse<{reviewId: string}> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }
  const parsed = saveReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: true,
      message: z.prettifyError(parsed.error),
    };
  }
  const payload = parsed.data;
  const {error, auth} = await ensureAuth(payload.workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const {client} = auth.tenant;

  // Ensure the product is visible to this user.
  const product = await findProductAccess({
    recordId: payload.productId,
    client,
    workspace: auth.workspace,
    select: {id: true},
  });
  if (!product) {
    return {error: true, message: await t('Product not found')};
  }

  // If a version is being attached, verify it belongs to this product —
  // the UI restricts the dropdown, but a hand-crafted request shouldn't be
  // able to link a review to an unrelated version.
  if (payload.reviewedVersionId) {
    const matchingVersion = await client.aOSMarketplaceProductVersion.findOne({
      where: {
        id: payload.reviewedVersionId,
        product: {id: payload.productId},
        statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
      },
      select: {id: true},
    });
    if (!matchingVersion) {
      return {error: true, message: await t('Invalid version')};
    }
  }

  try {
    const reviewedVersion = payload.reviewedVersionId
      ? {select: {id: payload.reviewedVersionId}}
      : undefined;

    const existing = await client.aOSMarketplaceReview.findOne({
      where: {product: {id: payload.productId}, author: {id: auth.user.id}},
      select: {id: true, version: true, rating: true},
    });

    let reviewId: string;
    let previousRating: number | null;
    if (existing) {
      await client.aOSMarketplaceReview.update({
        data: {
          id: existing.id,
          version: existing.version,
          rating: payload.rating,
          reviewComment: payload.reviewComment ?? null,
          ...(reviewedVersion && {reviewedVersion}),
        },
        select: {id: true},
      });
      reviewId = existing.id;
      previousRating = existing.rating;
    } else {
      const created = await client.aOSMarketplaceReview.create({
        data: {
          product: {select: {id: payload.productId}},
          author: {select: {id: auth.user.id}},
          rating: payload.rating,
          reviewComment: payload.reviewComment ?? null,
          ...(reviewedVersion && {reviewedVersion}),
        },
        select: {id: true},
      });
      reviewId = created.id;
      previousRating = null;
    }

    // Rating aggregates are derived/telemetry; recompute them after the
    // response is flushed so the save action returns immediately.
    after(async () => {
      try {
        if (previousRating === null) {
          await addRating(client, payload.productId, payload.rating);
        } else {
          await replaceRating(
            client,
            payload.productId,
            previousRating,
            payload.rating,
          );
        }
      } catch (err) {
        console.error('marketplace: failed to update product rating', {
          productId: payload.productId,
          reviewId,
          userId: auth.user?.id ?? null,
          error: err,
        });
      }
    });

    return {success: true, data: {reviewId}};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : await t('An error occurred');
    return {error: true, message};
  }
}

export async function deleteReview(
  input: DeleteReviewInput,
): ActionResponse<true> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }
  const parsed = deleteReviewSchema.safeParse(input);
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
  const {client} = auth.tenant;

  try {
    const existing = await client.aOSMarketplaceReview.findOne({
      where: {product: {id: productId}, author: {id: auth.user.id}},
      select: {id: true, version: true, rating: true},
    });
    if (!existing) {
      return {error: true, message: await t('No review to delete')};
    }
    await client.aOSMarketplaceReview.delete({
      id: existing.id,
      version: existing.version,
    });

    // Rating aggregates are derived/telemetry; recompute after the response
    // is flushed so the delete action returns immediately.
    after(async () => {
      try {
        await removeRating(client, productId, existing.rating);
      } catch (err) {
        console.error('marketplace: failed to update product rating', {
          productId,
          reviewId: existing.id,
          userId: auth.user?.id ?? null,
          error: err,
        });
      }
    });

    return {success: true, data: true};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : await t('An error occurred');
    return {error: true, message};
  }
}

// ---- VALIDATION SCHEMAS ---- //
const AddToFavoritesSchema = z.object({
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
  workspaceURI: z.string().min(1),
  returnUrl: z.string().min(1),
});

type AddToFavoritesInput = z.infer<typeof AddToFavoritesSchema>;

// ---- ACTIONS ---- //
export async function addProductToFavorites(
  input: AddToFavoritesInput,
): ActionResponse<true> {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  // Validate input
  const result = AddToFavoritesSchema.safeParse(input);
  if (!result.success) {
    return {
      error: true,
      message: z.prettifyError(result.error),
    };
  }

  const {productId, workspaceURL, workspaceURI, returnUrl} = result.data;

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenantId);
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: returnUrl,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const client = auth.tenant.client;
  // Favorites live on the caller's own AOSPartner row (per-user, not rolled
  // up to the main partner) so a contact's favorites stay with the contact.
  const userId = auth.user.id;

  try {
    const product = await findProductAccess({
      recordId: productId,
      client,
      workspace: auth.workspace,
      select: {id: true},
    });

    if (!product) {
      return {
        error: true,
        message: await t('Product not found or access denied'),
      };
    }

    const partner = await client.aOSPartner.findOne({
      where: {id: userId},
      select: {
        id: true,
        favouriteProducts: {
          where: {id: productId},
          select: {id: true},
        },
      },
    });

    if (!partner) {
      return {
        error: true,
        message: await t('Partner not found'),
      };
    }

    const isFavorite = partner.favouriteProducts?.some(
      product => product.id === productId,
    );

    // Update with new favorites list
    await client.aOSPartner.update({
      data: {
        id: userId,
        version: partner.version,
        favouriteProducts: {
          ...(isFavorite && {remove: productId}),
          ...(!isFavorite && {select: {id: productId}}),
        },
      },
      select: {id: true},
    });

    return {success: true, data: true};
  } catch (e) {
    if (e instanceof Error) {
      return {error: true, message: e.message};
    }
    throw e;
  }
}

// ---- SEARCH PRODUCTS ---- //
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

// ---- CHECKOUT ---- //

const CheckoutSchema = z.object({
  workspaceURL: WorkspaceURLSchema,
  payment: z.object({
    mode: z.enum(PaymentOption),
    data: z.object({
      id: z.string().optional(),
      params: z.unknown().optional(),
    }),
  }),
});

/* Unified finalize action. Pulls the stashed cart from PaymentContext,
 * re-validates it against fresh DB state, anti-tampers paidAmount vs
 * server-recomputed total, grants access in a goovee tx, then post-
 * commits the AOS order/invoice HTTP best-effort. See
 * docs/marketplace-checkout-plan.md for the design. */
export async function checkout(
  props: z.input<typeof CheckoutSchema>,
): ActionResponse<true> {
  const parsed = CheckoutSchema.safeParse(props);
  if (!parsed.success)
    return {error: true, message: z.prettifyError(parsed.error)};

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId)
    return {error: true, message: await t('Tenant ID is missing.')};

  const {auth, error: authError} = await ensureAuth(
    parsed.data.workspaceURL,
    tenantId,
    {allowGuest: false},
  );
  if (authError) {
    return {error: true, message: await t('Sign in required.')};
  }
  const {client, config} = auth.tenant;
  const partnerId = auth.user.mainPartnerId;

  let paidAmount: number;
  let paymentContextId: string;
  let paymentContextVersion: number;
  let stashedProductIds: string[];
  try {
    const info = await getPaymentInfo({
      mode: parsed.data.payment.mode,
      data: parsed.data.payment.data,
      client,
    });
    paidAmount = info.amount;
    paymentContextId = info.context.id;
    paymentContextVersion = info.context.version;
    stashedProductIds = info.context.data?.productIds ?? [];
  } catch (e) {
    return {
      error: true,
      message: await t((e as Error).message ?? 'Payment context not found.'),
    };
  }

  const cartResult = await validateCart({
    client,
    workspace: auth.workspace,
    partnerId,
    productIds: stashedProductIds,
  });
  if (cartResult.error) return cartResult;
  const cart = cartResult.data;

  /* Anti-tamper: amount the provider captured must match what we'd compute
   * now. Mirrors events register(). Cent-level rounding is consistent
   * because both sides go through computePrice → round(scale). */
  if (Math.abs(Number(paidAmount) - cart.total) > 0.005) {
    return {
      error: true,
      message: await t(
        'Paid amount {0} does not match expected amount {1}.',
        String(paidAmount),
        String(cart.total),
      ),
    };
  }

  const productIds = cart.items.map(item => item.productId);

  try {
    await client.$transaction(async txClient => {
      await recordPurchases(txClient, partnerId, productIds);
      await markPaymentAsProcessed({
        contextId: paymentContextId,
        version: paymentContextVersion,
        client: txClient,
      });
    });
  } catch (e) {
    return {
      error: true,
      message:
        e instanceof Error ? e.message : await t('Granting access failed.'),
    };
  }

  const paymentModeId = getPaymentModeId(
    auth.workspace.config.paymentOptionSet,
    parsed.data.payment.mode,
  );

  /* Post-commit AOS HTTP. The buyer already has access; this only creates
   * the upstream SO + Invoice + InvoicePayment for accounting. Errors are
   * logged but never fail the action — see the rationale in
   * docs/marketplace-checkout-plan.md. The Invoice id is back-attached to
   * the purchase rows once we have it. */
  after(async () => {
    try {
      const buyerPartner = await client.aOSPartner.findOne({
        where: {id: partnerId},
        select: {mainAddress: {id: true}},
      });
      const addressId = buyerPartner?.mainAddress?.id ?? null;

      const {saleOrderId} = await createMarketplaceOrder({
        cart,
        workspace: auth.workspace,
        partnerId,
        contactId: auth.user.isContact ? auth.user.id : undefined,
        invoicingAddressId: addressId,
        deliveryAddressId: addressId,
        paidAmount: cart.total,
        paymentModeId,
        config,
      });

      const invoice = await findInvoiceBySaleOrderId({client, saleOrderId});
      if (invoice?.id) {
        await attachInvoiceToPurchases(
          client,
          partnerId,
          productIds,
          invoice.id,
        );
      }
    } catch (e) {
      console.error('marketplace: AOS invoice creation failed', {
        partnerId,
        productIds,
        error: e,
      });
    }
  });

  return {success: true, data: true};
}
