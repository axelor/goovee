export const MAX_BUNDLE_SIZE = 20 * 1024 * 1024; // 20 MB

/** How many versions the editor loads per page (initial + each fetch). */
export const VERSIONS_PAGE_SIZE = 8;

/** Prefetch the next page once this many loaded entries remain ahead of the
 *  current position, so paging stays ahead of the user without blocking. */
export const VERSIONS_PREFETCH_AHEAD = 3;
