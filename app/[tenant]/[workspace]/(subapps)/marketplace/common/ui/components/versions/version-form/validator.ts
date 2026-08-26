export const MAX_BUNDLE_SIZE = 100 * 1024 * 1024; // 100 MB

/** How many versions the editor loads per page (initial + each fetch). */
export const VERSIONS_PAGE_SIZE = 8;

/** Prefetch the next page once this many loaded entries remain ahead of the
 *  current position, so paging stays ahead of the user without blocking. */
export const VERSIONS_PREFETCH_AHEAD = 3;
