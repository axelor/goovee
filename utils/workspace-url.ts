import {getBasePath} from '@/lib/core/path/base-path';

/**
 * Absolute root the app is served from: the public host joined with the
 * deployment base path, without a trailing slash
 * (e.g. `https://example.com/portal`, or just `https://example.com`).
 *
 * Workspace URLs are stored in this form, so this is the prefix to strip from
 * (or prepend to) a stored `workspace.url`.
 *
 * The host is a per-tenant value, so callers pass it in: server code reads it
 * from the tenant's config, client code from `useEnvironment()`.
 */
export function getPortalRoot(host?: string) {
  return `${host ?? ''}${getBasePath()}`;
}

/**
 * Converts a stored absolute `workspace.url` into the path a browser holds for
 * it, by removing the root the app is served from.
 *
 * What is left is `/{tenant}/{workspace}` for a tenant sharing its origin, and
 * `/{workspace}` for one reached by host — the tenant is named by the host there,
 * so its stored URL carries no tenant segment. Which of the two a URL is written
 * as follows from the tenant's own configuration; this only strips the root.
 */
export function toWorkspaceURI(workspaceURL: string, host?: string) {
  const root = getPortalRoot(host);

  /* Only a leading root followed by a path boundary is removed. An unanchored
   * replace would also cut the root out of the middle of a URL that happens to
   * carry it — in a query parameter, say — and without the boundary a URL
   * under an origin the root is merely a string prefix of (`…example.com.br`,
   * `…example.com:8443`) would be sliced mid-host. Either way the contract is
   * the same: a URL not under this root comes back unchanged. */
  if (!root || !workspaceURL.startsWith(root)) {
    return workspaceURL || '/';
  }

  const rest = workspaceURL.slice(root.length);

  if (rest && !rest.startsWith('/')) {
    return workspaceURL;
  }

  return rest || '/';
}
