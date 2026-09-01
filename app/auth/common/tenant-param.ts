import {SEARCH_PARAMS} from '@/constants';

/**
 * The address's own parameters, plus the resolved tenant.
 *
 * The auth screens link to each other. Passing the address through unchanged
 * would send a visitor who arrived without a tenant to another screen that also
 * has none, where the form cannot be submitted.
 *
 * This lives apart from `resolveAuthTenantId` so a client component can import
 * it without pulling the tenant manager into the browser bundle.
 */
export function withTenantParam(
  searchParams: URLSearchParams,
  tenantId: string,
): string {
  const params = new URLSearchParams(searchParams);

  if (tenantId) {
    params.set(SEARCH_PARAMS.TENANT_ID, tenantId);
  }

  return params.toString();
}
