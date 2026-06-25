'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useInView} from 'react-intersection-observer';
import {useParams} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useSearchParams} from '@/ui/hooks';
import {DEFAULT_LIMIT} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useToast} from '@/ui/hooks';
import {PageInfo} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {Thread} from '@/subapps/forum/common/ui/components';
import {fetchPosts} from '@/subapps/forum/common/action/action';
import {PostWithMembership} from '@/subapps/forum/common/types/forum';

interface InfiniteScrollProps {
  initialPosts: PostWithMembership[];
  pageInfo: PageInfo;
  memberGroupIDs: string[];
  selectedGroupId: string | null;
  enableComment: boolean;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  initialPosts,
  pageInfo,
  memberGroupIDs,
  selectedGroupId,
  enableComment,
}) => {
  const {count} = pageInfo;
  const [posts, setPosts] = useState<PostWithMembership[]>(initialPosts);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [ref, inView] = useInView();

  const {workspaceURL} = useWorkspace();
  const params = useParams();
  const {toast} = useToast();

  const {searchParams} = useSearchParams();
  const sort = useMemo(() => searchParams.get('sort') || '', [searchParams]);
  const limit = useMemo(
    () => searchParams.get('limit') || DEFAULT_LIMIT,
    [searchParams],
  );

  const loadMorePosts = useCallback(async () => {
    if (loading || posts.length >= Number(count)) return;

    setLoading(true);

    try {
      const nextPage = page + 1;
      const response = await fetchPosts({
        sort,
        limit: Number(limit),
        page: nextPage,
        workspaceURL,
        memberGroupIDs,
        ...(selectedGroupId && {
          groupIDs: [selectedGroupId],
        }),
      });

      const res = response as {
        error?: boolean;
        message?: string;
        posts?: PostWithMembership[];
      };
      if (res.error) {
        toast({
          variant: 'destructive',
          title: i18n.t(res.message || 'An error occurred'),
        });
        return;
      }

      if (res.posts && res.posts.length > 0) {
        setPage(nextPage);
        setPosts(prevPosts => [...prevPosts, ...(res.posts ?? [])]);
      }
    } catch (error) {
      console.error('Error occurred while loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [
    count,
    limit,
    loading,
    memberGroupIDs,
    page,
    posts.length,
    selectedGroupId,
    sort,
    toast,
    workspaceURL,
  ]);

  useEffect(() => {
    if (inView) {
      loadMorePosts();
    }
  }, [inView, loadMorePosts]);

  useEffect(() => {
    setPage(1);
    setPosts(initialPosts);
  }, [sort, limit, initialPosts]);

  return (
    <>
      {posts.map(post => (
        <Thread
          key={post.id}
          post={post}
          showHeader={!params.id}
          enableComment={enableComment}
        />
      ))}

      {posts.length < Number(count ?? 0) && (
        <div
          ref={ref}
          className="col-span-1 mt-16 flex items-center justify-center sm:col-span-2 md:col-span-3 lg:col-span-4">
          <p>{i18n.t('Loading')}...</p>
        </div>
      )}
    </>
  );
};

export default InfiniteScroll;
