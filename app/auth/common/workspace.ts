import type {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {findWorkspace} from '@/orm/workspace';
import {TenancyType, manager} from '@/tenant';
import {tenantConfigProvider} from '@/tenant/config-provider';
import {getPublicEnvironment} from '@/environment';
import {withBasePath} from '@/lib/core/path/base-path';
import {DEFAULT_TENANT, SEARCH_PARAMS} from '@/constants';

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
  tenantId?: string | null;
}): Promise<string | null> {
  /* In single-tenant mode the tenant is implicit, so resolve it the same way the
   * auth pages do rather than requiring the param. */
  const resolvedTenantId =
    tenantId ||
    (manager.getType() === TenancyType.single ? DEFAULT_TENANT : '');

  if (!(workspaceURI && resolvedTenantId)) return null;

  /* Read the host from the config alone: it is a per-tenant browser variable, and
   * resolving it first means an unknown or unconfigured tenant returns null here
   * instead of connecting a database just to build a title. */
  const config = await tenantConfigProvider.get(resolvedTenantId);
  const host = getPublicEnvironment(config).GOOVEE_PUBLIC_HOST;
  if (!host) return null;

  const tenant = await manager.getTenant(resolvedTenantId);
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
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  return findAuthWorkspaceName({
    workspaceURI: first(params.workspaceURI),
    // `/auth/error` spells the tenant param `tenantId`, the others use `tenant`.
    tenantId: first(params[SEARCH_PARAMS.TENANT_ID]) ?? first(params.tenantId),
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
