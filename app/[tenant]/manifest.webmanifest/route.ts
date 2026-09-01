import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {getTenantConfig} from '@/tenant/config-provider';
import {isHostRouted} from '@/lib/core/tenant/routing';
import {buildManifest} from '@/lib/core/pwa/manifest';
import {withBasePath} from '@/lib/core/path/base-path';

/* Per-tenant web app manifest. All three addresses are the tenant's entry: the
 * app is identified by it, launches on the tenant's landing workspace there, and
 * keeps navigation inside it. That entry is `/<tenant>/` where an origin carries
 * several tenants, and the root of the origin where the tenant is reached by host
 * and holds it alone.
 *
 * The scope cannot be widened past the service worker registered in
 * app/[tenant]/layout.tsx, which is per-tenant so that each tenant carries its
 * own push subscription. A browser only installs an app whose scope and
 * start_url the page's service worker encloses, and scopes match by path prefix
 * — so under a shared origin `/` would be too broad, and even `/<tenant>` (no
 * trailing slash) falls outside `/<tenant>/`. Signing in stays outside the
 * installed app there, since `/auth` is not under the tenant; on a tenant's own
 * origin the scope is the whole origin and it is included.
 *
 * The identity is the entry address, so moving a tenant from a shared origin to
 * one of its own makes this a different app: an install made before the move
 * keeps launching at the old address and has to be replaced.
 *
 * Public — fetched by the browser without credentials; validate the tenant
 * cheaply via listTenantIds. */
export async function GET(
  _request: Request,
  {params}: {params: Promise<{tenant: string}>},
) {
  const {tenant} = await params;

  const knownTenantIds = manager.listTenantIds();
  if (!knownTenantIds.includes(tenant)) {
    return new NextResponse('Not found', {status: 404});
  }

  const config = getTenantConfig(tenant);

  const entry = withBasePath(
    config && isHostRouted(config) ? '/' : `/${tenant}/`,
  );

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
