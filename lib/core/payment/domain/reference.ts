import {randomBytes} from 'node:crypto';

/*
 * A payment reference is `GVP-<15 random characters>-<tenant id>`.
 *
 * The fixed prefix lets a handler answer "is this ours?" with a string test
 * before touching the database, which is what keeps a shared merchant account's
 * legacy traffic out. The random part is Crockford base32, so it survives
 * providers that upper-case, and gives about 75 bits of entropy. The tenant
 * marker says which tenant minted it, so a callback reaching another tenant's
 * endpoint is rejected rather than settled through the wrong database.
 *
 * At most 35 characters, because HUB PISP carries it in a 35-character field
 * and a tenant id may hold up to 15 characters.
 */
export const REFERENCE_PREFIX = 'GVP';

const RANDOM_LENGTH = 15;

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const REFERENCE_PATTERN = new RegExp(
  `^${REFERENCE_PREFIX}-([${ALPHABET}]{${RANDOM_LENGTH}})-([a-z][a-z0-9]*)$`,
);

export function mintReference(tenantId: string): string {
  const bytes = randomBytes(RANDOM_LENGTH);
  let random = '';
  for (const byte of bytes) {
    random += ALPHABET[byte % ALPHABET.length];
  }
  return `${REFERENCE_PREFIX}-${random}-${tenantId}`;
}

export type ParsedReference = {
  reference: string;
  tenantId: string;
};

/** The parts of a reference, or null for anything that is not one of ours. */
export function parseReference(value: unknown): ParsedReference | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = REFERENCE_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  return {reference: value, tenantId: match[2]};
}

/** Finds the first thing that looks like one of our references inside a longer string. */
export function findReference(value: unknown): ParsedReference | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = new RegExp(
    `${REFERENCE_PREFIX}-[${ALPHABET}]{${RANDOM_LENGTH}}-[a-z][a-z0-9]*`,
  ).exec(value);
  return match ? parseReference(match[0]) : null;
}
