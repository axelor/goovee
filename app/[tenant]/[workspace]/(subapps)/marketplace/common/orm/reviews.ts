import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceReview} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and} from '@/utils/orm';
import {REVIEW_REPORT_STATUS} from '../constants/statuses';
import {versionNumberFields, type QueryProps} from './helpers';

// ---- PRODUCT REVIEWS ---- //

export type ListReview = Awaited<ReturnType<typeof findProductReviews>>[number];

export async function findProductReviews({
  productId,
  client,
  where,
  take,
  skip,
  orderBy,
}: {
  productId: ID;
  client: Client;
} & QueryProps<AOSMarketplaceReview>) {
  return client.aOSMarketplaceReview.find({
    ...(take ? {take} : {}),
    ...(skip ? {skip} : {}),
    ...(orderBy ? {orderBy} : {}),
    where: and<AOSMarketplaceReview>([
      {OR: [{archived: false}, {archived: null}]},
      {marketplaceProduct: {id: productId}},
      where,
    ]),
    select: {
      id: true,
      rating: true,
      reviewComment: true,
      /* Drives whether the comment is shown; a hidden review still renders its
       * rating but not its comment. */
      moderationStatusSelect: true,
      createdOn: true,
      author: {
        id: true,
        simpleFullName: true,
        picture: {id: true},
      },
      reviewedVersion: {id: true, ...versionNumberFields},
    },
    orderBy: {createdOn: 'DESC'},
  });
}

export type MyReview = NonNullable<Awaited<ReturnType<typeof findMyReview>>>;

export async function findMyReview({
  productId,
  userId,
  client,
}: {
  productId: ID;
  userId: ID;
  client: Client;
}) {
  return client.aOSMarketplaceReview.findOne({
    where: {marketplaceProduct: {id: productId}, author: {id: userId}},
    select: {
      id: true,
      version: true,
      rating: true,
      reviewComment: true,
      /* The author always sees their own review; when hidden, the card flags it
       * as moderated. The reason is an internal note, never sent to the client. */
      moderationStatusSelect: true,
      createdOn: true,
      updatedOn: true,
      author: {id: true, simpleFullName: true, picture: {id: true}},
      reviewedVersion: {id: true, ...versionNumberFields},
    },
  });
}

export type ExistingReview = NonNullable<
  Awaited<ReturnType<typeof findExistingReview>>
>;

export async function findExistingReview({
  client,
  productId,
  userId,
}: {
  client: Client;
  productId: ID;
  userId: ID;
}) {
  return client.aOSMarketplaceReview.findOne({
    where: {marketplaceProduct: {id: productId}, author: {id: userId}},
    select: {id: true, version: true, rating: true},
  });
}

// ---- REVIEW REPORTS ---- //

/* Looks up this reporter's existing report on a review. One report per
 * (review, reporter) is allowed, so a hit means the user already reported it. */
export async function findExistingReport({
  client,
  reviewId,
  reporterId,
}: {
  client: Client;
  reviewId: ID;
  reporterId: ID;
}) {
  return client.aOSMarketplaceReviewReport.findOne({
    where: {review: {id: reviewId}, reporter: {id: reporterId}},
    select: {id: true},
  });
}

/* Files a pending report. The unique (review, reporter) constraint is the final
 * guard against a duplicate slipping past findExistingReport under a race. */
export async function createReviewReport({
  client,
  reviewId,
  reporterId,
  reasonSelect,
}: {
  client: Client;
  reviewId: ID;
  reporterId: ID;
  reasonSelect: string;
}): Promise<string> {
  const report = await client.aOSMarketplaceReviewReport.create({
    data: {
      review: {select: {id: reviewId}},
      reporter: {select: {id: reporterId}},
      reasonSelect,
      statusSelect: REVIEW_REPORT_STATUS.PENDING,
    },
    select: {id: true},
  });
  return report.id;
}
