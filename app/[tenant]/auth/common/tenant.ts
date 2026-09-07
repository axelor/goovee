import {headers} from 'next/headers';

import {TENANT_HEADER} from '@/proxy';

/** The first value of a search param, which Next hands over repeated as an array. */
export function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The tenant an auth screen is for: the one whose address it was reached at.
 *
 * These screens sit under the tenant segment, so the tenant is settled by the
 * address before anything renders — there is nothing to resolve between, and no
 * fallback to reach for. Read from the header the proxy sets rather than from
 * `params`, so a component below a page can ask for it without every page above
 * it threading it down.
 *
 * Empty only where the proxy did not run, which for these screens means an
 * address it does not match — none of them.
 */
export async function resolveAuthTenantId(): Promise<string> {
  return (await headers()).get(TENANT_HEADER) ?? '';
}
