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
  addRating,
  findExistingReview,
  findMatchingPublishedVersion,
  findProductAccess,
  removeRating,
  replaceRating,
} from '../orm';
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
  const {error, auth} = await ensureAuth(payload.workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const {client} = auth.tenant;

  const product = await findProductAccess({
    recordId: payload.productId,
    client,
    workspace: auth.workspace,
    select: {id: true},
  });
  if (!product) {
    return {error: true, message: await t('Product not found')};
  }

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

    // Rating aggregates are derived/telemetry; recompute them after the
    // response is flushed so the save action returns immediately.
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
