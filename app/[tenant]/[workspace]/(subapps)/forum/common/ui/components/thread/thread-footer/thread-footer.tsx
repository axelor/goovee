'use client';

import {useMemo} from 'react';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {Comments} from '@/comments';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {
  COMMENTS_PER_LOAD,
  JOIN_GROUP_TO_COMMENT,
} from '@/subapps/forum/common/constants';
import {
  fetchComments,
  createComment,
} from '@/subapps/forum/common/action/action';
import {PostWithMembership} from '@/subapps/forum/common/types/forum';

export const ThreadFooter = ({
  post,
  showCommentsByDefault,
  hideCloseComments = false,
  usePopUpStyles = false,
  enableComment,
}: {
  post?: PostWithMembership;
  showCommentsByDefault: boolean;
  hideCloseComments?: boolean;
  usePopUpStyles?: boolean;
  enableComment: boolean;
}) => {
  const isAllowToComment = useMemo(() => post?.isMember, [post]);

  const {workspaceURI} = useWorkspace();

  if (!post) return <div />;

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
      attachmentDownloadUrl={withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.forum}/api/comments/attachments/${post.id}`,
      )}
    />
  ) : (
    <div />
  );
};

export default ThreadFooter;
