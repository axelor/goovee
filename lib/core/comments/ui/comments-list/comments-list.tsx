// ---- CORE IMPORTS ---- //
import {type SUBAPP_CODES} from '@/constants';
import {type Tenant} from '@/tenant';
import type {ID} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {CommentListItem} from '../comments-list-item';
import type {
  Comment,
  CommentField,
  CreateProps,
  TrackingField,
} from '../../types';

type CommentsListProps = {
  recordId: ID;
  comments: Comment[];
  usePopUpStyles?: boolean;
  showReactions?: boolean;
  subapp: SUBAPP_CODES;
  disabled?: boolean;
  sortBy: any;
  onSubmit?: (comment: CreateProps) => Promise<void>;
  tenantId: Tenant['id'];
  commentField: CommentField;
  trackingField: TrackingField;
  disableReply?: boolean;
  attachmentDownloadUrl: string;
  variant?: 'default' | 'conversation';
};

export const CommentsList = ({
  recordId,
  comments,
  usePopUpStyles = false,
  showReactions,
  subapp,
  disabled = false,
  onSubmit,
  sortBy,
  tenantId,
  commentField,
  trackingField,
  disableReply,
  attachmentDownloadUrl,
  variant = 'default',
}: CommentsListProps) => {
  return (
    <div
      className={`flex flex-col gap-2${usePopUpStyles ? ' h-full overflow-auto px-2' : ''}`}>
      {comments.map((comment: any) => (
        <CommentListItem
          key={comment.id}
          disabled={disabled}
          recordId={recordId}
          parentCommentId={comment.id}
          comment={comment}
          showReactions={showReactions}
          subapp={subapp}
          sortBy={sortBy}
          onSubmit={onSubmit}
          tenantId={tenantId}
          commentField={commentField}
          trackingField={trackingField}
          disableReply={disableReply}
          attachmentDownloadUrl={attachmentDownloadUrl}
          variant={variant}
        />
      ))}
    </div>
  );
};
