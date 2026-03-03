'use client';
import {useMemo} from 'react';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {isCommentEnabled, Comments} from '@/comments';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {
  COMMENTS_PER_LOAD,
  JOIN_GROUP_TO_COMMENT,
} from '@/subapps/forum/common/constants';
import {
  fetchComments,
  createComment,
} from '@/subapps/forum/common/action/action';
import {PortalWorkspace} from '@/types';

export const ThreadFooter = ({
  post,
  showCommentsByDefault,
  hideCloseComments = false,
  usePopUpStyles = false,
  workspace,
}: {
  post: any;
  showCommentsByDefault: boolean;
  hideCloseComments?: boolean;
  usePopUpStyles?: boolean;
  workspace: PortalWorkspace | null;
}) => {
  const isAllowToComment = useMemo(() => post.isMember, [post]);
  const {workspaceURI} = useWorkspace();

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.forum,
    workspace: workspace!,
  });

  return enableComment ? (
    <Comments
      recordId={post.id}
      subapp={SUBAPP_CODES.forum}
      showCommentsByDefault={showCommentsByDefault}
      hideCloseComments={hideCloseComments}
      usePopUpStyles={usePopUpStyles}
      disabled={!isAllowToComment}
      inputContainerClassName={!usePopUpStyles ? 'px-4' : ''}
      limit={COMMENTS_PER_LOAD}
      trackingField="publicBody"
      commentField="note"
      fetchComments={fetchComments}
      createComment={createComment}
      {...(!isAllowToComment && {
        placeholder: JOIN_GROUP_TO_COMMENT,
      })}
      attachmentDownloadUrl={`${workspaceURI}/${SUBAPP_CODES.forum}/api/comments/attachments/${post.id}`}
    />
  ) : (
    <div />
  );
};

export default ThreadFooter;
