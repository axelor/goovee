import {normalizePathPrefix, withPathPrefix} from './prefix';

/* Not exported: `withBasePath` is the join everything should reach for, and
 * `getBasePath` the single raw read the lint rule names and restricts. Handing
 * out the value itself as well would leave a second, unrestricted door onto the
 * footgun that rule exists to close. */
const BASE_PATH = normalizePathPrefix(process.env.NEXT_PUBLIC_BASE_PATH);

/**
 * Adds the configured base path to an internal URL.
 *
 * - No-op if no base path is configured
 * - Skips external URLs and hash fragments
 * - Safe to call multiple times (won't double-prefix)
 *
 * Use for raw URL strings that Next.js does not rewrite automatically
 * (e.g. image src, fetch URLs, service workers, manifests, static assets).
 *
 * Do not use for next/link, router.push/replace, or redirect, since Next.js
 * already applies the base path for those.
 */
export function withBasePath(path: string) {
  return withPathPrefix(BASE_PATH, path);
}

export function getBasePath() {
  return BASE_PATH;
}

/**
 * The deployment root as a path: `/portal` for a base path, `/` for none.
 *
 * For a cookie's `path`, which is why it carries no trailing slash and why `/`
 * stands in for the empty prefix. A cookie path matches the request path only
 * where the two are equal or the path is a prefix ending at a segment boundary,
 * so `/portal/` would not be sent to `/portal` itself — the address the entry
 * page is served at — and an empty value is not a path at all, leaving the
 * browser to scope the cookie to whichever directory happened to write it.
 */
export function deploymentRootPath() {
  return BASE_PATH || '/';
}
