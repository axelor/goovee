import {SEARCH_PARAMS} from '@/constants';
import {manager} from '@/tenant';

/** The first value of a search param, which Next hands over repeated as an array. */
export function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The tenant an auth screen is for.
 *
 * These screens sit outside the `[tenant]` path segment, so only the address can
 * name the tenant. The search param the portal adds when it sends a visitor here
 * wins. A screen opened directly falls back to the document's default tenant.
 *
 * Empty if neither names one. Every screen calls this, so two of them cannot
 * disagree within one request.
 */
export function resolveAuthTenantId(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  /* Two spellings: `/auth/error` links use `tenantId`, every other screen uses
   * `tenant`. A repeated parameter gives its first value. The value arrives
   * already decoded, and decoding it again would throw on a bare `%`. */
  return (
    firstValue(searchParams[SEARCH_PARAMS.TENANT_ID]) ||
    firstValue(searchParams.tenantId) ||
    manager.getDefaultTenantId() ||
    ''
  );
}
