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

export function withPathPrefix(prefix: string, path: string) {
  if (!prefix || !path || SKIP_PATH_PREFIX.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
    ? normalizedPath
    : `${prefix}${normalizedPath}`;
}
