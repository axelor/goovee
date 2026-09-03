import type {Tenant} from '@/tenant';

/**
 * The address of the sign-in screen, carrying what the visitor should be
 * returned to once signed in.
 *
 * Every parameter is optional and a falsy one is left out rather than sent
 * empty, so an empty string drops along with the nullish values. The sign-in
 * screen returns the visitor to `callbackurl` only if it lands on the tenant's
 * own origin.
 */
export function getLoginURL(params: {
  callbackurl?: string;
  workspaceURI?: string;
  tenant?: Tenant['id'] | number | null;
}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(
    ([key, value]) => key && value && sp.append(key, String(value)),
  );

  return `/auth/login?${sp.toString()}`;
}
