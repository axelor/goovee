import type {TenantScope} from '@/lib/core/url/tenant-urls';

/**
 * The address of a tenant's sign-in screen, carrying what the visitor should be
 * returned to once signed in.
 *
 * The tenant is named by the address rather than by a parameter: the screen is
 * one of the tenant's own pages, so the scope that builds every other address
 * below the tenant builds this one too. A screen reached this way cannot be
 * shown for a tenant other than the one whose address it was reached at.
 *
 * `callbackurl` and `workspaceURI` are left out when falsy, so an empty string
 * drops along with the nullish values. The screen returns the visitor to
 * `callbackurl` only if it lands on the tenant's own origin.
 */
export function getLoginURL(
  scope: TenantScope,
  params: {callbackurl?: string; workspaceURI?: string} = {},
) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => key && value && search.append(key, String(value)),
  );

  const query = search.toString();

  return scope.forRouter(`/auth/login${query ? `?${query}` : ''}`);
}
