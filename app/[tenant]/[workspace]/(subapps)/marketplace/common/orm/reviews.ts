import type {Client} from '@/goovee/.generated/client';
import type {AOSMarketplaceReview} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {and} from '@/utils/orm';
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
