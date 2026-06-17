export const dynamic = 'force-dynamic';

import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findWorkspaceForRegistration} from '@/orm/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {extractSearchParams} from '../../common/utils';
import Form from './form';

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

  const workspace = await findWorkspaceForRegistration({
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return notFound();
  }

  return (
    <Form
      workspace={workspace}
      googleProviderId={
        tenant.config.oauth?.google ? `google-${tenantId}` : undefined
      }
    />
  );
}
