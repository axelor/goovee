import 'server-only';

import {z} from 'zod';

import {getPublicEnvironment} from '@/environment/utils';
import {withBasePath} from '@/lib/core/path/base-path';
import {addressedHost, isHostRouted} from '@/lib/core/tenant/routing';
import {getRoutingIndex, getTenantConfig} from '@/tenant/config';

/**
 * The host a tenant declares for itself, or undefined for a tenant the
 * configuration document does not hold.
 */
export function tenantHost(tenantId: string): string | undefined {
  return getPublicEnvironment(getTenantConfig(tenantId)).GOOVEE_PUBLIC_HOST;
}

/**
 * The path a visitor's address bar holds for a route-tree path: the tenant
 * segment is dropped for a tenant reached on its own origin and kept for one
 * reached under a path segment. No base path — `next/link` and the router add
 * it, and `withBasePath` is the door for the consumers that need it added.
 */
export function visitorPathFromRoutePath(
  tenantId: string,
  routePath: string,
): string {
  const config = getTenantConfig(tenantId);

  if (config && isHostRouted(config)) {
    if (routePath === `/${tenantId}`) return '/';

    if (routePath.startsWith(`/${tenantId}/`)) {
      return routePath.slice(tenantId.length + 1);
    }
  }

  return routePath;
}

/* A path segment of one or two dots, written plainly or percent-encoded — the
 * segments a browser resolves against the rest of the path, which would carry
 * an address out of the prefix the schema below checked. */
const DOT_SEGMENT = /(^|\/)(?:\.|%2e){1,2}(?=\/|$)/i;

/**
 * Validates a client-supplied visitor path as an address inside the given
 * workspace: the exact workspace root or a path below it, plain path only —
 * no scheme, no backslashes, no query or fragment, no dot-segments.
 *
 * For server actions that echo a browser path back out — a payment gateway's
 * return address, say. The prefix check is the confinement, not the
 * authorization: a path bound to a workspace cannot name another tenant's or
 * another workspace's address, and the caller establishes separately that the
 * sender may reach it. Dot-segments are refused because a browser resolves
 * them, which would step the address back out of the checked prefix; a query is
 * refused because the caller appends its own.
 */
export function workspaceVisitorPathSchema(workspaceURI: string) {
  return z
    .string()
    .refine(
      path =>
        (path === workspaceURI || path.startsWith(`${workspaceURI}/`)) &&
        !path.includes('://') &&
        !path.includes('\\') &&
        !path.includes('?') &&
        !path.includes('#') &&
        !DOT_SEGMENT.test(path),
      {message: 'Path must be inside the workspace'},
    );
}

/**
 * The path a tenant's app enters at on the origin a request was addressed to,
 * with a trailing slash and the base path in front: the root where the tenant
 * holds that origin to itself, its path segment anywhere else.
 *
 * This is both the service worker's scope and the web manifest's
 * `id`/`start_url`/`scope`, from one place because the two have to agree: a
 * browser installs an app only where the page's worker encloses the manifest's
 * scope and start address, and a drift between them shows up as nothing more
 * than the install prompt not appearing.
 *
 * It follows the origin the request arrived on, not the tenant's own routing:
 * a tenant holding an origin of its own is still served under its path segment
 * on an origin it shares — where the screen ending a session made before the
 * move lives — and its addresses there begin with the segment. Scoping to the
 * root there would register a worker covering the whole shared origin, which
 * the upgrade cleanup in the root layout unregisters on sight.
 */
export function tenantEntryPath(tenantId: string, headers: Headers): string {
  const host = addressedHost(headers);
  const owns = Boolean(
    host && getRoutingIndex().tenantByHost.get(host) === tenantId,
  );

  return withBasePath(owns ? '/' : `/${tenantId}/`);
}
