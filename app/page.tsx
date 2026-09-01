export const dynamic = 'force-dynamic';

import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';

import {resolveLanding} from './landing';

export default async function Page(props: {
  searchParams: Promise<{workspaceURI?: string; tenant?: string}>;
}) {
  const searchParams = await props.searchParams;

  let tenantId = decodeURIComponent(searchParams.tenant || '');

  if (!tenantId) {
    tenantId = manager.getDefaultTenantId() ?? '';
  }

  const destination = await resolveLanding({
    tenantId,
    workspaceURI: searchParams.workspaceURI,
  });

  if (!destination) {
    notFound();
  }

  redirect(destination);
}
