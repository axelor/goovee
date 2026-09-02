import 'server-only';

import {getPortalRoot} from '@/utils/workspace-url';

import {isAbsoluteURL} from './index';
import {tenantHost, visitorPathFromRoutePath} from './server';

/*
 * The read half of a stored link. A row is written as the route-tree path that
 * `ServerWorkspaceURLs.routePath` produces, and is rendered for its reader
 * here — so this file holds only the direction that has to tolerate the shapes
 * older rows were written in.
 */

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
