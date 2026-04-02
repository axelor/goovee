'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {ID} from '@/types';
import type {Cloned} from '@/types/util';
import {useToast} from '@/ui/hooks';
import {packIntoFormData} from '@/utils/formdata';

// ---- LOCAL IMPORTS ---- //
import {SORT_TYPE} from '../constants';
import type {
  Comment,
  CreateComment,
  CreateCommentProps,
  CreateProps,
  FetchComments,
} from '../types';

export type UseCommentsProps = {
  sortBy: SORT_TYPE;
  recordId: ID;
  subapp: SUBAPP_CODES;
  limit?: number;
  newCommentOnTop?: boolean;
  showRepliesInMainThread?: boolean;
  fetchComments: FetchComments;
  createComment: CreateComment;
};

export function useComments(props: UseCommentsProps) {
  const {
    sortBy,
    recordId,
    limit,
    newCommentOnTop,
    showRepliesInMainThread,
    fetchComments,
    createComment,
  } = props;
  const [comments, setComments] = useState<Cloned<Comment>[]>([]);
  const [totalMainThread, setTotalMainThread] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const {workspaceURL, workspaceURI} = useWorkspace();
  const {toast} = useToast();

  const loadComments = useCallback(
    async (options?: {reset?: boolean; exclude?: ID[]}) => {
      const {reset = true, exclude} = options || {};
      setFetching(true);
      try {
        const {error, message, data} = await fetchComments({
          recordId,
          sort: sortBy,
          limit,
          workspaceURL,
          exclude,
          showRepliesInMainThread,
        });

        if (error) {
          toast({variant: 'destructive', title: message});
          return;
        }
        const {comments, total, totalCommentThreadCount} = data;
        setTotalMainThread((total || 0) + (exclude?.length || 0));
        setTotalComments(totalCommentThreadCount);
        setComments(prevComments =>
          reset ? comments : [...prevComments, ...comments],
        );
      } catch (e) {
        toast({
          variant: 'destructive',
          title:
            e instanceof Error ? e.message : i18n.t('Failed to load comments.'),
        });
      } finally {
        setFetching(false);
      }
    },
    [
      recordId,
      sortBy,
      toast,
      workspaceURL,
      limit,
      showRepliesInMainThread,
      fetchComments,
    ],
  );

  const loadMore = useCallback(() => {
    if (fetching || creating) return;
    loadComments({reset: false, exclude: comments.map(c => c.id)});
  }, [loadComments, fetching, creating, comments]);

  const handleCreate = useCallback(
    async ({data: commentData, parent}: CreateProps) => {
      setCreating(true);
      try {
        const createCommentProps: CreateCommentProps = {
          data: commentData,
          workspaceURL,
          workspaceURI,
          recordId,
          parentId: parent,
          showRepliesInMainThread,
        };
        const formData = packIntoFormData(createCommentProps);

        const {error, message, data} = await createComment(formData);
        if (error) {
          toast({
            variant: 'destructive',
            title: i18n.t(message),
          });
          return;
        }

        const [comment, parentComment] = data;
        const isMainThread = !parentComment;
        const isNewComment = isMainThread || showRepliesInMainThread;
        setComments(prevComments => {
          const replaced = copyAndReplaceParent(prevComments, parentComment);
          if (isNewComment) {
            if (newCommentOnTop) replaced.unshift(comment);
            else replaced.push(comment);
          }
          return replaced;
        });
        setTotalMainThread(p => (isNewComment ? p + 1 : p));
        setTotalComments(p => p + 1);
        toast({
          variant: 'success',
          title: i18n.t('Comment created successfully.'),
        });
      } catch (e) {
        toast({
          variant: 'destructive',
          title:
            e instanceof Error
              ? e.message
              : i18n.t('An unexpected error occurred.'),
        });
      } finally {
        setCreating(false);
      }
    },
    [
      workspaceURL,
      workspaceURI,
      recordId,
      toast,
      newCommentOnTop,
      showRepliesInMainThread,
      createComment,
    ],
  );

  const hasMore = useMemo(
    () => comments.length < totalMainThread,
    [comments, totalMainThread],
  );

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return useMemo(
    () => ({
      comments,
      totalMainThread,
      hasMore,
      loadMore,
      fetching,
      creating,
      totalComments,
      onCreate: handleCreate,
    }),
    [
      loadMore,
      comments,
      totalMainThread,
      hasMore,
      fetching,
      creating,
      totalComments,
      handleCreate,
    ],
  );
}

function copyAndReplaceParent<T extends {id: ID}>(
  comments: T[],
  parent?: NoInfer<T>,
): T[] {
  if (!parent) return [...comments];
  return comments.map(c => (String(c.id) !== String(parent.id) ? c : parent));
}
