'use client';

import {authClient} from '@/lib/auth-client';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  MdAdd,
  MdClose,
  MdOutlineModeComment,
  MdOutlineThumbUp,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {type SUBAPP_CODES} from '@/constants';
import {DropdownToggle, Separator, Skeleton} from '@/ui/components';
import {cn} from '@/utils/css';
import {i18n} from '@/locale';
import type {ID} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {
  COMMENT,
  COMMENTS,
  DISABLED_COMMENT_PLACEHOLDER,
  SORT_BY_OPTIONS,
  SORT_TYPE,
} from '../constants';
import type {
  CreateComment,
  CreateProps,
  FetchComments,
  TrackingField,
  CommentField,
} from '../types';
import {CommentInput} from './comment-input';
import {CommentsList} from './comments-list';
import {useComments} from '../hooks';

export type CommentsProps = {
  recordId: ID;
  subapp: SUBAPP_CODES;
  inputPosition?: 'top' | 'bottom';
  inputContainerClassName?: string;
  limit?: number;
  sortBy?: SORT_TYPE;
  hideCommentsHeader?: boolean;
  hideCommentsFooter?: boolean;
  showCommentsByDefault?: boolean;
  showReactions?: boolean;
  hideCloseComments?: boolean;
  usePopUpStyles?: boolean;
  hideTopBorder?: boolean;
  disabled?: boolean;
  hideSortBy?: boolean;
  showRepliesInMainThread?: boolean;
  fetchComments: FetchComments;
  createComment: CreateComment;
  trackingField: TrackingField;
  commentField: CommentField;
  disableReply?: boolean;
  placeholder?: string;
  attachmentDownloadUrl: string;
};

export function Comments(props: CommentsProps) {
  const {
    recordId,
    subapp,
    hideCommentsHeader,
    hideCommentsFooter,
    showCommentsByDefault,
    showReactions,
    inputPosition = 'top',
    limit,
    hideCloseComments,
    usePopUpStyles,
    hideTopBorder,
    sortBy: sortByProp = SORT_TYPE.new,
    disabled,
    hideSortBy,
    inputContainerClassName,
    showRepliesInMainThread,
    fetchComments,
    createComment,
    trackingField,
    commentField,
    disableReply,
    placeholder,
    attachmentDownloadUrl,
  } = props;
  const inputOnTop = inputPosition === 'top';
  const [showComments, setShowComments] = useState(showCommentsByDefault);
  const [sortBy, setSortBy] = useState<SORT_TYPE>(sortByProp);
  const hasScrolled = useRef(false);

  const {comments, totalComments, loadMore, onCreate, hasMore} = useComments({
    recordId,
    subapp,
    sortBy,
    limit,
    newCommentOnTop: inputPosition === 'top',
    showRepliesInMainThread: showRepliesInMainThread,
    fetchComments,
    createComment,
  });
  const {data: session} = authClient.useSession();
  const isLoggedIn = !!session?.user?.id;
  const isDisabled = !isLoggedIn || disabled;

  const {tenant} = useWorkspace();

  /* Scroll to the comment referenced in the URL hash (#comment-{id}) on first load. */
  useEffect(() => {
    if (hasScrolled.current || !comments.length) return;

    const match = window.location.hash.match(/^#comment-(.+)$/);
    if (!match) return;

    const commentId = match[1];

    const isLoaded = comments.some(
      c =>
        String(c.id) === commentId ||
        c.childMailMessages?.some(child => String(child.id) === commentId),
    );

    if (!isLoaded) return;

    hasScrolled.current = true;
    setShowComments(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = document.getElementById(`comment-${commentId}`);
        if (!element) return;
        element.classList.add(
          'transition-colors',
          'duration-500',
          'ease-out',
          'bg-success-light',
        );
        element.scrollIntoView({behavior: 'smooth', block: 'center'});
        setTimeout(() => element.classList.remove('bg-success-light'), 1000);
      });
    });
  }, [comments]);

  const toggleComments = () => {
    if (comments.length > 0) {
      setShowComments(prev => !prev);
    }
  };

  const handleCreate = useCallback(
    async (props: CreateProps) => {
      await onCreate(props);
      setShowComments(true);
    },
    [onCreate],
  );

  const handleSortBy = useCallback((value: string) => {
    if (value) setSortBy(value as SORT_TYPE);
  }, []);

  const renderCommentInput = () => (
    <CommentInput
      disabled={isDisabled}
      className={cn(
        'placeholder:text-sm placeholder:text-gray border bg-white',
        isDisabled && 'bg-gray-light placeholder:text-gray-dark',
      )}
      placeholderText={
        isLoggedIn
          ? i18n.t(placeholder || COMMENT)
          : i18n.t(DISABLED_COMMENT_PLACEHOLDER)
      }
      onSubmit={handleCreate}
    />
  );

  return (
    <div className="flex flex-col">
      {!hideCommentsHeader && (
        <div className="flex justify-between px-4 pb-4">
          {/* TODO: Add reactions preview */}
          <div />
          <div
            className={cn(
              'flex gap-2 items-center',
              totalComments && 'cursor-pointer',
            )}
            onClick={toggleComments}>
            <MdOutlineModeComment className="w-6 h-6" />
            {totalComments > 0 && (
              <span className="text-sm">
                {totalComments}{' '}
                {totalComments > 1
                  ? i18n.t(COMMENTS.toLowerCase())
                  : i18n.t(COMMENT.toLowerCase())}
              </span>
            )}
          </div>
        </div>
      )}
      <div
        className={cn({'border-t': !hideTopBorder}, inputContainerClassName)}>
        {inputOnTop && (
          <div className="flex items-center gap-6 py-2">
            {showReactions && (
              <div
                className={cn(
                  'cursor-pointer',
                  isDisabled &&
                    'bg-gray-light text-gray-dark p-2 rounded-lg cursor-not-allowed',
                )}>
                <MdOutlineThumbUp className="w-6 h-6" />
              </div>
            )}
            {renderCommentInput()}
          </div>
        )}
        {showComments && comments?.length ? (
          <div
            className={cn(
              'border-t flex flex-col gap-4',
              usePopUpStyles ? 'py-4 px-4 md:px-0' : 'p-4',
            )}>
            {!hideSortBy && (
              <div className="w-full flex gap-4 items-center">
                <DropdownToggle
                  title={i18n.t('Sort by')}
                  labelClassName="text-xs"
                  value={sortBy}
                  options={SORT_BY_OPTIONS}
                  onSelect={handleSortBy}
                  selectClassName="text-xs h-8"
                  valueClassName="text-xs"
                  optionClassName="text-xs"
                />
                <Separator style={{flexShrink: 1}} />
              </div>
            )}

            <CommentsList
              recordId={recordId}
              disabled={isDisabled}
              comments={comments}
              usePopUpStyles={usePopUpStyles}
              showReactions={showReactions}
              subapp={subapp}
              sortBy={sortBy}
              onSubmit={handleCreate}
              tenantId={tenant}
              commentField={commentField}
              trackingField={trackingField}
              disableReply={disableReply}
              attachmentDownloadUrl={attachmentDownloadUrl}
            />

            {!hideCommentsFooter && (
              <div
                className={cn(
                  'flex items-center justify-between',
                  hideCloseComments && 'justify-end',
                )}>
                {!hideCloseComments && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={toggleComments}>
                    <MdClose className="w-4 h-4" />
                    <span className="text-xs font-semibold leading-[18px]">
                      {i18n.t('Close comments')}
                    </span>
                  </div>
                )}
                {hasMore && (
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={loadMore}>
                    <MdAdd className="w-4 h-4" />
                    <span className="text-xs font-semibold leading-[18px]">
                      {i18n.t('See more')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <></>
        )}
        {!inputOnTop && renderCommentInput()}
      </div>
    </div>
  );
}

export const CommentsSkeleton = () => {
  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="flex justify-between p-4">
        <Skeleton className="w-32 h-7" />
      </div>

      {/* Comments Container */}
      <div className="border-t p-4 flex flex-col gap-4">
        {/* Sort Dropdown */}
        <div className="w-full flex gap-4 items-center">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-px w-full" />
        </div>

        {/* Comment Items */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-3 items-start">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="w-1/4 h-4" />
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-3/4 h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
