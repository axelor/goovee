import 'server-only';

import {getPublicEnvironment} from '@/environment/utils';
import {isHostRouted} from '@/lib/core/tenant/routing';
import {getTenantConfig} from '@/tenant/config';

import {absoluteRoot} from './absolute';

/*
 * The read half of a stored link. A row is written as the route-tree path that
 * `ServerWorkspaceURLs.routePath` produces, and is rendered for its reader
 * here — so this file holds only the direction that has to tolerate the shapes
 * older rows were written in.
 */

/**
 * The host a tenant declares for itself, or undefined for a tenant the
 * configuration document does not hold.
 */
function tenantHost(tenantId: string): string | undefined {
  return getPublicEnvironment(getTenantConfig(tenantId)).GOOVEE_PUBLIC_HOST;
}

/**
 * The path a visitor's address bar holds for a route-tree path: the tenant
 * segment is dropped for a tenant reached on its own origin and kept for one
 * reached under a path segment. No base path — `next/link` and the router add
 * it, and `withBasePath` is the door for the consumers that need it added.
 */
function visitorPathFromRoutePath(tenantId: string, routePath: string): string {
  const config = getTenantConfig(tenantId);

  if (config && isHostRouted(config)) {
    if (routePath === `/${tenantId}`) return '/';

    if (routePath.startsWith(`/${tenantId}/`)) {
      return routePath.slice(tenantId.length + 1);
    }
  }

  return routePath;
}

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Whether `value` is an absolute URL — a scheme and authority in front, rather
 * than a path. Anchored, so a path whose query merely embeds a URL is not one.
 */
function isAbsoluteURL(value: string): boolean {
  return ABSOLUTE_URL.test(value);
}

/**
 * A stored link as the visitor's address bar holds it today, ready for a
 * `next/link` href or a service-worker payload.
 *
 * Tolerates the shape older rows were written in: an absolute URL under the
 * tenant's current root has that root taken off; one under a root the tenant
 * no longer declares keeps its own recorded path, query and fragment, less the
 * current base path where it carries it. What remains is read as a route-tree
 * path — rows from before multi-tenancy were written on a path-routed
 * deployment, where the two shapes are the same.
 */
export function fromStoredLink(stored: string, tenantId: string): string {
  let path = stored;

  if (isAbsoluteURL(stored)) {
    const root = absoluteRoot(tenantHost(tenantId));

    /* The root is taken off as a prefix of the whole string, not through URL
     * parsing, so the link's query and fragment survive. */
    if (root && stored.startsWith(`${root}/`)) {
      path = stored.slice(root.length);
    } else {
      const parsed = new URL(stored);
      const full = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      /* No host, because this row's own root is not one this tenant declares:
       * the base path alone is all of the root its recorded path can carry. */
      const basePath = absoluteRoot(undefined);

      path =
        basePath && full.startsWith(`${basePath}/`)
          ? full.slice(basePath.length)
          : full || '/';
    }
  }

  return visitorPathFromRoutePath(tenantId, path);
}
