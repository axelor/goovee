import 'server-only';

/* The only file that may import revalidatePath: everywhere else the import is
 * refused by lint, because the raw call is a footgun — it matches the
 * route-tree path, which always carries the tenant segment, while most code
 * holds the visitor-shaped `workspaceURI`, which does not on a tenant reached
 * on its own origin. Fed that, it silently revalidates nothing. */
// eslint-disable-next-line no-restricted-imports
import {revalidatePath} from 'next/cache';

import type {WorkspaceSubPath} from './index';
import {routePathFromWorkspaceURL} from './server';

/**
 * Invalidates the page at a route-tree path — `/{tenant}/{workspace}/…`, the
 * coordinate the route tree resolves and the one a cache tag is built from.
 *
 * What the builders in ./scope call, so the lint exemption for
 * `revalidatePath` stays in this file alone. Callers that hold a workspace
 * should reach for `ServerWorkspaceURLs.revalidate`, which derives the path
 * instead of taking one.
 */
export function revalidateRoutePath(
  routePath: string,
  type?: 'page' | 'layout',
): void {
  revalidatePath(routePath, type);
}

/**
 * Revalidates a workspace page, or the whole workspace with no sub-path.
 *
 * Takes the tenant id and the access-checked `workspaceURL` a server action
 * already holds, and derives the route-tree path itself — there is no
 * path-shaped argument to get wrong.
 *
 * @deprecated Use `tenantURLs(tenantId).workspace(slug).revalidate(sub)`, or
 *   `access.url.revalidate(sub)` inside an action. This form takes the stored
 *   workspace URL, which callers will stop holding.
 */
export function revalidateWorkspacePath(
  scope: {tenantId: string; workspaceURL: string},
  subPath?: WorkspaceSubPath,
  type?: 'page' | 'layout',
): void {
  const routePath = routePathFromWorkspaceURL(
    scope.tenantId,
    scope.workspaceURL,
  );

  revalidatePath(`${routePath}${subPath ?? ''}`, type);
}

/** Revalidates every page — for auth flows that change who the visitor is. */
export function revalidateEverything(): void {
  revalidatePath('/', 'layout');
}
