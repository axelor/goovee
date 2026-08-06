import type {Metadata} from 'next';

// ---- CORE IMPORTS ---- //
import {findWorkspace} from '@/orm/workspace';
import {manager} from '@/tenant';
import {withBasePath} from '@/lib/core/path/base-path';
import {SEARCH_PARAMS} from '@/constants';

/**
 * The auth screens sit outside the `[tenant]/[workspace]` segment, so the
 * workspace is only known through the `workspaceURI`/`tenant` search params the
 * portal appends when it bounces an anonymous visitor here. The visitor has no
 * session yet, so the lookup resolves as a guest.
 */
async function findAuthWorkspaceName({
  workspaceURI,
  tenantId,
}: {
  workspaceURI?: string | null;
  tenantId?: string | null;
}): Promise<string | null> {
  if (!(workspaceURI && tenantId)) return null;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return null;

  const url = `${process.env.GOOVEE_PUBLIC_HOST}${withBasePath(workspaceURI)}`;
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
