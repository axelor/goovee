import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findWorkspaceForRegistration} from '@/orm/workspace';
import type {PortalWorkspace} from '@/types';

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

  const workspace = await findWorkspaceForRegistration({
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return notFound();
  }

  const showGoogleOauth = process.env.SHOW_GOOGLE_OAUTH === 'true';

  return (
    <Navigation
      workspace={workspace as PortalWorkspace}
      showGoogleOauth={showGoogleOauth}
    />
  );
}
