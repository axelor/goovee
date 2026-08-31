// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {getPublicEnvironment} from '@/environment';
import {getBasePath, withBasePath} from '@/lib/core/path/base-path';
import {
  findDefaultPartnerWorkspace,
  findWorkspace,
  findWorkspaces,
} from '@/orm/workspace';
import {manager} from '@/tenant';
import type {User} from '@/types';
import {getPartnerId} from '@/utils';
import type {Client} from '@/goovee/.generated/client';

import {getShellConfig} from './[tenant]/[workspace]/orm/config';

/* Whether the workspace at `url` opens for this visitor: one with a home page
 * opens even when the visitor can reach none of its applications. The workspace's
 * own page decides the same way, but from the address it is reached at rather
 * than from the URL tested here — so a URL that is not the address the workspace
 * is served at can pass this and still fail on arrival. */
async function opensForVisitor({
  url,
  user,
  client,
}: {
  url: string;
  user?: User;
  client: Client;
}) {
  const workspace = await findWorkspace({url, user, client});

  if (!workspace) return false;

  const config = await getShellConfig(workspace.config.id, client);

  if (!config) return false;

  return Boolean(config.isHomepageDisplay || workspace.apps?.length);
}

/* Resolves where a visitor naming a tenant but no workspace should go: the two
 * such addresses are `/` with a `?tenant=` parameter and `/<tenant>`. Returns an
 * absolute URL, or null when the tenant is not configured or holds nothing this
 * visitor can open. Answering with a value rather than redirecting lets each
 * caller reply in its own terms — a page redirects, a route handler returns a
 * response. The tenant is named by the caller in both cases, so it is checked
 * against the configured ones here rather than trusted.
 *
 * The destination is the workspace, not one of its applications: the workspace's
 * own page is what decides whether it opens on its home page or goes straight to
 * an application. Candidates are only tested for whether they open at all, so
 * that a workspace holding nothing for this visitor is passed over for the next
 * one instead of being landed on. The candidate set is narrower for a visitor
 * with no session, holding only workspaces that offer guest applications — a
 * public workspace whose only content is a home page is not among them. */
export async function resolveLanding({
  tenantId,
  workspaceURI: requestedWorkspaceURI,
}: {
  tenantId: string;
  workspaceURI?: string;
}): Promise<string | null> {
  const knownTenantIds = await manager.listTenantIds();

  if (!tenantId || !knownTenantIds.includes(tenantId)) {
    return null;
  }

  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return null;
  }

  const {client} = tenant;

  const session = await getSession();
  const user = session?.user;

  const host = getPublicEnvironment(tenant.config).GOOVEE_PUBLIC_HOST!;
  const baseUrl = `${host}${getBasePath()}`;

  const workspaces = await findWorkspaces({
    url: baseUrl,
    user,
    client,
  });

  if (!workspaces?.length) {
    return null;
  }

  const workspaceURI = decodeURIComponent(requestedWorkspaceURI || '');

  if (workspaceURI) {
    const url = `${host}${withBasePath(workspaceURI)}`;

    if (await opensForVisitor({url, user, client})) {
      return url;
    }
  }

  let redirectURL;

  if (user) {
    const partnerId = getPartnerId(user);

    const defaultWorkspace = await findDefaultPartnerWorkspace({
      partnerId,
      client,
    });

    if (defaultWorkspace?.workspace?.url) {
      const url = defaultWorkspace.workspace.url;
      if (await opensForVisitor({url, user, client})) {
        redirectURL = url;
      }
    }
  }

  if (!redirectURL) {
    for (const workspace of workspaces) {
      const url = workspace.url!;
      if (await opensForVisitor({url, user, client})) {
        redirectURL = url;
        break;
      }
    }
  }

  return redirectURL ?? null;
}
