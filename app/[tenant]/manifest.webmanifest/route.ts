import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {getTenantConfig} from '@/tenant/config';
import {isHostRouted} from '@/lib/core/tenant/routing';
import {ownsAddressedOrigin, tenantURLs} from '@/lib/core/url/scope';
import {buildManifest} from '@/lib/core/pwa/manifest';

/* Per-tenant web app manifest. All three addresses are the tenant's entry: the
 * app is identified by it, launches on the tenant's landing workspace there, and
 * keeps navigation inside it. That entry is the root of the origin the manifest
 * was asked on where the tenant holds that origin, and `/<tenant>/` anywhere
 * else.
 *
 * The scope cannot be widened past the service worker registered in
 * app/[tenant]/layout.tsx, which is per-tenant so that each tenant carries its
 * own push subscription. A browser only installs an app whose scope and
 * start_url the page's service worker encloses, and scopes match by path prefix
 * — so under a shared origin `/` would be too broad, and even `/<tenant>` (no
 * trailing slash) falls outside `/<tenant>/`. Signing in sits under the tenant
 * either way, so it stays inside the installed app.
 *
 * The identity is the entry address, so moving a tenant from a shared origin to
 * one of its own makes this a different app: an install made before the move
 * keeps launching at the old address and has to be replaced.
 *
 * Public — fetched by the browser without credentials, so the tenant is checked
 * against the configuration document rather than against a session. */
export async function GET(
  request: Request,
  {params}: {params: Promise<{tenant: string}>},
) {
  const {tenant} = await params;

  const config = getTenantConfig(tenant);
  if (!config) {
    return new NextResponse('Not found', {status: 404});
  }

  /* Sent to the origin the tenant is served at, the way the proxy sends every
   * other address of a moved tenant. This route is outside the proxy's matcher
   * — it has to be, since the address already carries the tenant segment and the
   * proxy would put a second one on for a host-routed tenant — so the redirect
   * the proxy would have made is made here instead. Without it the shared origin
   * answers with a manifest whose entry is `/<tenant>/`, an address that origin
   * no longer serves, and an app installed from it launches straight into a
   * redirect off its own scope.
   *
   * The path is kept as it stands: this address carries the tenant segment on
   * either origin, because nothing adds or removes one here. */
  if (isHostRouted(config) && !ownsAddressedOrigin(tenant, request.headers)) {
    const canonical = new URL(request.url);
    const origin = new URL(config.publicEnv.GOOVEE_PUBLIC_HOST);

    canonical.protocol = origin.protocol;
    canonical.host = origin.host;

    return NextResponse.redirect(canonical, 307);
  }

  /* The same value the service worker in app/[tenant]/layout.tsx registers as
   * its scope — one function, because a browser installs an app only where the
   * page's worker encloses the manifest's scope and start address. */
  const entry = tenantURLs(tenant).entry(request.headers);

  return NextResponse.json(
    buildManifest({id: entry, startUrl: entry, scope: entry}),
    {
      headers: {
        'Content-Type': 'application/manifest+json',
        /* Tenant-static (changes only on deploy/config), so let the browser
         * hold it rather than re-fetch on every navigation. */
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
