/*
 * First path segments the deployment answers itself. A tenant cannot be named
 * after one of them.
 *
 * The proxy reads the first segment of an address as a tenant name. A tenant
 * named `auth` or `images` would therefore never be reached: Next would route
 * `/<id>/<workspace>`, but the proxy would pass the request through without
 * setting the tenant header, and every server action would then find no tenant.
 *
 * The proxy and the configuration document both read this list — the proxy to
 * pass these addresses through, the document to refuse them as tenant ids — so
 * the two cannot disagree about which ids work.
 */
const RESERVED_PATH_SEGMENTS = [
  /* Served before a tenant is resolved. */
  'auth',
  /* Route handlers, which carry their tenant in the path after `/api/tenant`. */
  'api',
  /* Static directories under /public. Add a new one here as well, or a tenant
   * can be named after it and lose its addresses to the files. */
  'images',
  'locales',
  'pdfjs',
  'pwa',
  'website',
];

const reserved = new Set(RESERVED_PATH_SEGMENTS);

/**
 * Whether a first path segment is one the deployment answers itself.
 *
 * Case is ignored. Whether `/Images` is served as a static file depends on the
 * filesystem, and a tenant id should not be valid or invalid for that reason.
 */
export function isReservedSegment(segment: string): boolean {
  return reserved.has(segment.toLowerCase());
}

/** The reserved segments, for error messages that list them. */
export function reservedSegments(): string[] {
  return [...RESERVED_PATH_SEGMENTS].sort();
}
