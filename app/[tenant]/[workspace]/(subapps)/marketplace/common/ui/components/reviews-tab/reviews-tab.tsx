'use server';

import Link from 'next/link';
import {Star, ChevronLeft, ChevronRight} from 'lucide-react';
import {SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';
import {getSkip} from '../../../../../ticketing/common/utils/search-param';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {Avatar, AvatarImage} from '@/ui/components/avatar';
import {getPaginationButtons} from '@/utils/pagination';
import {
  findProductReviews,
  type SingleProduct,
  type ListReview,
} from '../../../orm/orm';
import {ClientDate} from '../client-date';
import type {Client} from '@/goovee/.generated/client';

interface ReviewsTabProps {
  product: SingleProduct;
  workspaceURI: string;
  tenantId: string;
  client: Client;
  reviewPage: number;
}

export async function ReviewsTab({
  product,
  workspaceURI,
  tenantId,
  client,
  reviewPage,
}: ReviewsTabProps) {
  const REVIEWS_PAGE_SIZE = 4;

  // Fetch paginated reviews
  const reviewsResult = await findProductReviews({
    productId: product.id,
    client,
    take: REVIEWS_PAGE_SIZE,
    skip: getSkip(REVIEWS_PAGE_SIZE, reviewPage),
  });

  const totalReviewCount = product.ratingCount || 0;
  const totalReviewPages = Math.ceil(totalReviewCount / REVIEWS_PAGE_SIZE);

  // Calculate rating distribution using aggregate
  const ratingAggregates = await client.aOSMarketplaceReview.aggregate({
    count: {id: true},
    groupBy: {rating: true},
    where: {product: {id: product.id}},
  });

  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingAggregates.forEach(item => {
    if (item.groupBy.rating) {
      ratingDistribution[
        item.groupBy.rating as keyof typeof ratingDistribution
      ] = item.count.id;
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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (initials: string) => {
    const colors = [
      'bg-yellow-100',
      'bg-blue-100',
      'bg-green-100',
      'bg-pink-100',
      'bg-purple-100',
      'bg-orange-100',
    ];
    return colors[initials.charCodeAt(0) % colors.length];
  };

  if (totalReviewCount === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary Card */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div className="flex gap-8">
          {/* Left: Average Rating */}
          <div className="flex flex-col items-center gap-3 border-r border-border pr-8">
            <div className="text-5xl font-bold text-foreground">
              {(Number(product.averageRating) || 0).toFixed(1)}
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.round(Number(product.averageRating) || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200'
                  }
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {totalReviewCount} {totalReviewCount === 1 ? 'review' : 'reviews'}
            </p>
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

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsResult.map((review: ListReview) => {
          const initials = getInitials(review.author.simpleFullName);
          const avatarBgColor = getAvatarColor(initials);
          const hasImage = review.author.picture && review.author.picture.id;
          return (
            <div
              key={review.id}
              className="bg-card rounded-lg border border-border p-6 space-y-3">
              <div className="flex items-start gap-3">
                {hasImage ? (
                  <Avatar className="rounded-full h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={`/api/tenant/${tenantId}/partner/image/${review.author.picture?.id}`}
                      alt={review.author.simpleFullName || 'Reviewer'}
                      size={40}
                    />
                  </Avatar>
                ) : (
                  <div
                    className={cn(
                      'rounded-full h-10 w-10 flex items-center justify-center font-semibold text-sm flex-shrink-0',
                      avatarBgColor,
                    )}>
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground text-sm">
                      {review.author.simpleFullName}
                    </p>
                    {review.createdOn && (
                      <ClientDate
                        date={review.createdOn}
                        displayType="relative"
                        showTooltip={true}
                        prefix="•"
                        className="text-xs text-muted-foreground"
                      />
                    )}
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-gray-200 text-gray-200'
                        }
                      />
                    ))}
                  </div>
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
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=reviews${reviewPage > 1 ? `&reviewPage=${reviewPage - 1}` : ''}`}
                  className={cn({
                    ['pointer-events-none opacity-50']: reviewPage <= 1,
                  })}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
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
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?tab=reviews${reviewPage < totalReviewPages ? `&reviewPage=${reviewPage + 1}` : ''}`}
                  className={cn({
                    ['pointer-events-none opacity-50']:
                      reviewPage >= totalReviewPages,
                  })}>
                  <span className="sr-only">Next</span>
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
