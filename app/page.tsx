export const dynamic = 'force-dynamic';

import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {DEFAULT_TENANT} from '@/constants';
import {TenancyType, manager} from '@/tenant';

import {resolveLanding} from './landing';

export default async function Page(props: {
  searchParams: Promise<{workspaceURI?: string; tenant?: string}>;
}) {
  const searchParams = await props.searchParams;

  let tenantId = decodeURIComponent(searchParams.tenant || '');

  if (!tenantId && manager.getType() === TenancyType.single) {
    tenantId = DEFAULT_TENANT;
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
