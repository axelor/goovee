import {normalizePathPrefix, withPathPrefix} from './utils';

export const BASE_PATH = normalizePathPrefix(process.env.NEXT_PUBLIC_BASE_PATH);

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
