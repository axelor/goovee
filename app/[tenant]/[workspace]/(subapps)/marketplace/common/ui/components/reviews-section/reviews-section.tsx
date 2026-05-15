'use client';

import Link from 'next/link';
import {Star, ChevronLeft, ChevronRight} from 'lucide-react';
import {SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/components/pagination';
import {getPaginationButtons} from '@/utils/pagination';
import type {ListReview} from '../../../orm/orm';
import {ReviewCard} from '../review-card';

interface ReviewsSectionProps {
  reviews: ListReview[];
  allReviews: ListReview[];
  averageRating: number | null;
  ratingCount: number;
  totalPages: number;
  currentPage: number;
  productSlug: string;
  workspaceURI: string;
  tenantId: string;
}

export function ReviewsSection({
  reviews,
  allReviews,
  averageRating,
  ratingCount,
  totalPages,
  currentPage,
  productSlug,
  workspaceURI,
  tenantId,
}: ReviewsSectionProps) {
  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  allReviews.forEach((review: ListReview) => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
  });

  const getRatingPercentage = (rating: number) => {
    return ratingCount > 0
      ? Math.round(
          (ratingDistribution[rating as keyof typeof ratingDistribution] /
            ratingCount) *
            100,
        )
      : 0;
  };

  if (ratingCount === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Reviews</h2>
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Reviews</h2>

      {/* Rating Summary Card */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div className="flex gap-8">
          {/* Left: Average Rating */}
          <div className="flex flex-col items-center gap-3 border-r border-border pr-8">
            <div className="text-5xl font-bold text-foreground">
              {(Number(averageRating) || 0).toFixed(1)}
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.round(Number(averageRating) || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200'
                  }
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
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
        {reviews.map((review: ListReview) => (
          <ReviewCard key={review.id} review={review} tenantId={tenantId} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious asChild>
                <Link
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${productSlug}?tab=reviews${currentPage > 1 ? `&reviewPage=${currentPage - 1}` : ''}`}
                  className={cn({
                    ['pointer-events-none opacity-50']: currentPage <= 1,
                  })}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Link>
              </PaginationPrevious>
            </PaginationItem>
            {getPaginationButtons({
              currentPage,
              totalPages,
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
                  <PaginationLink isActive={currentPage === value} asChild>
                    <Link
                      href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${productSlug}?tab=reviews&reviewPage=${value}`}>
                      {value}
                    </Link>
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext asChild>
                <Link
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${productSlug}?tab=reviews${currentPage < totalPages ? `&reviewPage=${currentPage + 1}` : ''}`}
                  className={cn({
                    ['pointer-events-none opacity-50']:
                      currentPage >= totalPages,
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
