import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findWorkspaceForRegistration} from '@/orm/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import Navigation from './navigation';
import {extractSearchParams, isExistingUser} from './common/utils';
import {UserExists} from './common/ui/components';

import {generateAuthMetadata} from '../common/workspace';

export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  return generateAuthMetadata(props.searchParams);
}

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

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const existing = await isExistingUser({workspaceURL, client});

  if (existing) {
    return <UserExists workspaceURL={workspaceURL} />;
  }

  const workspace = await findWorkspaceForRegistration({
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return notFound();
  }

  const showGoogleOauth = Boolean(tenant.config.oauth?.google);

  return (
    <Navigation
      showGoogleOauth={showGoogleOauth}
      workspaceName={workspace.name}
    />
  );
}
