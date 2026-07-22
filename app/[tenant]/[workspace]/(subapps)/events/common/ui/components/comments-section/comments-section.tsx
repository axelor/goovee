'use client';

// ---- CORE IMPORTS ---- //
import {Card} from '@/ui/components';
import {SORT_TYPE, Comments} from '@/comments';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {CommentSectionProps} from '@/subapps/events/common/ui/components';
import {
  fetchComments,
  createComment,
} from '@/subapps/events/common/actions/actions';

export const CommentsSection = ({eventId, slug}: CommentSectionProps) => {
  const {workspaceURI} = useWorkspace();
  return (
    <Card className="rounded-2xl border-none shadow-none p-4 w-full space-y-4 ">
      <Comments
        variant="conversation"
        recordId={eventId}
        subapp={SUBAPP_CODES.events}
        inputPosition="bottom"
        sortBy={SORT_TYPE.old}
        showCommentsByDefault
        hideCommentsHeader
        hideSortBy
        hideTopBorder
        hideCloseComments
        showRepliesInMainThread
        disableReply
        createComment={createComment}
        fetchComments={fetchComments}
        trackingField="publicBody"
        commentField="note"
        attachmentDownloadUrl={withBasePath(
          `${workspaceURI}/${SUBAPP_CODES.events}/api/comments/attachments/${slug}`,
        )}
      />
    </Card>
  );
};
