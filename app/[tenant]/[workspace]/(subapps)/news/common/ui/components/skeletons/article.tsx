'use client';

// ---- CORE IMPORTS ---- //
import {CommentsSkeleton} from '@/lib/core/comments';
import {Skeleton} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {
  FeedListSkeleton,
  BreadcrumbsSkeleton,
} from '@/subapps/news/common/ui/components';

export function ArticleSkeleton() {
  return (
    <div className="bg-ink-25 min-h-full">
      <Skeleton className="h-[360px] lg:h-[440px] w-full rounded-none" />
      <div className={`container mx-auto grid grid-cols-1 gap-6 mt-6`}>
        <div className="py-4">
          <BreadcrumbsSkeleton />
        </div>
        <div className=" grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="w-full flex flex-col gap-6">
            {/* RelatedNews Section */}
            <FeedListSkeleton width="w-full" />
            {/* RecommendedNews Section */}
            <FeedListSkeleton width="w-full" />
          </div>
        </div>
        {/* Comments Section */}
        <CommentsSkeleton />
        {/* Discover next Section */}
        <div className="mt-2">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({length: 4}).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
