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
import {DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_SCALE} from '@/constants';
import {
  findProductAccess,
  findProductsBySearch,
  findPartnerCurrency,
  findDefaultCurrency,
  type ProductSearchResult,
  recordPurchases,
  attachInvoiceToPurchases,
  findMatchingPublishedVersion,
  findNewestPublishedVersion,
  findPublishedAlternateVersions,
  findExistingReview,
  findPartnerWithFavorite,
  findPartnerInvoicingAddresses,
} from '../orm/orm';
import {
  updateProductCurrentVersion,
  updateVersionStatus,
  setPartnerFavorite,
} from '../orm/mutations';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';
import {getPaymentInfo} from '../utils/payment-info';
import {recheckCartAvailability, type ValidatedCart} from './cart-validation';
import {createMarketplaceOrder} from '../service';
import {markPaymentAsProcessed} from '@/payment/common/orm';
import {PaymentOption} from '@/types';
import {getPaymentModeId} from '@/utils/payment';
import {WorkspaceURLSchema} from '@/utils/validators';

import fs from 'fs';
import {manager} from '@/tenant';
import {clone} from '@/utils';
import {unpackFromFormData, zodSafeParseFormData} from '@/utils/formdata';
import type {Cloned} from '@/types/util';
import {
  findMyProductWithVersions,
  uploadBundle,
  syncProductImages,
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
} from '../ui/components/product-form/validator';
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
    mainPartnerId: auth.user.mainPartnerId,
    client: auth.tenant.client,
    workspace: auth.workspace,
  });
  if (!product) {
    return {error: true, message: await t('Product not found')};
  }
  return {success: true, data: clone(product)};
}

// ---- SAVE PRODUCT (create or update) ---- //
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
  // Strip workspaceURL before validating against the product schema.
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

  /* Pricing defaults live on the workspace config. Unit and productFamily
   * must be present for a paid product to flow through the standard AOS
   * sale-order / invoice path; we gate creation on them. `saleCurrency`
   * is resolved separately (publisher's partner currency, falling back
   * to DEFAULT_CURRENCY_CODE) and stamped only on create — updates leave
   * the existing product currency alone. */
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
          // AOS computes `[code] name` in ProductBaseRepository.save();
          // goovee writes bypass that hook so we set it explicitly.
          fullName: `[${code}] ${payload.name}`,
          isMarketPlace: true,
          /* Scope the product to the current workspace. Without this,
           * `getProductAccessFilter` (used by `withMyProductAccessFilter`)
           * rejects the product on the very next lookup — saveVersion
           * would then fail with "Product not found". */
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
            ...(existingCompat.length && {remove: existingCompat}),
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

    // Promote currentVersion to the newest published version. If no published
    // version exists (e.g. the only published one just moved to in_review),
    // leave the pointer as-is — the listing filter requires at least one
    // published version on the product, so the product is unlisted regardless.
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

  // Decide whether to touch currentVersion. We only do so when the version
  // being unpublished IS the current one. In that case, if any other
  // published version exists, the caller must pick one to promote.
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
    const matchingVersion = await findMatchingPublishedVersion({
      client,
      versionId: payload.reviewedVersionId,
      productId: payload.productId,
    });
    if (!matchingVersion) {
      return {error: true, message: await t('Invalid version')};
    }
  }

  try {
    const reviewedVersion = payload.reviewedVersionId
      ? {select: {id: payload.reviewedVersionId}}
      : undefined;

    const existing = await findExistingReview({
      client,
      productId: payload.productId,
      userId: auth.user.id,
    });

    let reviewId: string;
    let previousRating: number | null;
    if (existing) {
      await client.aOSMarketplaceReview.update({
        select: {id: true},
        data: {
          id: existing.id,
          version: existing.version,
          rating: payload.rating,
          reviewComment: payload.reviewComment ?? null,
          ...(reviewedVersion && {reviewedVersion}),
        },
      });
      reviewId = existing.id;
      previousRating = existing.rating;
    } else {
      const created = await client.aOSMarketplaceReview.create({
        select: {id: true},
        data: {
          product: {select: {id: payload.productId}},
          author: {select: {id: auth.user.id}},
          rating: payload.rating,
          reviewComment: payload.reviewComment ?? null,
          ...(reviewedVersion && {reviewedVersion}),
        },
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
    const existing = await findExistingReview({
      client,
      productId,
      userId: auth.user.id,
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
  isFavorite: z.boolean(),
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

  const {productId, workspaceURL, workspaceURI, returnUrl, isFavorite} =
    result.data;

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

    const partner = await findPartnerWithFavorite({
      client,
      userId,
      productId,
    });

    if (!partner) {
      return {
        error: true,
        message: await t('Partner not found'),
      };
    }

    const currentlyFavorite = !!partner.favouriteProducts?.some(
      product => product.id === productId,
    );

    // No-op if desired state already matches.
    if (currentlyFavorite === isFavorite) {
      return {success: true, data: true};
    }

    await setPartnerFavorite({
      client,
      userId,
      version: partner.version,
      productId,
      isFavorite,
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
  const mainPartnerId = auth.user.mainPartnerId;

  let paidAmount: number;
  let paymentContextId: string;
  let paymentContextVersion: number;
  let cart: ValidatedCart;
  try {
    const info = await getPaymentInfo({
      mode: parsed.data.payment.mode,
      data: parsed.data.payment.data,
      client,
    });
    paidAmount = info.amount;
    paymentContextId = info.context.id;
    paymentContextVersion = info.context.version;
    const stashedCart = info.context.data?.cart as ValidatedCart | undefined;
    if (!stashedCart?.items?.length) {
      return {error: true, message: await t('Payment context is empty.')};
    }
    cart = stashedCart;
  } catch (e) {
    return {
      error: true,
      message: await t((e as Error).message ?? 'Payment context not found.'),
    };
  }

  /* Anti-tamper: the amount the provider captured must match the cart
   * the provider was handed at prepare time (stashed in PaymentContext).
   * We don't recompute prices here — pricing inputs (taxes, FX rates)
   * could have moved since prepare, and rejecting an already-captured
   * payment over server-state drift is worse than honouring the price
   * the buyer actually saw.
   *
   * Tolerance is half of the cart currency's smallest representable
   * unit: any genuine mismatch is ≥ 1 minor unit, anything below is
   * IEEE 754 / provider-side conversion drift. */
  const tolerance =
    0.5 * 10 ** -(cart.items[0]?.scale ?? DEFAULT_CURRENCY_SCALE);
  if (Math.abs(Number(paidAmount) - cart.total) > tolerance) {
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

  /* Time-sensitive re-check: between prepare and now (could be minutes
   * via 3-D Secure / external redirects) the buyer may have purchased
   * the same product in another tab, or the publisher may have pulled a
   * version. Block the grant if so. Prices are NOT re-checked here. */
  const recheck = await recheckCartAvailability({
    client,
    workspace: auth.workspace,
    mainPartnerId,
    productIds,
  });
  if (recheck.error) return recheck;

  try {
    await client.$transaction(async txClient => {
      await recordPurchases(txClient, mainPartnerId, productIds);
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

  try {
    const buyerPartner = await findPartnerInvoicingAddresses({
      client,
      mainPartnerId,
    });

    const addressId =
      buyerPartner?.partnerAddressList?.find(addr => addr.isDefaultAddr)?.id ??
      buyerPartner?.partnerAddressList?.[0]?.id;
    if (!addressId) {
      return {
        success: true,
        data: true,
        message: await t(
          'Invoice creation failed: no invoicing address found.',
        ),
      };
    }

    const {invoiceId} = await createMarketplaceOrder({
      cart,
      workspace: auth.workspace,
      mainPartnerId,
      contactId: auth.user.isContact ? auth.user.id : undefined,
      invoicingAddressId: addressId,
      paidAmount: cart.total,
      paymentModeId,
      config,
    });

    await attachInvoiceToPurchases(
      client,
      mainPartnerId,
      productIds,
      invoiceId,
    );
  } catch (e) {
    const reason = e instanceof Error ? e.message : '';
    console.error('marketplace: invoice creation failed', {
      mainPartnerId,
      productIds,
      paymentContextId,
      error: e,
    });
    return {
      success: true,
      data: true,
      message: reason
        ? await t('Invoice creation failed: {0}', reason)
        : await t('Invoice creation failed.'),
    };
  }

  return {success: true, data: true};
}
