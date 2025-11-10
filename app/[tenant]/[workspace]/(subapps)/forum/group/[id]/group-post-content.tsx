// ---- CORE IMPORTS ---- //
import {DEFAULT_LIMIT} from '@/constants';
import {PortalWorkspace, User} from '@/types';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {findPostsByGroupId} from '@/subapps/forum/common/orm/forum';
import {ThreadList} from '@/subapps/forum/common/ui/components';

export async function GroupPostsContent({
  params,
  searchParams,
  workspace,
  memberGroupIDs,
  user,
  tenant,
}: {
  params: {
    id: string;
    tenant: string;
    workspace: string;
  };
  searchParams: {[key: string]: string | undefined};
  workspace: PortalWorkspace;
  memberGroupIDs: string[];
  user: User;
  tenant: string;
}) {
  const {sort, limit, search} = searchParams;
  const groupId = params.id as string;

  const {posts, pageInfo} = await findPostsByGroupId({
    id: groupId,
    workspaceID: workspace?.id as string,
    sort,
    limit: limit ? Number(limit) : DEFAULT_LIMIT,
    search,
    tenantId: tenant,
    user,
    memberGroupIDs,
  }).then(clone);

  return (
    <div className="w-full mt-6">
      <ThreadList pageInfo={pageInfo} posts={posts} />
    </div>
  );
}
