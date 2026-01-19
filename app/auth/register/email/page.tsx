import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findWorkspaceForRegistration} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import Form from './form';
import {extractSearchParams, isExistingUser} from '../common/utils';
import {UserExists} from '../common/ui/components';
import {PortalWorkspace} from '@/types';

export default async function Page({
  searchParams,
}: {
  searchParams: {
    workspaceURI?: string;
    tenant: string;
  };
}) {
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

  const workspace = await findWorkspaceForRegistration({
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return notFound();
  }

  return <Form workspace={workspace as PortalWorkspace} />;
}
