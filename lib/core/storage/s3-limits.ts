/*
 * What the S3 API accepts as a part, kept apart from the store that speaks to
 * it so the configuration schema can bound a setting without loading a client.
 *
 * These are this one service's limits, not every store's: a store whose own
 * protocol bounds its pieces differently states its own beside itself.
 */

/** The S3 API refuses a part below this, other than the last of a file. */
export const MIN_PART_SIZE = 5 * 1024 * 1024;

/** The largest part the S3 API takes. */
export const MAX_PART_SIZE = 5 * 1024 * 1024 * 1024;

/* Inside AWS's own guidance, and what the MinIO client defaults to. */
export const DEFAULT_PART_SIZE = 16 * 1024 * 1024;
