'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';
import {after} from 'next/server';
import {z} from 'zod';
import {
  type DeleteReviewInput,
  deleteReviewSchema,
  type SaveReviewInput,
  saveReviewSchema,
} from '../constants/review';
import {
  findExistingReview,
  findProductAccess,
  recomputeProductRating,
  withProductAccessFilter,
} from '../orm';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import {ensureAuth} from '../utils/auth-helper';

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
  const {error, message, auth} = await ensureAuth(
    payload.workspaceURL,
    tenantId,
  );
  if (error) {
    return {error: true, message};
  }
  const {client} = auth.tenant;

  let publisherId: string;
  if (payload.reviewedVersionId) {
    /* Single query covering both guards: the reviewed version must be
     * published AND belong to an accessible product. The version's own
     * PUBLISHED status implies the product has a published version, so
     * the plain access filter suffices here. */
    const matchingVersion = await client.aOSMarketplaceProductVersion.findOne({
      where: {
        id: payload.reviewedVersionId,
        statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
        marketplaceProduct: withProductAccessFilter(auth.workspace)({
          id: payload.productId,
        }),
      },
      select: {marketplaceProduct: {publisher: {id: true}}},
    });
    if (!matchingVersion) {
      return {error: true, message: await t('Invalid version')};
    }
    publisherId = matchingVersion.marketplaceProduct.publisher.id;
  } else {
    const product = await findProductAccess({
      recordId: payload.productId,
      client,
      workspace: auth.workspace,
      select: {id: true, publisher: {id: true}},
    });
    if (!product) {
      return {error: true, message: await t('Product not found')};
    }
    publisherId = product.publisher.id;
  }

  // The publisher and its members cannot review their own product.
  if (publisherId === auth.user.mainPartnerId) {
    return {
      error: true,
      message: await t('You cannot review your own product'),
    };
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
    } else {
      const created = await client.aOSMarketplaceReview.create({
        select: {id: true},
        data: {
          marketplaceProduct: {select: {id: payload.productId}},
          author: {select: {id: auth.user.id}},
          rating: payload.rating,
          reviewComment: payload.reviewComment ?? null,
          ...(reviewedVersion && {reviewedVersion}),
        },
      });
      reviewId = created.id;
    }

    /* Rating aggregates are derived; recompute them from the review rows
     * after the response is flushed so the save returns immediately. */
    after(async () => {
      try {
        await recomputeProductRating(client, payload.productId);
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
  const {error, message, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error) {
    return {error: true, message};
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

    /* Rating aggregates are derived; recompute them from the review rows
     * after the response is flushed so the delete returns immediately. */
    after(async () => {
      try {
        await recomputeProductRating(client, productId);
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
