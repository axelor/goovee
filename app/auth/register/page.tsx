import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {canRegisterForWorkspace, findWorkspaces} from '@/orm/workspace';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import Navigation from './navigation';
import {extractSearchParams, isExistingUser} from './common/utils';
import {UserExists} from './common/ui/components';

export default async function Page(props: {
  searchParams: Promise<{
    workspaceURI?: string;
    tenant: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const {workspaceURI, tenantId, workspaceURL} = extractSearchParams({
    searchParams,
  });

  if (!(workspaceURI && tenantId)) {
    return notFound();
  }

  const existing = await isExistingUser({workspaceURL, tenantId});

  if (existing) {
    return <UserExists workspaceURL={workspaceURL} />;
  }

  const workspaces = await findWorkspaces({url: workspaceURL, tenantId}).then(
    clone,
  );

  const workspace = workspaces.find((w: any) => w.url === workspaceURL);

  const canRegister = await canRegisterForWorkspace({
    url: workspaceURL,
    tenantId,
  });

  if (!canRegister) {
    return notFound();
  }

  return <Navigation workspace={workspace} />;
}
