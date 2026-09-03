import {withBasePath} from '@/lib/core/path/base-path';

import {absoluteRoot} from './absolute';
import type {WorkspaceSubPath} from './index';

/**
 * The addresses of one workspace, in the form each consumer needs.
 *
 * Every method takes the same argument — a path below the workspace — and the
 * method name says who reads the result. Nothing here asks the caller which
 * shape a path should have.
 *
 * Built from a prefix that is already in visitor shape rather than from the
 * tenant's configuration, so the same object can be assembled anywhere that
 * prefix reaches — which is what will let a component hold one without learning
 * how its tenant is routed. `ServerWorkspaceURLs` extends it with the forms
 * that need configuration or the database.
 */
export type WorkspaceURLs = {
  readonly tenantId: string;
  readonly workspace: string;

  /**
   * The path Next resolves: for `Link`, `router.push`/`replace` and `redirect`.
   * No base path — those three add it themselves, and adding it here would
   * produce it twice.
   */
  forRouter(sub?: WorkspaceSubPath): string;

  /**
   * The path the browser fetches itself, base path included: an `img` source, a
   * download `href`, a `fetch` call. Next never rewrites these, so the whole
   * address has to be present in the string.
   */
  forBrowser(sub?: WorkspaceSubPath): string;

  /**
   * The absolute address, for anything read outside the app — a link in an
   * email, a return address handed to a payment gateway.
   *
   * The host comes from the tenant's configuration rather than from the
   * request, so nothing an incoming address carries can decide where the
   * outside is sent.
   */
  forExternal(sub?: WorkspaceSubPath): string;
};

/**
 * Builds the workspace addresses from a prefix that is already in visitor
 * shape.
 *
 * `visitorPrefix` is `/{workspace}` for a tenant reached on an origin of its
 * own and `/{tenant}/{workspace}` for one reached under a path segment; it
 * decides every path this returns. `host` is the tenant's own origin, scheme
 * and host with no trailing slash.
 *
 * The workspace root is addressed by omitting the sub-path, or by passing `/`;
 * both give the prefix with no trailing slash, because Next redirects a
 * trailing slash away before a request reaches the route.
 */
export function workspaceURLsFrom({
  tenantId,
  workspace,
  visitorPrefix,
  host,
}: {
  tenantId: string;
  workspace: string;
  visitorPrefix: string;
  /* Undefined for a tenant the configuration document does not name, whose
   * absolute addresses then carry no host and match no stored workspace.
   * Required rather than optional so a caller states it either way. */
  host: string | undefined;
}): WorkspaceURLs {
  const forRouter = (sub: WorkspaceSubPath = '/') =>
    sub === '/' ? visitorPrefix : `${visitorPrefix}${sub}`;

  return {
    tenantId,
    workspace,
    forRouter,
    forBrowser: sub => withBasePath(forRouter(sub)),
    forExternal: sub => `${absoluteRoot(host)}${forRouter(sub)}`,
  };
}
