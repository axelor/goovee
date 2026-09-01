import type {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import {tenantConfigProvider} from '@/tenant/config-provider';
import {getPublicEnvironment} from '@/environment';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {firstValue, resolveAuthTenantId} from './tenant';

/**
 * The auth screens sit outside the `[tenant]/[workspace]` segment, so the
 * workspace is known only from the `workspaceURI` search param the portal
 * appends when it bounces an anonymous visitor here, plus the tenant it was
 * bounced from. The visitor has no session yet, so the lookup resolves as a
 * guest. The name is decoration, so an unknown tenant, a tenant with no
 * configured host, and a URI that matches no workspace all resolve to null
 * rather than breaking the page.
 */
async function findAuthWorkspaceName({
  workspaceURI,
  tenantId,
}: {
  workspaceURI?: string | null;
  /* Resolved by the caller, so the tab is named after the same tenant the
   * screen itself acts for. */
  tenantId: string;
}): Promise<string | null> {
  if (!(workspaceURI && tenantId)) return null;

  /* Read the host from the config alone: it is a per-tenant browser variable, and
   * resolving it first means an unknown or unconfigured tenant returns null here
   * instead of connecting a database just to build a title. */
  const config = tenantConfigProvider.get(tenantId);
  const host = getPublicEnvironment(config).GOOVEE_PUBLIC_HOST;
  if (!host) return null;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return null;

  const url = `${host}${withBasePath(workspaceURI)}`;
  const workspace = await findWorkspace({url, client: tenant.client});

  return workspace?.name ?? null;
}

/**
 * Reads the workspace name out of a page's search params. Both the metadata and
 * the page render go through this; `findGuestWorkspace` is request-memoized, so
 * the two calls share one query.
 */
export async function resolveAuthWorkspaceName(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<string | null> {
  const params = await searchParams;

  return findAuthWorkspaceName({
    workspaceURI: firstValue(params.workspaceURI),
    tenantId: resolveAuthTenantId(params),
  });
}

/**
 * Names the browser tab after the workspace the visitor came from, matching
 * what `[tenant]/[workspace]/layout.tsx` does once they are signed in. Returning
 * an empty object leaves the root `title.default` in place.
 */
export async function generateAuthMetadata(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<Metadata> {
  const name = await resolveAuthWorkspaceName(searchParams);

  return name ? {title: name} : {};
}
