import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {NextResponse} from 'next/server';

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

/* The deployment's entry address, which names no tenant and resolves one.
 *
 * A route handler rather than a page, for the reason the tenant's own entry at
 * `[tenant]/route.ts` gives, and for one more that is particular to this
 * address. A page here creates a document, and a document created here belongs
 * to no tenant: the shell above it resolves the tenant per request, so the
 * client tree it builds — the authentication endpoint it talks to, the
 * translations it loads — is built for no tenant at all. The redirect that
 * follows is a client navigation, which by design does not re-render that
 * shell, so those choices outlive it and the visitor arrives at their workspace
 * with the shell of nowhere: signed in as far as the server is concerned, signed
 * out as far as the page is. Answering with a redirect and creating no document
 * is what keeps the shell and the tenant agreeing.
 *
 * The same reasoning makes this the wrong place to render not-found. There is no
 * page to render from a route handler, so the browser shows its own — which is
 * the honest answer for an address the deployment cannot resolve a tenant for. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const tenantId = await resolveLandingTenantId(
    decodeURIComponent(requestUrl.searchParams.get('tenant') ?? ''),
  );

  const destination = await resolveLanding({
    tenantId,
    workspaceURI: requestUrl.searchParams.get('workspaceURI') ?? undefined,
  });

  if (!destination) {
    notFound();
  }

  const response = NextResponse.redirect(destination, 307);

  /* One address, but a destination that differs per visitor: a guest, a partner
   * and a contact each land somewhere else, so a cache keyed on the URL alone
   * would hand one visitor's workspace to another. */
  response.headers.set('Cache-Control', 'private, no-store');

  return response;
}
