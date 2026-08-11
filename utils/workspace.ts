import 'server-only';

import {getTenantConfigSync} from '@/tenant/config-provider';
import {getPublicEnvironment} from '@/environment/utils';
import {getPortalRoot} from './workspace-url';

/**
 * Resolves the route params of a workspace page into the paths its callers need:
 * `workspaceURI` for routing and `workspaceURL` for looking the workspace up by
 * its stored absolute URL.
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

  const host = getPublicEnvironment(
    getTenantConfigSync(tenant),
  ).GOOVEE_PUBLIC_HOST;

  const workspaceURI = `/${tenant}/${workspace}`;
  const workspaceURL = `${getPortalRoot(host)}${workspaceURI}`;

  return {
    tenant,
    workspace,
    workspaceURI,
    workspaceURL,
  };
}
