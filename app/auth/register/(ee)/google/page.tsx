export const dynamic = 'force-dynamic';

import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Environment, getPublicEnvironment} from '@/environment';
import {findWorkspaceForRegistration} from '@/orm/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {extractSearchParams} from '../../common/utils';
import Form from './form';

import {generateAuthMetadata} from '../../../common/workspace';

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

  const workspace = await findWorkspaceForRegistration({
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return notFound();
  }

  /* Outside the [tenant] segment: provide the tenant's browser variables (the
   * host Form reads) here, sourced from the resolved tenant config. */
  return (
    <Environment value={getPublicEnvironment(tenant.config)}>
      <Form
        workspace={workspace}
        googleProviderId={
          tenant.config.oauth?.google ? `google-${tenantId}` : undefined
        }
      />
    </Environment>
  );
}
