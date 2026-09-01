export const dynamic = 'force-dynamic';

import {headers} from 'next/headers';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSessionTenantId} from '@/lib/auth';
import {manager} from '@/tenant';

import {resolveLanding} from './landing';

/**
 * The tenant `/` leads to.
 *
 * The address wins, then the tenant the visitor is signed in to, then the
 * document's default. Preferring the session over the default is what makes `/`
 * work for everyone: a session belongs to a single tenant, so sending a visitor
 * signed in to one tenant to a different one only reaches the screen asking
 * them to sign out.
 *
 * A session naming a tenant the document no longer holds is skipped, so `/`
 * leads to the default tenant and the visitor is offered a way out there
 * instead of not-found.
 */
async function resolveLandingTenantId(fromAddress: string): Promise<string> {
  if (fromAddress) return fromAddress;

  const sessionTenantId = await getSessionTenantId(await headers());

  if (sessionTenantId && manager.getConfig(sessionTenantId)) {
    return sessionTenantId;
  }

  return manager.getDefaultTenantId() ?? '';
}

export default async function Page(props: {
  searchParams: Promise<{workspaceURI?: string; tenant?: string}>;
}) {
  const searchParams = await props.searchParams;

  const tenantId = await resolveLandingTenantId(
    decodeURIComponent(searchParams.tenant || ''),
  );

  const destination = await resolveLanding({
    tenantId,
    workspaceURI: searchParams.workspaceURI,
  });

  if (!destination) {
    notFound();
  }

  redirect(destination);
}
