'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
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

  const router = useRouter();

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

  // A soft nav can leave the feed on a stale RSC (URL changes, props don't).
  // Refresh when the query changes — in an effect (after the nav commits), not
  // in the click handler, which would race the push.
  const queryKey =
    [...searchParams.getAll('groups')].sort().join(',') +
    `|${sort}|${search}`;
  const firstQueryRef = useRef(true);
  useEffect(() => {
    if (firstQueryRef.current) {
      firstQueryRef.current = false;
      return;
    }
    router.refresh();
  }, [queryKey, router]);

  const hasMore = posts.length < count;

  // Value keys so loadMore re-binds when the filter changes (arrays get a new
  // identity every render).
  const groupKey = groupIDs.join(',');
  const memberKey = memberGroupIDs.join(',');

  // Bumped on every reseed; a load-more that started under an older generation
  // is discarded so it can't append the previous filter's posts.
  const generationRef = useRef(0);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const generation = generationRef.current;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetchPosts({
        sort,
        search,
        limit: DEFAULT_LIMIT,
        page: nextPage,
        workspaceURL,
        groupIDs: groupKey ? groupKey.split(',') : [],
        memberGroupIDs: memberKey ? memberKey.split(',') : [],
      });

      // Reseeded while in flight — discard.
      if (generation !== generationRef.current) return;

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
      // Only the current generation clears loading.
      if (generation === generationRef.current) setLoading(false);
    }
  }, [
    loading,
    hasMore,
    page,
    sort,
    search,
    workspaceURL,
    toast,
    groupKey,
    memberKey,
  ]);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView, loadMore]);

  // New server data reseeds the list; bump the generation to drop in-flight loads.
  useEffect(() => {
    generationRef.current += 1;
    setPage(1);
    setPosts(initialPosts);
    setScoreByPost(initialScoreByPost);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosts]);

  return {posts, scoreByPost, sentinelRef: ref, loading, hasMore};
}

export default useInfinitePosts;
