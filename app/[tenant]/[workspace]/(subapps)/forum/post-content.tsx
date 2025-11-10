// ---- CORE IMPORTS ---- //
import {DEFAULT_LIMIT} from '@/constants';
import {PortalWorkspace, User} from '@/types';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {findPosts} from '@/subapps/forum/common/orm/forum';
import {ThreadList} from '@/subapps/forum/common/ui/components';

export async function PostsContent({
  searchParams,
  workspace,
  groupIDs,
  memberGroupIDs,
  user,
  tenant,
}: {
  searchParams: {[key: string]: string | undefined};
  workspace: PortalWorkspace;
  groupIDs: any[];
  memberGroupIDs: string[];
  user: User;
  tenant: string;
}) {
  const {sort, limit, search, searchid} = searchParams;

  const {posts, pageInfo} = await findPosts({
    sort,
    limit: limit ? Number(limit) : DEFAULT_LIMIT,
    search,
    ids: searchid ? [searchid] : undefined,
    workspaceID: workspace?.id!,
    groupIDs,
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
