import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';

// ---- LOCAL IMPORTS ---- //
import {getAccountConfig} from '../../../common/orm/config';
import {findAvailableSubapps} from '../../../common/orm/members';
import Form from './form';

export default async function Page() {
  const access = await ensureAccess();

  if (!access.ok) {
    return notFound();
  }

  const {tenant, workspace} = access;
  const {client} = tenant;
  const workspaceURL = workspace.url;

  const config = await getAccountConfig(workspace.config.id, client);

  if (!config?.canInviteMembers) {
    return notFound();
  }

  const availableApps = await findAvailableSubapps({
    url: workspaceURL,
    client,
  });

  return (
    <div className="p-2 lg:p-0">
      <Form availableApps={availableApps || []} />
    </div>
  );
}
