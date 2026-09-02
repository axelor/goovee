import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {listTenantIds} from '@/tenant/config';
import {tenantEntryPath} from '@/lib/core/url/server';
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
  request: Request,
  {params}: {params: Promise<{tenant: string}>},
) {
  const {tenant} = await params;

  const knownTenantIds = listTenantIds();
  if (!knownTenantIds.includes(tenant)) {
    return new NextResponse('Not found', {status: 404});
  }

  /* The same value the service worker in app/[tenant]/layout.tsx registers as
   * its scope — one function, because a browser installs an app only where the
   * page's worker encloses the manifest's scope and start address. */
  const entry = tenantEntryPath(tenant, request.headers);

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
