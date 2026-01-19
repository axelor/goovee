import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findWorkspaceForRegistration} from '@/orm/workspace';
import type {PortalWorkspace} from '@/types';

// ---- LOCAL IMPORTS ---- //
import Navigation from './navigation';
import {extractSearchParams, isExistingUser} from './common/utils';
import {UserExists} from './common/ui/components';

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

  return <Navigation workspace={workspace as PortalWorkspace} />;
}
