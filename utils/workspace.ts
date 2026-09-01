import 'server-only';

import {getTenantConfig} from '@/tenant/config-provider';
import {getPublicEnvironment} from '@/environment/utils';
import {isHostRouted} from '@/lib/core/tenant/routing';
import {getPortalRoot} from './workspace-url';

/**
 * Resolves the route params of a workspace page into the paths its callers need:
 * `workspaceURI` for routing and `workspaceURL` for looking the workspace up by
 * its stored absolute URL.
 *
 * `workspaceURI` is the path the visitor's address bar holds, which is what makes
 * it usable as a link and comparable against `usePathname`. A tenant reached by
 * host carries no tenant segment there, while the route tree the proxy hands the
 * request to does — so this is not the path the page was routed at.
 *
 * Server-only: the host is a per-tenant browser variable, read from the tenant's
 * own configuration. The pure URL helpers live in `@/utils/workspace-url`, which
 * client components can import.
 *
 * An unknown tenant has no config and therefore no host, so `workspaceURL` comes
 * back without one and matches no stored workspace — the caller's own workspace
 * lookup then denies access rather than granting it.
 */
export function workspacePathname(params: {
  tenant: string;
  workspace: string;
}): {
  tenant: string;
  workspace: string;
  workspaceURI: string;
  workspaceURL: string;
} {
  const {tenant, workspace} = params;

  const config = getTenantConfig(tenant);
  const host = getPublicEnvironment(config).GOOVEE_PUBLIC_HOST;

  const workspaceURI =
    config && isHostRouted(config)
      ? `/${workspace}`
      : `/${tenant}/${workspace}`;
  const workspaceURL = `${getPortalRoot(host)}${workspaceURI}`;

  return {
    tenant,
    workspace,
    workspaceURI,
    workspaceURL,
  };
}
