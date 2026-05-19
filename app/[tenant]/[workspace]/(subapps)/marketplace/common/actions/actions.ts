'use server';

import type {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
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
} from '../orm/orm';
import {MARKETPLACE_TYPE} from '../constants/marketplace-types';

// ---- LOAD PRODUCT FOR EDITING ---- //
import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import type {ReadableStream as NodeReadableStream} from 'stream/web';
import {pipeline} from 'stream/promises';
import {manager} from '@/tenant';
import {clone} from '@/utils';
import {getFileSizeText} from '@/utils/files';
import {zodSafeParseFormData} from '@/utils/formdata';
import type {Cloned} from '@/types/util';
import {findMyProductWithVersions} from '../orm/orm';
import type {MyProductWithVersions} from '../orm/orm';
import type {Client} from '@/goovee/.generated/client';
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
    userId: auth.user.id,
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
      userId: auth.user.id,
      client,
      workspace: auth.workspace,
    });
    if (!existing) {
      return {error: true, message: await t('Product not found')};
    }
  }

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
        data: {id: payload.id, version: current.version, ...productData},
        select: {id: true},
      });
      productId = payload.id;
    } else {
      const code = `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const slug = slugify(payload.name);
      const created = await client.aOSProduct.create({
        data: {
          ...productData,
          code,
          slug,
          isMarketPlace: true,
          defaultSupplierPartner: {select: {id: auth.user.id}},
          marketplaceCreatedBy: {select: {id: auth.user.id}},
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
    userId: auth.user.id,
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
          compatibilitySet: {select: {id: true}},
        },
      });
      if (!current) {
        return {error: true, message: await t('Version not found')};
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
  const {versionId, productId, workspaceURL, newCurrentVersionId} =
    parsed.data;

  const {error, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const {client} = auth.tenant;

  // Owner check: caller must own the parent product.
  const owned = await findMyProductWithVersions({
    productId,
    userId: auth.user.id,
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
      message: await t('Only published or in-review versions can be unpublished'),
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

async function uploadBundle(file: File, storage: string, client: Client) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${safeName}`;
  await pipeline(
    Readable.fromWeb(
      file.stream() as unknown as NodeReadableStream<Uint8Array>,
    ),
    fs.createWriteStream(path.resolve(storage, fileName)),
  );
  const meta = await client.aOSMetaFile
    .create({
      data: {
        fileName: file.name,
        filePath: fileName,
        fileType: file.type || 'application/zip',
        fileSize: String(file.size),
        sizeText: getFileSizeText(file.size),
        description: '',
      },
      select: {id: true},
    })
    .then(clone);
  return meta.id;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `product-${Date.now()}`
  );
}

// ---- SAVE / DELETE REVIEW ---- //

async function recomputeProductRating(client: Client, productId: string) {
  const agg = await client.aOSMarketplaceReview.aggregate({
    count: {id: true},
    avg: {rating: true},
    where: {product: {id: productId}},
  });
  const count = Number(agg[0]?.count.id ?? 0);
  const average = Number(agg[0]?.avg.rating ?? 0);
  const current = await client.aOSProduct.findOne({
    where: {id: productId},
    select: {id: true, version: true},
  });
  if (!current) return;
  await client.aOSProduct.update({
    data: {
      id: productId,
      version: current.version,
      averageRating: new BigDecimal(count > 0 ? average.toString() : '0'),
      ratingCount: count,
    },
    select: {id: true},
  });
}

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
      },
      select: {id: true},
    });
    if (!matchingVersion) {
      return {error: true, message: await t('Invalid version')};
    }
  }

  try {
    const existing = await client.aOSMarketplaceReview.findOne({
      where: {product: {id: payload.productId}, author: {id: auth.user.id}},
      select: {id: true, version: true},
    });

    let reviewId: string;
    const reviewedVersion = payload.reviewedVersionId
      ? {select: {id: payload.reviewedVersionId}}
      : undefined;

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
    }

    await recomputeProductRating(client, payload.productId);
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
      select: {id: true, version: true},
    });
    if (!existing) {
      return {error: true, message: await t('No review to delete')};
    }
    await client.aOSMarketplaceReview.delete({
      id: existing.id,
      version: existing.version,
    });
    await recomputeProductRating(client, productId);
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
  const partnerId = auth.user.id;

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
      where: {id: partnerId},
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
        id: partnerId,
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
