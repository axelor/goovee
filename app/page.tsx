export const dynamic = 'force-dynamic';

import {headers} from 'next/headers';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {sessionTenantIds} from '@/lib/auth';
import {getDefaultTenantId, getTenantConfig} from '@/tenant/config';

import {resolveLanding} from './landing';

/**
 * The tenant `/` leads to.
 *
 * The address wins, then the tenant the visitor is signed in to, then the
 * document's default. Preferring the session over the default is what makes `/`
 * work for everyone: a session belongs to a single tenant, so a visitor signed
 * in to one tenant reaches the default tenant's pages as a stranger.
 *
 * A session naming a tenant the document no longer holds is skipped, so `/`
 * leads to the default tenant and the visitor is offered a way out there
 * instead of not-found.
 */
async function resolveLandingTenantId(fromAddress: string): Promise<string> {
  if (fromAddress) return fromAddress;

  /* A browser may hold a session for several of a deployment's tenants, since
   * each writes its own cookie. One of them can be landed on; more than one
   * names no single answer, so the document's default decides instead. */
  const signedInTo = await sessionTenantIds(await headers());

  if (signedInTo.length === 1 && getTenantConfig(signedInTo[0])) {
    return signedInTo[0];
  }

  return getDefaultTenantId() ?? '';
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
