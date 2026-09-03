/*
 * State carried in a query string as one compressed token, for values too large
 * to spell out as ordinary parameters — a ticket filter, a payment reference.
 *
 * The pair is lz-string's encoded-URI-component codec either side of JSON, so a
 * token round-trips only through the matching half, and a token already sent out
 * stays readable only while both halves keep that codec.
 */

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

import type {Maybe} from '@/types/util';

/**
 * A value as a single query-parameter token, compressed so a large one still
 * fits in an address bar.
 *
 * The token is safe to interpolate into a query string as it stands and safe to
 * set through `URLSearchParams`; `decode` reads back either.
 *
 * Comes back empty both for a nullish value and for one `JSON.stringify`
 * refuses — a circular object, a `BigInt` — which is reported to the console and
 * nowhere else. A caller therefore cannot tell a refused value from an absent
 * one, and has to treat an empty result as "no parameter" rather than append it.
 */
export function encode<T extends Maybe<Record<string, unknown>>>(
  value: T,
): string {
  if (!value) return '';
  try {
    const stringify = JSON.stringify(value);
    return compressToEncodedURIComponent(stringify);
  } catch (e) {
    console.error(e);
    return '';
  }
}

/**
 * The value a token was made from, or `undefined` for an absent token.
 *
 * Untyped, and not to be trusted: the token comes off the address bar, so a
 * hand-edited or foreign one decodes to whatever it happens to decode to —
 * `undefined`, `null`, or a value of an unrelated shape. Test the result against
 * the shape the caller needs rather than against `undefined`.
 */
export function decode(token: Maybe<string>): unknown {
  if (!token) return;
  try {
    const stringify = decompressFromEncodedURIComponent(token);
    return JSON.parse(stringify);
  } catch (e) {
    console.error(e);
    return;
  }
}
