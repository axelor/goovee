/**
 * A path below a workspace, starting with a slash: `/forum/post/12`,
 * `/events?category=3`, `/invoices/8#comment-2`.
 *
 * This is the only path shape subapp code should build by hand. It carries no
 * tenant, no workspace, no base path and no host, so it cannot encode a wrong
 * one: the helpers in this module combine it with the right prefix for each
 * consumer (a link, a cache key, a stored row, an absolute URL).
 */
export type WorkspaceSubPath = `/${string}`;

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Whether `value` is an absolute URL — a scheme and authority in front, rather
 * than a path. Anchored, so a path whose query merely embeds a URL is not one.
 */
export function isAbsoluteURL(value: string): boolean {
  return ABSOLUTE_URL.test(value);
}

/**
 * The part of `pathname` below the workspace, or null when the pathname is
 * outside it. `/` when the pathname is the workspace root itself.
 *
 * The workspace prefix of a pathname is configuration, not parseable text: a
 * tenant reached on its own origin has no tenant segment in its addresses,
 * while one reached under a path segment does. So the caller hands in the
 * `workspaceURI` it got from `useWorkspace()` or `workspacePathname()`, and
 * this only strips it — never a regex over `usePathname()`.
 */
export function subPathOf(
  pathname: string,
  workspaceURI: string,
): WorkspaceSubPath | null {
  if (pathname === workspaceURI) return '/';

  if (!pathname.startsWith(`${workspaceURI}/`)) return null;

  return pathname.slice(workspaceURI.length) as WorkspaceSubPath;
}
