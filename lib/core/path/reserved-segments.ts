/*
 * Two lists, because a first path segment answers two different questions.
 *
 * A tenant may not be *named* after any of these: the proxy reads the first
 * segment of an address as a tenant, so a tenant sharing a name with something
 * the deployment serves would never be reached.
 *
 * Only some of them are *addresses the deployment answers itself*, and that is
 * the narrower list below. The difference is `api` and `auth`: a tenant's route
 * handlers sit at `/<tenant>/api` and its sign-in screens at `/<tenant>/auth`,
 * and on an origin a tenant holds to itself those addresses arrive without that
 * segment, so the proxy has to put one on rather than pass the request through.
 * No tenant may still be called either.
 *
 * The proxy and the configuration document both read these — the proxy to pass
 * an address through, the document to refuse a tenant id — so the two cannot
 * disagree about which ids work.
 */

/** Addresses the deployment answers itself, whichever tenant's origin they arrive on. */
const DEPLOYMENT_SEGMENTS = [
  /* The deployment's own route handlers. */
  'deployment',
  /* Static directories under /public. Add a new one here as well, or a tenant
   * can be named after it and lose its addresses to the files. */
  'images',
  'locales',
  'pdfjs',
  'pwa',
  'website',
];

/**
 * Names no tenant may take: every deployment segment, plus the two a tenant
 * serves under its own segment. A tenant called `api` or `auth` would have its
 * own route handlers or sign-in screens answered where its workspaces are.
 */
const RESERVED_PATH_SEGMENTS = [...DEPLOYMENT_SEGMENTS, 'api', 'auth'];

const deployment = new Set(DEPLOYMENT_SEGMENTS);
const reserved = new Set(RESERVED_PATH_SEGMENTS);

/**
 * Whether a first path segment names something the deployment serves, so that a
 * tenant may not be called it.
 *
 * Case is ignored. Whether `/Images` is served as a static file depends on the
 * filesystem, and a tenant id should not be valid or invalid for that reason.
 */
export function isReservedSegment(segment: string): boolean {
  return reserved.has(segment.toLowerCase());
}

/**
 * Whether a first path segment is an address the deployment answers itself, and
 * so one the proxy leaves without a tenant segment.
 *
 * Narrower than `isReservedSegment`: a name a tenant may not take is not the
 * same as an address that belongs to no tenant.
 */
export function isDeploymentSegment(segment: string): boolean {
  return deployment.has(segment.toLowerCase());
}

/** The reserved segments, sorted, so a message listing them reads the same every time. */
export function reservedSegments(): string[] {
  return [...RESERVED_PATH_SEGMENTS].sort();
}
