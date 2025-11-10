'use client';

import React from 'react';

// ---- CORE IMPORTS ---- //
import {DropdownToggle, Separator} from '@/ui/components';
import {i18n} from '@/locale';
import {useSearchParams} from '@/ui/hooks';
import {URL_PARAMS} from '@/constants';
import {SORT_BY_OPTIONS} from '@/comments';

// ---- LOCAL IMPORTS ---- //
import {
  InfiniteScroll,
  ThreadSkeleton,
} from '@/subapps/forum/common/ui/components';
import {Post} from '@/subapps/forum/common/types/forum';

export const ThreadList = ({
  posts,
  pageInfo,
}: {
  posts: Post[];
  pageInfo: any;
}) => {
  const {update, searchParams} = useSearchParams();
  const sort = searchParams.get('sort') ?? 'new';

  const handleSortBy = (value: any) => {
    if (!value) {
      return;
    }
    update([{key: URL_PARAMS.sort, value}], {scroll: false});
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full flex gap-4 items-center">
        <div>{i18n.t('Thread')}</div>
        <Separator
          style={{
            flexShrink: 1,
          }}
        />
        <DropdownToggle
          title={i18n.t('Sort by')}
          value={sort}
          options={SORT_BY_OPTIONS}
          onSelect={handleSortBy}
        />
      </div>
      {!posts?.length ? (
        <div>{i18n.t('No posts available.')}</div>
      ) : (
        <div className="flex flex-col gap-4">
          <InfiniteScroll initialPosts={posts} pageInfo={pageInfo} />
        </div>
      )}
    </div>
  );
};

export default ThreadList;

export function ThreadListSkeleton({postCount = 3}: {postCount?: number}) {
  const showImageView = Math.floor(Math.random() * postCount);
  return (
    <div>
      {[...Array(postCount)].map((_, i) => (
        <ThreadSkeleton key={i} galleryPriview={i === showImageView} />
      ))}
    </div>
  );
}
