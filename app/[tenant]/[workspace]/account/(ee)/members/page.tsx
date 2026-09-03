import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {isAdminContact, isPartner} from '@/orm/partner';
import {ensureAccess} from '@/lib/core/access/ensure-access';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {getAccountConfig} from '../../common/orm/config';
import {findAvailableSubapps, findMembers} from '../../common/orm/members';
import {findInvites} from '../../common/orm/invites';

export default async function Page() {
  const access = await ensureAccess();

  if (!access.ok) {
    return notFound();
  }

  const {user, tenant, workspace} = access;
  const {client} = tenant;
  const workspaceURL = workspace.url;

  const isAdmin =
    Boolean(await isPartner()) ||
    Boolean(await isAdminContact({client, workspaceURL}));

  if (!isAdmin) {
    return notFound();
  }

  const config = await getAccountConfig(workspace.config.id, client);

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
    <Content
      members={$members}
      invites={invites}
      availableApps={availableApps || []}
      canInviteMembers={config.canInviteMembers ?? undefined}
    />
  );
}
