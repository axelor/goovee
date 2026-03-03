'use client';

import React, {useEffect, useState, useMemo} from 'react';
import {useInView} from 'react-intersection-observer';
import {useParams} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useSearchParams} from '@/ui/hooks';
import {DEFAULT_LIMIT} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {Thread} from '@/subapps/forum/common/ui/components';
import {fetchPosts} from '@/subapps/forum/common/action/action';
import {Post} from '@/subapps/forum/common/types/forum';
import {PortalWorkspace} from '@/types';

interface PageInfo {
  count: number;
}

interface InfiniteScrollProps {
  initialPosts: Post[];
  pageInfo: PageInfo;
  memberGroupIDs: string[];
  selectedGroupId: string | null;
  workspace: PortalWorkspace | null;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  initialPosts,
  pageInfo,
  memberGroupIDs,
  selectedGroupId,
  workspace,
}) => {
  const {count} = pageInfo;
  const [posts, setPosts] = useState<Post[]>(initialPosts);
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

  const loadMorePosts = async () => {
    if (loading || posts.length >= Number(count)) return;

    setLoading(true);

    try {
      const nextPage = page + 1;
      const response: any = await fetchPosts({
        sort,
        limit: Number(limit),
        page: nextPage,
        workspaceURL,
        memberGroupIDs,
        ...(selectedGroupId && {
          groupIDs: [selectedGroupId],
        }),
      });

      if (response.error) {
        toast({
          variant: 'destructive',
          title: i18n.t(response.message || 'An error occurred'),
        });
        return;
      }

      if (response.posts?.length > 0) {
        setPage(nextPage);
        setPosts(prevPosts => [...prevPosts, ...response.posts]);
      }
    } catch (error) {
      console.error('Error occurred while loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inView) {
      loadMorePosts();
    }
  }, [inView]);

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
          workspace={workspace}
        />
      ))}

      {posts.length < count && (
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
