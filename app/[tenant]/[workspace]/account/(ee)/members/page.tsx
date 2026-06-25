import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {workspacePathname} from '@/utils/workspace';
import {findWorkspace, getWorkspaceConfig} from '@/orm/workspace';
import {manager} from '@/lib/core/tenant';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {findAvailableSubapps, findMembers} from '../../common/orm/members';
import {findInvites} from '../../common/orm/invites';

export default async function Page(props: {
  params: Promise<{workspace: string; tenant: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId, workspaceURL} = workspacePathname(params);

  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return notFound();
  }

  const {client} = tenant;

  const session = await getSession();
  const user = session?.user!;

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    client,
  });

  if (!workspace) {
    return notFound();
  }

  const config = await getWorkspaceConfig(workspace.config.id, client);

  if (!config) {
    return notFound();
  }

  const partnerId = (user?.isContact ? user.mainPartnerId : user.id)!;

  const invites = await findInvites({
    workspaceURL,
    client,
    partnerId,
  });

  const availableApps = await findAvailableSubapps({
    url: workspaceURL,
    client,
  });

  const members: any = await findMembers({
    workspaceURL,
    client,
    partnerId,
  });

  const $members = [...members?.partners, ...members?.contacts];

  return (
    <div className="bg-white p-2 lg:p-0 lg:bg-inherit">
      <Content
        members={$members}
        invites={invites}
        availableApps={availableApps || []}
        canInviteMembers={config.canInviteMembers}
      />
    </div>
  );
}
