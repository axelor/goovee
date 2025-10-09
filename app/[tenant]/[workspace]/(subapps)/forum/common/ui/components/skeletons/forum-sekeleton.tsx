'use client';

// ---- CORE IMPORTS ---- //
import {
  GroupControlsSkeleton,
  HeroSkeleton,
  NavMenuSkeleton,
  ThreadListSkeleton,
} from '@/subapps/forum/common/ui/components';
import {ComposePostSkeleton} from '@/subapps/forum/common/ui/components';

export function ForumSkeleton() {
  return (
    <div>
      <div className="hidden lg:block">
        <NavMenuSkeleton count={2} />
      </div>
      <HeroSkeleton />
      <div className="container py-6 mx-auto grid grid-cols-1 md:grid-cols-[17.563rem_1fr] gap-5">
        <GroupControlsSkeleton />
        <div className="flex flex-col gap-2">
          <ComposePostSkeleton />
          <ThreadListSkeleton />
        </div>
      </div>
    </div>
  );
}
