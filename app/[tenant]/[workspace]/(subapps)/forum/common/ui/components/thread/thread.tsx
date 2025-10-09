'use client';

import {useEffect, useCallback} from 'react';
import {
  ThreadBody,
  ThreadFooter,
  ThreadHeader,
} from '@/subapps/forum/common/ui/components';
import type {Post} from '@/subapps/forum/common/types/forum';
import {Skeleton} from '@/ui/components';

interface ThreadProps {
  post?: Post;
  showHeader?: boolean;
  showCommentsByDefault?: boolean;
  hideCloseComments?: boolean;
  usePopUpStyles?: boolean;
}

export const Thread = ({
  post,
  showHeader = true,
  showCommentsByDefault = false,
  hideCloseComments = false,
  usePopUpStyles = false,
}: ThreadProps) => {
  const {forumGroup}: any = post || {};

  const scrollToPost = useCallback((postId: string) => {
    const element = document.getElementById(`post-${postId}`);
    if (element) {
      element.classList.add(
        'transition-colors',
        'duration-500',
        'ease-out',
        '!bg-success-light',
      );

      element.scrollIntoView({behavior: 'smooth', block: 'center'});

      setTimeout(() => {
        element.classList.remove('!bg-success-light');
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (post?.id) {
      const hash = window.location.hash.substring(1);
      if (hash === `post-${post.id}`) {
        scrollToPost(post.id);
      }
    }
  }, [post?.id, scrollToPost]);

  return (
    <div
      id={`post-${post?.id}`}
      className="bg-white rounded-lg flex flex-col gap-4 pt-4 pb-0 rounded-t-lg">
      {showHeader && <ThreadHeader group={forumGroup} />}
      <ThreadBody post={post} usePopUpStyles={usePopUpStyles} />
      <ThreadFooter
        post={post}
        usePopUpStyles={usePopUpStyles}
        hideCloseComments={hideCloseComments}
        showCommentsByDefault={showCommentsByDefault}
      />
    </div>
  );
};

export default Thread;

export function ThreadSkeleton({
  galleryPriview = false,
}: {
  galleryPriview?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-md mt-4">
      <div>
        <div className="flex gap-4 ">
          <Skeleton className="rounded-full h-8 w-8" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="w-full h-[1px] my-2" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="rounded-full h-10 w-10" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      {galleryPriview && (
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      <Skeleton className="w-full h-[1px] my-2" />
      <div className="flex items-center gap-[0.625rem]">
        <Skeleton className="w-full h-8" />
        <Skeleton className="w-32 h-8" />
      </div>
    </div>
  );
}
