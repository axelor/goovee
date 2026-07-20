import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import {buildManifest} from '@/lib/core/pwa/manifest';
import {withBasePath} from '@/lib/core/path/base-path';

/* Per-tenant web app manifest. start_url/scope are `/<tenant>/`, so the
 * installed PWA launches inside this tenant's service-worker scope (offline-
 * capable) and each tenant installs as a distinct app. Public — fetched by the
 * browser without credentials; validate the tenant cheaply via listTenantIds. */
export async function GET(
  _request: Request,
  {params}: {params: Promise<{tenant: string}>},
) {
  const {tenant} = await params;

  const knownTenantIds = await manager.listTenantIds();
  if (!knownTenantIds.includes(tenant)) {
    return new NextResponse('Not found', {status: 404});
  }

  return NextResponse.json(buildManifest(withBasePath(`/${tenant}/`)), {
    headers: {
      'Content-Type': 'application/manifest+json',
      /* Tenant-static (changes only on deploy/config), so let the browser hold
       * it rather than re-fetch on every navigation. */
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
