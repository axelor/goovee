import 'server-only';

import {headers} from 'next/headers';

import {addressedHost} from '@/lib/core/tenant/routing';
import {CURRENT_PATH_HEADER, TENANT_HEADER} from '@/proxy';
import {getRoutingIndex} from '@/tenant/config';

import {isUsableSlug, tenantURLs, type ServerWorkspaceURLs} from './scope';

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
 * than a fault: a tenant's own landing address and its sign-out screen are both
 * matched by the proxy and carry both headers, and so is an address whose
 * workspace segment could name a different workspace once decoded. A caller
 * turns that into whatever "no such workspace" means for it.
 *
 * @throws only when the headers are absent, which means this ran outside a
 *   request the proxy matched — a route under `/api`, a script, a cron job.
 *   Those have no address to read and must name the workspace themselves
 *   through `tenantURLs(id).workspace(slug)`.
 */
export async function currentWorkspace(): Promise<ServerWorkspaceURLs | null> {
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
 * The workspace segment of a visitor address, or null where it holds none.
 *
 * Whether the address opens with the workspace or with the tenant follows the
 * origin the request arrived on, not the tenant's configured routing. A tenant
 * given an origin of its own is still reached under its path segment on the
 * origin it used to share — that is where the screen ending a session made
 * before the move is served — and there the address opens with the tenant like
 * any other. Deciding from the configuration alone reads that address as though
 * it began with a workspace, and a tenant whose workspace is named after it
 * would then resolve itself.
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

  const host = addressedHost(requestHeaders);
  const onOwnOrigin = Boolean(
    host && getRoutingIndex().tenantByHost.get(host) === tenantId,
  );

  const named = onOwnOrigin
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
