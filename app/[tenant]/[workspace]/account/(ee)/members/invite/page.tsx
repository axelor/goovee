import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace, getWorkspaceConfig} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/lib/core/tenant';

// ---- LOCAL IMPORTS ---- //
import {findAvailableSubapps} from '../../../common/orm/members';
import Form from './form';

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
