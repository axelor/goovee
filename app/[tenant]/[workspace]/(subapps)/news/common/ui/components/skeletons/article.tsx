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
    </div>
  );
}
