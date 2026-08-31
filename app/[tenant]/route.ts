import {notFound} from 'next/navigation';
import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {resolveLanding} from '@/app/landing';

/* The tenant's entry address. The installed app's `start_url` is `/<tenant>/`
 * (see manifest.webmanifest/route.ts), which arrives here once the trailing
 * slash is normalised away. A route handler rather than a page so that the
 * answer is a redirect and no document is ever created here: `/<tenant>` lies
 * outside the service worker's `/<tenant>/` scope — scope matching is a string
 * prefix, so the trailing slash excludes the bare segment — and a document is
 * matched to a worker by the URL it was created at, for its whole life. A page
 * here would therefore hand the visitor an uncontrolled document that no later
 * navigation can repair: no offline cache, and a push subscription that waits on
 * `serviceWorker.ready` forever. Redirecting first means the document is created
 * at the workspace, inside the scope.
 *
 * The tenant comes from the path rather than a query parameter, which is the form
 * the proxy checks against the tenant of an existing session. */
export async function GET(
  request: Request,
  {params}: {params: Promise<{tenant: string}>},
) {
  const {tenant} = await params;
  const requestUrl = new URL(request.url);
  const workspaceURI = requestUrl.searchParams.get('workspaceURI') ?? undefined;

  const destination = await resolveLanding({tenantId: tenant, workspaceURI});

  /* A 404 with no body of its own: a route handler has no page to render, so the
   * browser shows its own. */
  if (!destination) {
    notFound();
  }

  const response = NextResponse.redirect(destination, 307);

  /* One address per tenant, but a destination that differs per visitor: a guest,
   * a partner and a contact each land somewhere else, so a cache keyed on the URL
   * alone would hand one visitor's workspace to another. */
  response.headers.set('Cache-Control', 'private, no-store');

  return response;
}
