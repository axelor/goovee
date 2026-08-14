import {z} from 'zod';

/**
 * Reusable schema for a redeemable upload token; consumers compose this into
 * their own submit validators. (The stage route takes `purpose` as a path
 * segment, so it has no request-body fields to validate.)
 */
export const uploadTokenSchema = z.uuid();

/**
 * A byte count carried in a request header. Headers are absent or arbitrary
 * text until proven otherwise, so this takes digits only — a missing header is
 * rejected rather than coerced to zero and accepted as a valid offset.
 */
export const byteCountHeader = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().nonnegative());

/** An upload's public handle, as carried in `X-File-Id`. */
export const fileIdHeader = z.uuid();
