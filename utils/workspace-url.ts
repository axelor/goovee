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
  return workspaceURL.replace(getPortalRoot(host), '') || '/';
}
