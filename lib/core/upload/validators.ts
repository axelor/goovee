import {z} from 'zod';

/**
 * Reusable schema for a redeemable upload token; consumers compose this into
 * their own submit validators. (The stage route takes `purpose` as a path
 * segment, so it has no request-body fields to validate.)
 */
export const uploadTokenSchema = z.uuid();
