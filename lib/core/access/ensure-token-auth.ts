import 'server-only';

// ---- CORE IMPORTS ---- //
import {manager, type Tenant} from '@/tenant';
import {resolveGuestWorkspace, type Workspace} from '@/orm/workspace';
import type {AccessReason} from './ensure-auth';

/**
 * Establishes the workspace context for a capability-token request — one that
 * carries a token instead of a session. Unlike ensureAuth it resolves no user
 * and no sub-app: a token is a capability, not an identity, so there is no
 * sub-app role to read and the gate cannot key off one. It only confirms the
 * workspace exists (resolved from its default guest config, the same shape a
 * guest sees) and returns the token so the caller can fuse it into its query.
 *
 * It does NOT authorize the token against any record. The real authorization
 * stays in the caller's data query, which must fuse the token into its WHERE
 * (e.g. `record.id = X AND tokenList.token = T AND not expired`). A caller that
 * takes the ok result and then queries without fusing `token` grants access to
 * every record, not just the token's — so fusing is mandatory at every call.
 *
 * The single denial reason reuses AccessReason.'workspace-not-found' so the
 * shared accessStatus / accessMessage helpers map it without a special case.
 */
export type TokenAccessResult =
  | {
      ok: true;
      workspace: Workspace;
      tenant: Tenant;
      token: string;
    }
  | {
      ok: false;
      reason: Extract<AccessReason, 'workspace-not-found'>;
    };

export async function ensureTokenAuth({
  url,
  tenantId,
  token,
}: {
  url: string;
  tenantId: Tenant['id'];
  token: string;
}): Promise<TokenAccessResult> {
  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return {ok: false, reason: 'workspace-not-found'};
  }
  const {client} = tenant;

  const workspace = await resolveGuestWorkspace({url, client});
  if (!workspace) {
    return {ok: false, reason: 'workspace-not-found'};
  }

  return {ok: true, workspace, tenant, token};
}
