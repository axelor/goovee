import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {buildManifest} from '@/lib/core/pwa/manifest';
import {withBasePath} from '@/lib/core/path/base-path';

/* Per-tenant web app manifest. All three addresses are `/<tenant>/`: the app is
 * identified by it, launches on the tenant's landing workspace there, and keeps
 * navigation inside it.
 *
 * The scope cannot be widened past the service worker registered in
 * app/[tenant]/layout.tsx, which is per-tenant so that each tenant carries its
 * own push subscription. A browser only installs an app whose scope and
 * start_url the page's service worker encloses, and scopes match by path prefix
 * — so `/` would be too broad, and even `/<tenant>` (no trailing slash) falls
 * outside `/<tenant>/`. Signing in therefore stays outside the installed app;
 * bringing it in means putting `/auth` under the tenant, not a wider scope here.
 *
 * Public — fetched by the browser without credentials; validate the tenant
 * cheaply via listTenantIds. */
export async function GET(
  _request: Request,
  {params}: {params: Promise<{tenant: string}>},
) {
  const {tenant} = await params;

  const knownTenantIds = await manager.listTenantIds();
  if (!knownTenantIds.includes(tenant)) {
    return new NextResponse('Not found', {status: 404});
  }

  const entry = withBasePath(`/${tenant}/`);

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
