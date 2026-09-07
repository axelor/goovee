import 'server-only';

import {headers} from 'next/headers';

import {getPublicEnvironment} from '@/environment/utils';
import {getTenantConfig} from '@/tenant/config';
import {CURRENT_PATH_HEADER, TENANT_HEADER} from '@/proxy';

import {
  isUsableSlug,
  ownsAddressedOrigin,
  tenantURLs,
  type ServerWorkspaceScope,
} from './scope';
import {buildTenantScope, type TenantScope} from './tenant-urls';

/**
 * The workspace the request being handled is addressed to, read from the
 * headers the proxy sets.
 *
 * Nothing the client sends decides this. `x-tenant-id` and `x-current-path` are
 * both written with `set`, so a forged value is overwritten, and the workspace
 * is the segment of the address the request actually arrived at — which means a
 * caller can only ever act on the workspace the visitor is looking at, not on
 * one they merely have access to.
 *
 * Null where the address names no workspace, which is an ordinary shape rather
 * than a fault: a tenant's own landing address is matched by the proxy and
 * carries both headers, and so is an address whose workspace segment decodes to
 * something no slug may be. A caller turns that into whatever "no such
 * workspace" means for it.
 *
 * @throws only when the headers are absent, which means this ran outside a
 *   request the proxy matched — a deployment route under `/deployment`, a
 *   script, a cron job. Those have no address to read and must name the
 *   workspace themselves through `tenantURLs(id).workspace(slug)`.
 */
export async function currentWorkspace(): Promise<ServerWorkspaceScope | null> {
  const requestHeaders = await headers();

  const tenantId = requestHeaders.get(TENANT_HEADER);
  const currentPath = requestHeaders.get(CURRENT_PATH_HEADER);

  if (!tenantId || !currentPath) {
    throw new Error(
      'No workspace in the request: the proxy sets x-tenant-id and ' +
        'x-current-path only for the addresses it matches. Outside one, name ' +
        'the workspace with tenantURLs(id).workspace(slug).',
    );
  }

  const workspace = workspaceSegment(currentPath, tenantId, requestHeaders);

  return workspace ? tenantURLs(tenantId).workspace(workspace) : null;
}

/**
 * The addresses of the tenant the request being handled is addressed to.
 *
 * Measured from the origin the request arrived at rather than from the tenant's
 * configured routing, so every address a page builds works on the origin that
 * page was served on. `tenantURLs(id)` answers from the configuration instead,
 * which is what a webhook address or an emailed link needs.
 *
 * @throws where the proxy did not run, for the reason `currentWorkspace` gives.
 */
export async function currentTenantScope(): Promise<TenantScope> {
  const requestHeaders = await headers();

  const tenantId = requestHeaders.get(TENANT_HEADER);

  if (!tenantId) {
    throw new Error(
      'No tenant in the request: the proxy sets x-tenant-id only for the ' +
        'addresses it matches. Outside one, name the tenant with tenantURLs(id).',
    );
  }

  return buildTenantScope({
    tenantId,
    visitorPrefix: tenantURLs(tenantId).visitorPrefix(requestHeaders),
    host: getPublicEnvironment(getTenantConfig(tenantId))?.host,
  });
}

/**
 * The path being rendered, query string included, as the proxy captured it.
 *
 * Used as the post-login callback, so a denied visitor returns to exactly
 * where they were with their search params intact.
 *
 * Empty where the proxy did not run, rather than raising as `currentWorkspace`
 * does: a caller with nowhere to send someone back to still has a sign-in
 * screen to show them, so the absence is answerable here in a way that a
 * missing workspace is not.
 */
export async function getCurrentPath(): Promise<string> {
  return (await headers()).get(CURRENT_PATH_HEADER) ?? '';
}

/**
 * The workspace segment of a visitor address, or null where it holds none.
 *
 * Whether the address opens with the workspace or with the tenant follows the
 * origin the request arrived on, not the tenant's configured routing. The two
 * agree while the proxy sends every address of a host-routed tenant to that
 * tenant's own origin; reading the request rather than the configuration is
 * what keeps this right if an exception is ever added there, since such an
 * address opens with the tenant like any other and deciding from configuration
 * alone would read it as though it began with a workspace — and a tenant whose
 * workspace is named after it would then resolve itself.
 *
 * A path-routed address whose first segment is not the tenant names no
 * workspace of this tenant, and is refused rather than read from an offset that
 * happens to hold something.
 */
function workspaceSegment(
  currentPath: string,
  tenantId: string,
  requestHeaders: Headers,
): string | null {
  const [pathname] = currentPath.split('?');

  /* `x-current-path` carries the pathname as it arrived, so a segment needing
   * escapes is still escaped here, while the slug it has to match is stored
   * decoded. A malformed escape decodes to nothing usable and names no
   * workspace. */
  const segments: string[] = [];
  for (const segment of pathname.split('/').filter(Boolean)) {
    try {
      segments.push(decodeURIComponent(segment));
    } catch {
      return null;
    }
  }

  const named = ownsAddressedOrigin(tenantId, requestHeaders)
    ? segments[0]
    : segments[0] === tenantId
      ? segments[1]
      : undefined;

  /* Refused here rather than left to `workspace()`, whose throw is meant for a
   * caller that chose the slug. This one comes out of the address, so an
   * unusable value is an address naming no workspace — a `%2f` that decodes to
   * a separator answers not-found like any other miss instead of raising. */
  return named && isUsableSlug(named) ? named : null;
}
