'use server';

import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import {t} from '@/locale/server';
import type {User} from '@/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {clone} from '@/utils';
import {cn} from '@/utils/css';
import {getPaginationButtons, getSkip, getTotal} from '@/utils/pagination';
import {ChevronLeft, ChevronRight, Star} from 'lucide-react';
import Link from 'next/link';
import {
  findMyReview,
  findProductReviews,
  findProductVersions,
  type ListReview,
  type SingleProduct,
} from '../../../../orm';
import {formatVersionNumber} from '../../../../utils/version-number';
import {YourReviewCard} from '../your-review-card';
import {Rating} from '../../shared/rating';
import {PartnerAvatar} from '../../shared/partner-avatar';
import {TooltipDate} from '../../shared/tooltip-date';

interface ReviewsTabProps {
  product: SingleProduct;
  workspaceURI: string;
  workspaceURL: string;
  tenantId: string;
  client: Client;
  reviewPage: number;
  user?: User;
  loginHref: string;
  /** Owner preview: hide the write-a-review card (no interaction). */
  preview?: boolean;
}

export async function ReviewsTab({
  product,
  workspaceURI,
  workspaceURL,
  tenantId,
  client,
  reviewPage,
  user,
  loginHref,
  preview = false,
}: ReviewsTabProps) {
  const REVIEWS_PAGE_SIZE = 4;

  // Fetch paginated reviews (excluding the caller's own — that's rendered
  // separately in the "Your review" card above the list), the caller's
  // review, and published versions (for the version select).
  const [visibleReviews, myReview, publishedVersions] = await Promise.all([
    findProductReviews({
      productId: product.id,
      client,
      take: REVIEWS_PAGE_SIZE,
      skip: getSkip(REVIEWS_PAGE_SIZE, reviewPage),
      where: user ? {author: {id: {ne: user.id}}} : undefined,
    }),
    user
      ? findMyReview({productId: product.id, userId: user.id, client})
      : null,
    findProductVersions({
      productId: product.id,
      client,
      take: 50,
    }),
  ]);

  const visibleReviewTotal = getTotal(visibleReviews);
  const totalReviewCount = visibleReviewTotal + (myReview ? 1 : 0);
  const totalReviewPages = Math.ceil(visibleReviewTotal / REVIEWS_PAGE_SIZE);

  const [noReviewsLabel, reviewCountLabel, previousLabel, nextLabel] =
    await Promise.all([
      t('No reviews yet'),
      totalReviewCount === 1
        ? t('1 review')
        : t('{0} reviews', String(totalReviewCount)),
      t('Previous'),
      t('Next'),
    ]);

  // Calculate rating distribution using aggregate
  const ratingAggregates = await client.aOSMarketplaceReview.aggregate({
    count: {id: true},
    groupBy: {rating: true},
    where: {marketplaceProduct: {id: product.id}},
  });

  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingAggregates.forEach(item => {
    const r = item.groupBy?.rating;
    if (r != null) {
      ratingDistribution[r as keyof typeof ratingDistribution] =
        item.count?.id ?? 0;
    }
  });

  const getRatingPercentage = (rating: number) => {
    return totalReviewCount > 0
      ? Math.round(
          (ratingDistribution[rating as keyof typeof ratingDistribution] /
            totalReviewCount) *
            100,
        )
      : 0;
  };

  const yourReviewCard = preview ? null : (
    <YourReviewCard
      productId={product.id}
      workspaceURL={workspaceURL}
      user={user}
      loginHref={loginHref}
      tenantId={tenantId}
      initial={myReview ? clone(myReview) : null}
      versions={publishedVersions.map(v => ({
        id: v.id,
        versionNumber: formatVersionNumber(v),
      }))}
      defaultVersionId={product.currentVersion?.id ?? undefined}
    />
  );

  if (totalReviewCount === 0) {
    return (
      <div className="space-y-6">
        {yourReviewCard}
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">{noReviewsLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary Card */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          {/* Left: Average Rating */}
          <div className="flex flex-col items-center gap-3 sm:border-r sm:border-border sm:pr-8">
            <div className="text-5xl font-bold text-foreground">
              {(Number(product.averageRating) || 0).toFixed(1)}
            </div>
            <Rating value={product.averageRating} showValue={false} size={16} />
            <p className="text-sm text-muted-foreground">{reviewCountLabel}</p>
          </div>

          {/* Right: Rating Breakdown */}
          <div className="flex-1 space-y-3">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground w-6">
                  {rating}
                </span>
                <Star
                  size={12}
                  className="fill-amber-400 text-amber-400 flex-shrink-0"
                />
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{width: `${getRatingPercentage(rating)}%`}}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {getRatingPercentage(rating)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {yourReviewCard}

      {/* Reviews List (excludes the caller's own) */}
      <div className="space-y-4">
        {visibleReviews.map((review: ListReview) => {
          return (
            <div
              key={review.id}
              className="bg-card rounded-lg border border-border p-6 space-y-3">
              <div className="flex items-start gap-3">
                <PartnerAvatar partner={review.author} tenantId={tenantId} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-sm">
                      {review.author.simpleFullName}
                    </p>
                    {review.createdOn && (
                      <TooltipDate
                        date={review.createdOn}
                        displayType="relative"
                        showTooltip={true}
                        prefix="•"
                        className="text-xs text-muted-foreground"
                      />
                    )}
                  </div>
                  <Rating
                    value={review.rating}
                    showValue={false}
                    size={12}
                    className="mt-1"
                  />
                </div>
              </div>
              {review.reviewComment && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {review.reviewComment}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalReviewPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious asChild>
                <Link
                  scroll={false}
                  replace
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=reviews${reviewPage > 1 ? `&reviewPage=${reviewPage - 1}` : ''}`}
                  className={cn({
                    ['pointer-events-none opacity-50']: reviewPage <= 1,
                  })}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">{previousLabel}</span>
                </Link>
              </PaginationPrevious>
            </PaginationItem>
            {getPaginationButtons({
              currentPage: reviewPage,
              totalPages: totalReviewPages,
            }).map((value, i) => {
              if (typeof value === 'string') {
                return (
                  <PaginationItem key={i}>
                    <span className="px-2">...</span>
                  </PaginationItem>
                );
              }
              return (
                <PaginationItem key={value}>
                  <PaginationLink isActive={reviewPage === value} asChild>
                    <Link
                      scroll={false}
                      replace
                      href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=reviews&reviewPage=${value}`}>
                      {value}
                    </Link>
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext asChild>
                <Link
                  scroll={false}
                  replace
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=reviews${reviewPage < totalReviewPages ? `&reviewPage=${reviewPage + 1}` : ''}`}
                  className={cn({
                    ['pointer-events-none opacity-50']:
                      reviewPage >= totalReviewPages,
                  })}>
                  <span className="sr-only">{nextLabel}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
