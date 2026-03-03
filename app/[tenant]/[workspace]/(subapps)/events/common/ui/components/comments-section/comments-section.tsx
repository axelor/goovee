'use client';

// ---- CORE IMPORTS ---- //
import {Card} from '@/ui/components';
import {i18n} from '@/locale';
import {SORT_TYPE, Comments} from '@/comments';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

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
      <h2 className="text-xl font-semibold">{i18n.t('Comments')}</h2>

      <Comments
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
        createComment={createComment}
        fetchComments={fetchComments}
        trackingField="publicBody"
        commentField="note"
        attachmentDownloadUrl={`${workspaceURI}/${SUBAPP_CODES.events}/api/comments/attachments/${slug}`}
      />
    </Card>
  );
};
