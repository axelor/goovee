export const dynamic = 'force-dynamic';

import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
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
  searchParams: Promise<{workspaceURI?: string}>;
}) {
  const searchParams = await props.searchParams;
  const {workspaceURI, tenantId, workspaceURL} = await extractSearchParams({
    searchParams,
  });

  /* The screen names the workspace it registers for, so an address without
   * one has nothing to show. */
  if (!workspaceURI) {
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
