/*
 * Tunables for the staged-upload mechanism. The sweep cadences and TTL are fixed
 * constants here; only the record retention is env-overridable (in hours), read
 * at its calling site, so this file never touches process.env.
 */

/** Hours → milliseconds. */
export const HOUR_MS = 60 * 60 * 1000;

/** Default time-to-live for a staged-but-unredeemed upload. */
export const DEFAULT_TTL_MS = 24 * HOUR_MS; // 24h

/*
 * Cap how many rows a single reaper pass deletes, so a large backlog drains
 * over successive runs instead of one unbounded transaction.
 */
export const REAP_BATCH_LIMIT = 500;

/*
 * How long after startup the first sweep of each pass fires — a short delay
 * lets the database become reachable before the first attempt.
 */
export const INITIAL_SWEEP_DELAY_MS = 60 * 1000; // 1min

/*
 * How often the reap sweep runs. Only bounds the lag between a claim's expiry
 * (set from its purpose's TTL) and its deletion, so it is a fixed constant.
 */
export const REAP_INTERVAL_MS = 1 * HOUR_MS; // 1h

/*
 * How often the prune sweep runs — slower than reap, since a consumed tombstone
 * only becomes eligible as the retention clock advances, so a daily sweep is
 * plenty.
 */
export const PRUNE_INTERVAL_MS = 24 * HOUR_MS; // 24h

/*
 * Default retention for a terminal staged-upload record (consumed or reaped)
 * before the prune pass deletes it. Overridable in hours via
 * UPLOAD_RECORD_RETENTION_HOURS.
 */
export const DEFAULT_RECORD_RETENTION_HOURS = 7 * 24; // 7d
