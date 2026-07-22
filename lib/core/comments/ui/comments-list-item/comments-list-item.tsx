import {authClient} from '@/lib/auth-client';
import {useMemo, useState} from 'react';
import {
  MdFavoriteBorder,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdNorth,
  MdOutlineModeComment,
  MdOutlineMoreHoriz,
  MdOutlineSouth,
  MdOutlineThumbUp,
  MdReply,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {NOT_INTERESTED, REPORT, SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/locale/formatters';
import {type Tenant} from '@/tenant';
import type {ID} from '@/types';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  InnerHTML,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/components';
import {cn} from '@/utils/css';
import {getPartnerImageURL} from '@/utils/files';

// ---- LOCAL IMPORTS ---- //
import {
  COMMENT,
  COMMENTS,
  DISABLED_COMMENT_PLACEHOLDER,
  SORT_TYPE,
} from '../../constants';
import type {
  Comment,
  CommentField,
  CreateProps,
  TrackingField,
} from '../../types';
import {isTrackObject, parseCommentContent} from '../../utils/helpers';
import {CommentInput} from '../comment-input';
import {CommentAttachments, CommentTracks} from '../comments-list';

interface CommentListItemProps {
  recordId: ID;
  parentCommentId: string;
  comment: Comment;
  showReactions?: boolean;
  subapp: SUBAPP_CODES;
  disabled: boolean;
  isTopLevel?: boolean;
  sortBy?: SORT_TYPE;
  onSubmit?: (data: CreateProps) => Promise<void>;
  tenantId: Tenant['id'];
  commentField: CommentField;
  trackingField: TrackingField;
  disableReply?: boolean;
  attachmentDownloadUrl: string;
  variant?: 'default' | 'conversation';
}

/** Initials (max 2 chars) from a display name, for avatar fallbacks. */
export function getInitials(name?: string | null): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const CommentListItem = ({
  recordId,
  parentCommentId,
  comment,
  showReactions,
  subapp,
  disabled = false,
  isTopLevel = true,
  sortBy,
  onSubmit,
  tenantId,
  commentField,
  trackingField,
  disableReply,
  attachmentDownloadUrl,
  variant = 'default',
}: CommentListItemProps) => {
  const [showSubComments, setShowSubComments] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [toggle, setToggle] = useState(false);

  const {
    createdOn,
    childMailMessages = [],
    id,
    mailMessageFileList = [],
    createdBy,
    parentMailMessage,
    partner,
  } = comment || {};

  const commentFiedValue = comment[commentField];
  const trackingFieldValue = comment[trackingField];

  const isConversation = variant === 'conversation';
  // Portal contacts carry a `partner` (client side); staff-authored messages
  // only have `createdBy` (internal Axelor user) — the "Atlas" side.
  const isProvider = !partner;
  const authorName = partner
    ? (partner.simpleFullName ?? partner.name)
    : createdBy?.fullName;

  const commentToDisplay = useMemo(() => {
    const value = parseCommentContent(commentFiedValue);
    if (typeof value === 'string') return value;
    return null;
  }, [commentFiedValue]);
  const trackingToDisplay = useMemo(
    () => parseCommentContent(trackingFieldValue),
    [trackingFieldValue],
  );

  const {data: session} = authClient.useSession();
  const isLoggedIn = Boolean(session?.user?.id);
  const isDisabled = !isLoggedIn || disabled;

  const scrollToComment = (id: ID) => {
    const element = document.querySelector(`#comment-${id}`);
    if (element) {
      element.classList.add(
        'transition-colors',
        'duration-500',
        'ease-out',
        'bg-royal-pale',
      );
      element.scrollIntoView({behavior: 'smooth', block: 'center'});
      setTimeout(() => {
        element.classList.remove('bg-royal-pale');
      }, 1000);
    }
  };

  const toggleSubComments = () => {
    if (!!childMailMessages?.length) setShowSubComments(prev => !prev);
  };

  const toggleCommentInput = () => setShowCommentInput(prev => !prev);

  const handleCommentSubmit = async (data: CreateProps) => {
    if (onSubmit) {
      try {
        await onSubmit({
          ...data,
          parent: parentMailMessage?.id || parentCommentId,
        });
      } catch (error) {
        console.error('Error submitting comment:', error);
      } finally {
        setShowSubComments(true);
        setShowCommentInput(false);
      }
    } else {
      console.warn('onSubmit is undefined.');
    }
  };

  const renderChildComments = () => {
    if (
      !showSubComments ||
      parentCommentId !== id ||
      !childMailMessages?.length
    ) {
      return null;
    }
    return childMailMessages.map((childComment: any) => (
      <CommentListItem
        key={childComment.id}
        recordId={recordId}
        parentCommentId={parentCommentId}
        comment={childComment}
        showReactions={showReactions}
        subapp={subapp}
        isTopLevel={false}
        disabled={isDisabled}
        onSubmit={onSubmit}
        tenantId={tenantId}
        commentField={commentField}
        trackingField={trackingField}
        disableReply={disableReply}
        attachmentDownloadUrl={attachmentDownloadUrl}
        variant={variant}
      />
    ));
  };

  const renderAvatar = (pictureId: ID, name?: string | null) => (
    <Avatar className="rounded-full h-7 w-7 bg-peach-avatar text-white text-[10px] font-bold overflow-hidden">
      <AvatarImage
        src={getPartnerImageURL(pictureId, tenantId)}
        alt={name ?? ''}
        size={28}
      />
    </Avatar>
  );

  const renderParentMessage = () => {
    if (!parentMailMessage?.id) return null;

    const {partner, createdBy} = parentMailMessage;
    const parentCommentFieldValue = parentMailMessage[commentField];
    const parentCommentToDisplay = parseCommentContent(parentCommentFieldValue);
    if (!parentCommentToDisplay || typeof parentCommentToDisplay !== 'string') {
      return null;
    }
    return (
      <div className="p-3 border-l-[3px] border-royal bg-royal-pale rounded-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {subapp === SUBAPP_CODES.forum && partner?.picture
              ? renderAvatar(
                  partner?.picture?.id,
                  partner.simpleFullName ?? partner.name,
                )
              : null}
            <div className="font-semibold text-sm text-ink-900">
              {partner
                ? (partner.simpleFullName ?? partner.name)
                : createdBy?.fullName}
            </div>
            <TooltipComponent
              triggerText={`${i18n.t('Updated')} ${formatRelativeTime(parentMailMessage?.createdOn!)}`}
              tooltipText={formatDateTime(parentMailMessage?.createdOn!, {
                dateFormat: 'LL,',
                timeFormat: ' h:mm a',
              })}
            />
          </div>
          <div className="flex items-center gap-2 text-ink-500">
            {toggle ? (
              <MdKeyboardArrowUp
                className="w-4 h-4 cursor-pointer"
                onClick={() => setToggle(false)}
              />
            ) : (
              <MdKeyboardArrowDown
                className="w-4 h-4 cursor-pointer"
                onClick={() => setToggle(true)}
              />
            )}
            {sortBy === SORT_TYPE.old ? (
              <MdNorth
                className="w-4 h-4 cursor-pointer"
                onClick={() => scrollToComment(parentMailMessage?.id)}
              />
            ) : (
              <MdOutlineSouth
                className="w-4 h-4 cursor-pointer"
                onClick={() => scrollToComment(parentMailMessage?.id)}
              />
            )}
          </div>
        </div>
        <div className="mt-1">
          <InnerHTML
            className={cn(
              'text-sm w-full font-normal text-ink-700',
              !toggle && 'line-clamp-1',
            )}
            content={parentCommentToDisplay}
          />
        </div>
      </div>
    );
  };

  const renderReactions = () => (
    <div className="flex items-center gap-6 mt-1 mb-2">
      <div className="flex items-center rounded-lg border h-7">
        <div className="w-8 h-full px-2 py-1 border-r">
          <MdOutlineThumbUp className="cursor-pointer" />
        </div>
        <div className="flex items-center px-2 py-1">
          <MdOutlineThumbUp className="cursor-pointer" />
          <MdFavoriteBorder className="cursor-pointer" />
        </div>
      </div>
      <Separator orientation="vertical" className="h-6 bg-black" />
    </div>
  );

  if (!comment) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl transition-colors',
        isTopLevel &&
          !isConversation &&
          'bg-white border border-ink-100 shadow-xs p-4',
        isTopLevel &&
          isConversation &&
          cn(
            'border p-[18px]',
            isProvider
              ? 'bg-royal-pale border-royal-border'
              : 'bg-white border-ink-100',
          ),
      )}
      key={id}
      id={`comment-${id}`}>
      <div className="flex gap-2 justify-between items-center">
        <div className="flex items-center gap-2.5">
          {isConversation ? (
            // Prefer the author's account profile picture; fall back to the
            // coloured initials avatar when there is none (or it fails to load).
            <Avatar className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
              {partner?.picture?.id && (
                <AvatarImage
                  src={getPartnerImageURL(partner.picture.id, tenantId)}
                  alt={authorName ?? ''}
                  size={36}
                />
              )}
              <AvatarFallback
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold text-white',
                  isProvider ? 'bg-mint-logo' : 'bg-peach-avatar',
                )}>
                {getInitials(authorName)}
              </AvatarFallback>
            </Avatar>
          ) : subapp === SUBAPP_CODES.forum && partner?.picture ? (
            renderAvatar(
              partner?.picture?.id,
              partner.simpleFullName ?? partner.name,
            )
          ) : null}
          <div className="font-semibold text-sm text-ink-900 leading-tight">
            {authorName}
          </div>
          <span className="text-ink-300">·</span>
          <TooltipComponent
            triggerText={formatRelativeTime(createdOn!)}
            tooltipText={formatDateTime(createdOn!, {
              dateFormat: 'LL,',
              timeFormat: ' h:mm a',
            })}
          />
        </div>
        {false && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger>
                <MdOutlineMoreHoriz className="w-6 h-6 cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-fit">
                <div className="flex flex-col gap-[10px] p-4 bg-white rounded-lg text-xs leading-[18px]">
                  <div className="cursor-pointer">{i18n.t(REPORT)}</div>
                  <div className="cursor-pointer">{i18n.t(NOT_INTERESTED)}</div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
      <div className={cn(isTopLevel ? '' : 'pl-10')}>
        {trackingToDisplay && isTrackObject(trackingToDisplay) && (
          <CommentTracks data={trackingToDisplay} variant={variant} />
        )}
        {!!mailMessageFileList?.length && (
          <CommentAttachments
            attachments={mailMessageFileList}
            attachmentDownloadUrl={attachmentDownloadUrl}
          />
        )}

        <div className="flex flex-col gap-2">
          {renderParentMessage()}
          {commentToDisplay && (
            <InnerHTML
              className="text-sm w-full font-normal text-ink-700 leading-relaxed"
              content={commentToDisplay}
            />
          )}
          <div className="flex items-center gap-4">
            {showReactions && renderReactions()}
            {commentToDisplay && !disableReply && (
              <div className="flex gap-4 items-center">
                <button
                  type="button"
                  className="flex items-center gap-1 text-royal hover:underline font-semibold"
                  onClick={toggleCommentInput}>
                  <MdReply className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{i18n.t('Reply')}</span>
                </button>

                {parentCommentId === id && !!childMailMessages?.length && (
                  <>
                    <Separator
                      orientation="vertical"
                      className="h-3 bg-ink-200"
                    />
                    <button
                      type="button"
                      className={cn(
                        'flex items-center gap-1 text-[11px] font-semibold text-ink-500 hover:text-ink-700',
                        childMailMessages.length && 'cursor-pointer',
                      )}
                      onClick={toggleSubComments}>
                      <MdOutlineModeComment className="w-3.5 h-3.5" />
                      {formatNumber(childMailMessages.length)}{' '}
                      {i18n.t(
                        childMailMessages.length > 1
                          ? COMMENTS.toLowerCase()
                          : COMMENT.toLowerCase(),
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {showCommentInput && (
            <div
              className={cn(
                'my-2',
                isConversation &&
                  'rounded-xl border border-ink-100 bg-white p-3 transition-shadow focus-within:border-royal focus-within:shadow-[0_0_0_3px_rgba(21,84,181,0.12)]',
              )}>
              <CommentInput
                autoFocus
                bare={isConversation}
                disabled={isDisabled}
                className={cn(
                  'placeholder:text-sm placeholder:text-gray',
                  isConversation
                    ? 'border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0'
                    : 'border bg-white',
                  isDisabled && 'bg-gray-light placeholder:text-gray-dark',
                )}
                placeholderText={
                  isLoggedIn
                    ? i18n.t(COMMENT)
                    : i18n.t(DISABLED_COMMENT_PLACEHOLDER)
                }
                onSubmit={handleCommentSubmit}
              />
            </div>
          )}
          {!disableReply && renderChildComments()}
        </div>
      </div>
    </div>
  );
};

const TooltipComponent = ({
  triggerText,
  tooltipText,
}: {
  triggerText: string;
  tooltipText: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <div className="text-[11px] text-ink-500 leading-tight">
          {triggerText}
        </div>
      </TooltipTrigger>
      <TooltipContent align="start" className="px-3 py-1 text-[11px]">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
