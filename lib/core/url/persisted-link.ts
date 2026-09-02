import 'server-only';

import {getPortalRoot} from '@/utils/workspace-url';

import {isAbsoluteURL, type WorkspaceSubPath} from './index';
import {
  routePathFromWorkspaceURL,
  tenantHost,
  visitorPathFromRoutePath,
} from './server';

/**
 * The form a link is stored in: the route-tree path,
 * `/{tenant}/{workspace}{link}`.
 *
 * A stored row outlives the deployment that wrote it. The route-tree path is
 * the only shape that survives every change a tenant can go through — a new
 * host, a new base path, a move between path and host routing — because it
 * names only what the row is about. Rendering it for a visitor happens at read
 * time, against the tenant's configuration as it is then.
 */
export function toStoredLink(
  scope: {tenantId: string; workspaceURL: string},
  link: WorkspaceSubPath,
): string {
  const routePath = routePathFromWorkspaceURL(
    scope.tenantId,
    scope.workspaceURL,
  );

  return link === '/' ? routePath : `${routePath}${link}`;
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
    const root = getPortalRoot(tenantHost(tenantId));

    /* The root is taken off as a prefix of the whole string, not through URL
     * parsing, so the link's query and fragment survive. */
    if (root && stored.startsWith(`${root}/`)) {
      path = stored.slice(root.length);
    } else {
      const parsed = new URL(stored);
      const full = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      const basePath = getPortalRoot();

      path =
        basePath && full.startsWith(`${basePath}/`)
          ? full.slice(basePath.length)
          : full || '/';
    }
  }

  return visitorPathFromRoutePath(tenantId, path);
}
