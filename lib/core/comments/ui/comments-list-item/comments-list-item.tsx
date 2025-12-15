import {useSession} from 'next-auth/react';
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

  const commentToDisplay = useMemo(() => {
    const value = parseCommentContent(commentFiedValue);
    if (typeof value === 'string') return value;
    return null;
  }, [commentFiedValue]);
  const trackingToDisplay = useMemo(
    () => parseCommentContent(trackingFieldValue),
    [trackingFieldValue],
  );

  const {data: session} = useSession();
  const isLoggedIn = Boolean(session?.user?.id);
  const isDisabled = !isLoggedIn || disabled;

  const scrollToComment = (id: ID) => {
    const element = document.querySelector(`#comment-${id}`);
    if (element) {
      element.classList.add(
        'transition-colors',
        'duration-500',
        'ease-out',
        'bg-success-light',
      );
      element.scrollIntoView({behavior: 'smooth', block: 'center'});
      setTimeout(() => {
        element.classList.remove('bg-success-light');
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
      />
    ));
  };

  const renderAvatar = (pictureId: ID) => (
    <Avatar className="rounded-full h-6 w-6">
      <AvatarImage src={getPartnerImageURL(pictureId, tenantId)} />
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
      <div className="p-2 border-l-2 border-success bg-success-light rounded-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {subapp === SUBAPP_CODES.forum && partner?.picture
              ? renderAvatar(partner?.picture?.id)
              : null}
            <div className="font-semibold text-sm">
              {partner
                ? (partner.simpleFullName ?? partner.name)
                : createdBy?.fullName}
            </div>
            <TooltipComponent
              triggerText={`${i18n.t('Updated')} ${formatRelativeTime(parentMailMessage?.createdOn!)}`}
              tooltipText={formatDateTime(parentMailMessage?.createdOn!, {
                dateFormat: 'MMMM DD YYYY,',
                timeFormat: ' h:mm a',
              })}
            />
          </div>
          <div className="flex items-center gap-2">
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
                className="cursor-pointer"
                onClick={() => scrollToComment(parentMailMessage?.id)}
              />
            ) : (
              <MdOutlineSouth
                className="cursor-pointer"
                onClick={() => scrollToComment(parentMailMessage?.id)}
              />
            )}
          </div>
        </div>
        <div>
          <InnerHTML
            className={cn(
              'text-sm w-full font-normal',
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
    <div className="flex flex-col gap-1" key={id} id={`comment-${id}`}>
      <div className="flex gap-2 justify-between items-center border-b-2 border-dotted">
        <div className="flex items-center gap-2">
          {subapp === SUBAPP_CODES.forum && partner?.picture
            ? renderAvatar(partner?.picture?.id)
            : null}
          <div className="font-semibold text-sm leading-[21px] ">
            {partner
              ? (partner.simpleFullName ?? partner.name)
              : createdBy?.fullName}
          </div>
          <TooltipComponent
            triggerText={`${i18n.t('Updated')} ${formatRelativeTime(createdOn!)}`}
            tooltipText={formatDateTime(createdOn!, {
              dateFormat: 'MMMM DD YYYY,',
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
      <div className={`${isTopLevel ? 'ml-3 pl-10' : 'pl-8'}`}>
        {trackingToDisplay && isTrackObject(trackingToDisplay) && (
          <CommentTracks data={trackingToDisplay} />
        )}
        {!!mailMessageFileList?.length && (
          <CommentAttachments
            attachments={mailMessageFileList}
            attachmentDownloadUrl={attachmentDownloadUrl}
          />
        )}

        <div className="flex flex-col">
          {renderParentMessage()}
          {commentToDisplay && (
            <InnerHTML
              className="text-sm w-full font-normal"
              content={commentToDisplay}
            />
          )}
          <div className="flex items-center gap-6 mt-1 mb-2">
            {showReactions && renderReactions()}
            {commentToDisplay && !disableReply && (
              <div className="flex gap-6 items-center">
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={toggleCommentInput}>
                  <MdReply className="w-4 h-4" />
                  <span className="text-[10px]">{i18n.t('Reply')}</span>
                </div>

                {parentCommentId === id && !!childMailMessages?.length && (
                  <>
                    <Separator
                      orientation="vertical"
                      className="h-6 bg-black"
                    />
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[10px]',
                        childMailMessages.length && 'cursor-pointer',
                      )}
                      onClick={toggleSubComments}>
                      <MdOutlineModeComment className="w-4 h-4 cursor-pointer" />
                      {formatNumber(childMailMessages.length)}{' '}
                      {i18n.t(
                        childMailMessages.length > 1
                          ? COMMENTS.toLowerCase()
                          : COMMENT.toLowerCase(),
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {showCommentInput && (
            <div className="my-2">
              <CommentInput
                autoFocus
                disabled={isDisabled}
                className={cn(
                  'placeholder:text-sm placeholder:text-gray border bg-white',
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
        <div className="text-[10px] leading-3">{triggerText}</div>
      </TooltipTrigger>
      <TooltipContent align="start" className="px-4 py-1 text-[10px]">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
