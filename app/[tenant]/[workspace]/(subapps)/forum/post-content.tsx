// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {Cloned} from '@/types/util';
import {DEFAULT_LIMIT} from '@/constants';
import {User} from '@/types';
import {WorkspaceLight} from '@/orm/workspace';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {findPosts} from '@/subapps/forum/common/orm/forum';
import {ThreadList} from '@/subapps/forum/common/ui/components';

export async function PostsContent({
  searchParams,
  workspace,
  enableComment,
  groupIDs,
  memberGroupIDs,
  user,
  client,
}: {
  searchParams: {[key: string]: string | undefined};
  workspace: WorkspaceLight | Cloned<WorkspaceLight>;
  enableComment: boolean;
  groupIDs: string[];
  memberGroupIDs: string[];
  user: User | null;
  client: Client;
}) {
  const {sort, limit, search, searchid} = searchParams;

  const {posts, pageInfo} = await findPosts({
    sort,
    limit: limit ? Number(limit) : DEFAULT_LIMIT,
    search,
    ids: searchid ? [searchid] : undefined,
    workspaceID: workspace.id,
    groupIDs,
    client,
    user: user ?? undefined,
    memberGroupIDs,
  }).then(clone);

  return (
    <div className="w-full mt-6">
      <ThreadList
        pageInfo={pageInfo}
        posts={posts}
        memberGroupIDs={memberGroupIDs}
        selectedGroupId={null}
        enableComment={enableComment}
      />
    </div>
  );
}
