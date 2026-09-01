import {headers} from 'next/headers';
import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSessionTenantId} from '@/lib/auth';
import {getTenantConfig} from '@/tenant/config-provider';

// ---- LOCAL IMPORTS ---- //
import Content from './content';

/**
 * The address to return to after signing out, or null for one this deployment
 * does not answer.
 *
 * A single leading slash and nothing else: `//host/path` is an address of
 * another origin, and a backslash is read as a slash by some browsers, so
 * either would send a visitor off this deployment.
 */
function resolveCallback(value: string | undefined): string | null {
  if (!value) return null;

  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return null;
  }

  return value;
}

/** The tenant an address belongs to: its first path segment. */
function tenantOf(path: string): string {
  return path.match(/^\/([^/?#]+)/)?.[1] ?? '';
}

/**
 * Signs a visitor out of this tenant so they can reach another one.
 *
 * A session belongs to a single tenant, so the proxy refuses an address of
 * another tenant and sends the visitor here, under the tenant they are signed in
 * to, with the refused address to return to.
 *
 * Being under `/<tenant>/` is what makes the sign-out complete rather than
 * partial: the document is created inside the service worker's scope, so the
 * push subscription registered there can be revoked before the session ends.
 * The same sign-out from an address outside this tenant reaches no registration
 * and leaves the device subscribed.
 *
 * The cost of sitting there is that no workspace can be called `sign-out`: a
 * static route wins over the `[workspace]` segment beside it, so a workspace
 * reached at `/<tenant>/sign-out` would be answered by this screen instead — and
 * on a tenant reached by host, where the tenant segment is put back on by the
 * proxy, that address is `/sign-out`. Workspace addresses are set in AOS, where
 * nothing refuses the name, and every further static route added under
 * `[tenant]` takes one more name out of their reach.
 */
export default async function Page(props: {
  params: Promise<{tenant: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {tenant} = await props.params;
  const searchParams = await props.searchParams;

  const {callbackurl: callbackParam} = searchParams;

  const callbackurl = resolveCallback(
    Array.isArray(callbackParam) ? callbackParam[0] : callbackParam,
  );

  /* The session decides whether there is anything to sign out of, and it can
   * end between the proxy sending the visitor here and this render. A session
   * of another tenant does not belong here either: the proxy sends that one to
   * its own tenant's screen. Both carry on to where the visitor was going. */
  const activeTenant = await getSessionTenantId(await headers());

  if (activeTenant !== tenant) {
    redirect(callbackurl ?? '/');
  }

  /* This screen tells the visitor that signing out takes them to the tenant
   * they asked for, so it is shown only for one the document holds. The proxy
   * sends nothing else; a typed address can name anything. */
  if (!callbackurl) {
    redirect('/');
  }

  const target = tenantOf(callbackurl);

  /* An address of this tenant is one the session already reaches, so the visitor
   * is taken there rather than asked to sign out of the tenant serving it. The
   * proxy never names one — the address it carries is the one it refused — but a
   * link written by hand can. */
  if (target === tenant) {
    redirect(callbackurl);
  }

  if (!getTenantConfig(target)) {
    redirect('/');
  }

  return (
    <Content
      activeTenant={tenant}
      target={target}
      callbackurl={callbackurl}
      activeTenantServed={getTenantConfig(tenant) !== null}
    />
  );
}
