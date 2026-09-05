import {withBasePath} from '@/lib/core/path/base-path';

import {absoluteRoot} from './absolute';

/**
 * A path from the tenant's own root, starting with a slash: `/auth/login`,
 * `/api/push/subscribe`, `/sales/invoices/8`.
 *
 * Measured from the tenant, not from the deployment. The two part company only
 * for a tenant sharing an origin, where the deployment root holds a segment for
 * every tenant and this one's addresses all sit under its own.
 */
export type TenantPath = `/${string}`;

/**
 * The addresses of one tenant, in the form each consumer needs.
 *
 * The sibling of `WorkspaceScope` one level up, and assembled the same way: from
 * a prefix already in visitor shape, so the same object can be built on the
 * server from the configuration and in the browser from what the server sent,
 * and neither caller has to know how the tenant is routed.
 */
export type TenantScope = {
  readonly tenantId: string;

  /**
   * The path Next resolves: for `Link`, `router.push`/`replace` and `redirect`.
   * No base path — those three add it themselves.
   */
  forRouter(path: TenantPath): string;

  /**
   * The path the browser fetches itself, base path included: an `img` source, a
   * `fetch` call, an `EventSource`. Next never rewrites these, so the whole
   * address has to be in the string.
   */
  forBrowser(path: TenantPath): string;

  /**
   * The absolute address, for anything read outside the app — a link in an
   * email, a webhook address given to a payment provider.
   */
  forExternal(path: TenantPath): string;
};

/**
 * Builds a tenant's scope from a prefix that is already in visitor shape.
 *
 * `visitorPrefix` is empty for a tenant reached on an origin of its own and
 * `/{tenant}` for one reached under a path segment; it decides every path this
 * returns. `host` is the tenant's own origin, scheme and host with no trailing
 * slash.
 */
export function buildTenantScope({
  tenantId,
  visitorPrefix,
  host,
}: {
  tenantId: string;
  visitorPrefix: string;
  /* Undefined for a tenant the configuration document does not name, whose
   * absolute addresses then carry no host. Required rather than optional so a
   * caller states it either way. */
  host: string | undefined;
}): TenantScope {
  const forRouter = (path: TenantPath) => `${visitorPrefix}${path}`;

  return {
    tenantId,
    forRouter,
    forBrowser: path => withBasePath(forRouter(path)),
    forExternal: path => `${absoluteRoot(host)}${forRouter(path)}`,
  };
}
