import {headers} from 'next/headers';

import {SEARCH_PARAMS} from '@/constants';
import {manager} from '@/tenant';
import {listTenantConfigs} from '@/tenant/config-provider';
import {addressedHost, hostRoutedTenantId} from '@/lib/core/tenant/routing';

/** The first value of a search param, which Next hands over repeated as an array. */
export function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The tenant an auth screen is for.
 *
 * These screens sit outside the `[tenant]` path segment, so the tenant is named
 * by the rest of the address: the search param the portal adds when it sends a
 * visitor here, or the host, where that names a tenant of its own. A screen
 * opened directly on an origin serving several tenants falls back to the
 * document's default tenant.
 *
 * The param is taken only where it names a tenant the document holds, so a stale
 * one does not hide the tenant whose origin the visitor is on. The proxy has
 * already moved a request naming a tenant served elsewhere onto that tenant's
 * origin, so by the time a screen renders the two agree.
 *
 * Empty if none of them names one. Every screen calls this, so two of them cannot
 * disagree within one request.
 */
export async function resolveAuthTenantId(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<string> {
  /* Two spellings: `/auth/error` links use `tenantId`, every other screen uses
   * `tenant`. A repeated parameter gives its first value. The value arrives
   * already decoded, and decoding it again would throw on a bare `%`. */
  const named =
    firstValue(searchParams[SEARCH_PARAMS.TENANT_ID]) ||
    firstValue(searchParams.tenantId);

  if (named && manager.getConfig(named)) return named;

  const host = addressedHost(await headers());
  const fromHost = host && hostRoutedTenantId(host, listTenantConfigs());

  return fromHost || named || manager.getDefaultTenantId() || '';
}
