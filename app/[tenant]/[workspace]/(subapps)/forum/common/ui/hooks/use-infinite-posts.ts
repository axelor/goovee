'use client';

import {useCallback, useEffect, useState} from 'react';
import {useInView} from 'react-intersection-observer';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {DEFAULT_LIMIT} from '@/constants';
import {useSearchParams, useToast} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {PageInfo} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {fetchPosts} from '@/subapps/forum/common/action/action';

export function useInfinitePosts<T extends {id: string | number}>({
  initialPosts,
  pageInfo,
  initialScoreByPost = {},
  groupIDs = [],
  memberGroupIDs = [],
}: {
  initialPosts: T[];
  pageInfo?: PageInfo;
  initialScoreByPost?: Record<string, number>;
  groupIDs?: string[];
  memberGroupIDs?: string[];
}) {
  const count = Number(pageInfo?.count ?? initialPosts.length);

  const [posts, setPosts] = useState<T[]>(initialPosts);
  const [scoreByPost, setScoreByPost] =
    useState<Record<string, number>>(initialScoreByPost);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ref, inView] = useInView();

  const {workspaceURL} = useWorkspace();
  const {toast} = useToast();
  const {searchParams} = useSearchParams();

  const sort = searchParams.get('sort') || '';
  const search = searchParams.get('search') || '';

  const hasMore = posts.length < count;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetchPosts({
        sort,
        search,
        limit: DEFAULT_LIMIT,
        page: nextPage,
        workspaceURL,
        groupIDs,
        memberGroupIDs,
      });

      if ((res as {error?: boolean})?.error) {
        toast({
          variant: 'destructive',
          title: i18n.t(
            (res as {message?: string}).message || 'An error occurred',
          ),
        });
        return;
      }

      const {posts: newPosts = [], scoreByPost: newScores = {}} = res as {
        posts?: T[];
        scoreByPost?: Record<string, number>;
      };

      if (newPosts.length) {
        setPage(nextPage);
        setPosts(prev => [...prev, ...newPosts]);
        setScoreByPost(prev => ({...prev, ...newScores}));
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoading(false);
    }
    // groupIDs/memberGroupIDs are stable per navigation (server props)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore, page, sort, search, workspaceURL, toast]);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView, loadMore]);

  // A new server query (sort/search change re-runs the page) reseeds the list.
  useEffect(() => {
    setPage(1);
    setPosts(initialPosts);
    setScoreByPost(initialScoreByPost);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosts]);

  return {posts, scoreByPost, sentinelRef: ref, loading, hasMore};
}

export default useInfinitePosts;
