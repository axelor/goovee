// Paths that should never be prefixed:
// - Absolute URLs (http:, https:, mailto:, etc.)
// - Protocol-relative URLs (//)
// - Hash fragments (#section)
const SKIP_PATH_PREFIX = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i;

export function normalizePathPrefix(value?: string | null) {
  const raw = value?.trim();
  if (!raw || raw === '/') return '';

  const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
  return prefixed.replace(/\/+$/, '');
}

/**
 * Joins a prefix onto a path, once. The path must not already carry it.
 *
 * Joins even when the path already starts with the prefix: that start is not
 * proof the prefix was added. Under a base path `/portal`, a tenant or a
 * workspace called `portal` has visitor paths that begin with `/portal/`
 * because of its name, and a join that took that as already done would drop
 * the base path from every address built for it.
 */
export function withPathPrefix(prefix: string, path: string) {
  if (!prefix || !path || SKIP_PATH_PREFIX.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${prefix}${normalizedPath}`;
}
