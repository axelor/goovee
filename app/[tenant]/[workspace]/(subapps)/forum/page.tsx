import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {getSession} from '@/auth';
import {DEFAULT_LIMIT} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {
  findPosts,
  findUser,
  findGroups,
  findGroupsByMembers,
} from '@/subapps/forum/common/orm/forum';
import Content from './content';
import {GROUPS_ORDER_BY} from '@/subapps/forum/common/constants';

export default async function Page({
  params,
  searchParams,
}: {
  params: any;
  searchParams: {[key: string]: string | undefined};
}) {
  const session = await getSession();
  const user = session?.user;
  const userId = user?.id as string;

  const {workspaceURL, tenant} = workspacePathname(params);

  const workspace: any = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const {sort, limit, search, searchid} = searchParams;

  const groups = await findGroups({
    workspace: workspace!,
    tenantId: tenant,
    user,
  }).then(clone);

  const groupIDs = groups.map((group: any) => group.id);

  const memberGroups: any = userId
    ? await findGroupsByMembers({
        id: userId,
        orderBy: GROUPS_ORDER_BY,
        workspaceID: workspace?.id!,
        tenantId: tenant,
        user,
      })
    : [];

  const memberGroupIDs = memberGroups.map(
    (group: any) => group?.forumGroup?.id,
  );

  const nonMemberGroups: any = groups.filter((group: any) => {
    return !memberGroupIDs.includes(group.id);
  });

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

  const $user = await findUser({
    userId,
    tenantId: tenant,
  }).then(clone);

  return (
    <Content
      memberGroups={memberGroups}
      nonMemberGroups={nonMemberGroups}
      user={$user}
      posts={posts}
      pageInfo={pageInfo}
      workspace={workspace}
    />
  );
}
