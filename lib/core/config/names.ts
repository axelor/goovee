/*
 * The spelling that turns a setting's path into the environment variable that
 * carries it, and nothing else: no zod, no document, so both the schema (for its
 * messages) and the environment reader (for its lookups) can import it without
 * one depending on the other.
 */

/** Every configuration variable starts with this. Nothing else is read. */
export const ENV_PREFIX = 'PORTAL_';

/** The key holding the tenants in the parsed document. */
export const TENANTS_KEY = 'tenants';

/**
 * The segment that opens a tenant's variables: `PORTAL_TENANT_<ID>_…`.
 *
 * Singular, because each variable names one tenant, and fixed, so a tenant can
 * be called `push` or `origin` without colliding with a deployment setting.
 */
const TENANT_SEGMENT = 'TENANT';

/**
 * A camelCase key as an environment segment: `clientId` gives `CLIENT_ID`,
 * `backup1` gives `BACKUP1`, `up2pay` gives `UP2PAY`.
 */
function segmentFor(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

/**
 * The variable carrying the setting at `path`, as a zod issue or a walk of the
 * schema names it: `['tenants', 'acme', 'oauth', 'google', 'clientId']` gives
 * `PORTAL_TENANT_ACME_OAUTH_GOOGLE_CLIENT_ID`, and `['origin']` gives
 * `PORTAL_ORIGIN`.
 *
 * A tenant id is written as it stands, uppercased, so a placeholder such as
 * `<id>` passes through as `<ID>` for documentation. `['tenants']` alone names
 * every tenant's variables, `PORTAL_TENANT_*`.
 */
export function envNameFor(path: ReadonlyArray<PropertyKey>): string {
  const [first, ...rest] = path.map(String);

  if (first === undefined) return `${ENV_PREFIX}*`;

  if (first === TENANTS_KEY) {
    const [id, ...keys] = rest;

    if (id === undefined) return `${ENV_PREFIX}${TENANT_SEGMENT}_*`;

    return [
      `${ENV_PREFIX}${TENANT_SEGMENT}`,
      id.toUpperCase(),
      ...keys.map(segmentFor),
    ].join('_');
  }

  return `${ENV_PREFIX}${[first, ...rest].map(segmentFor).join('_')}`;
}
