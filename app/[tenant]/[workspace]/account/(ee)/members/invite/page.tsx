import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';

// ---- LOCAL IMPORTS ---- //
import {findAvailableSubapps} from '../../../common/orm/members';
import Form from './form';

export default async function Page(
  props: {
    params: Promise<{workspace: string; tenant: string}>;
  }
) {
  const params = await props.params;
  const {tenant: tenantId, workspaceURL} = workspacePathname(params);

  const session = await getSession();
  const user = session?.user!;

  const workspace = await findWorkspace({
    url: workspaceURL,
    user,
    tenantId,
  });

  if (!workspace?.config?.canInviteMembers) {
    return notFound();
  }

  const availableApps = await findAvailableSubapps({
    url: workspaceURL,
    tenantId,
  });

  return (
    <div className="p-2 lg:p-0">
      <Form availableApps={availableApps || []} />
    </div>
  );
}
