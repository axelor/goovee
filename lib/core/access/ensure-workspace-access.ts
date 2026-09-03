import 'server-only';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {currentWorkspace} from '@/lib/core/url/current';
import type {ServerWorkspaceURLs} from '@/lib/core/url/scope';
import {findWorkspace, type Workspace} from '@/orm/workspace';
import {manager, type Tenant} from '@/tenant';
import type {User} from '@/types';

import type {AccessReason} from './ensure-access';

/**
 * Why workspace access was denied — the three of `AccessReason` that can be
 * decided without a sub-app, so `accessStatus` and `accessMessage` map them
 * with no case of their own.
 */
export type WorkspaceAccessReason = Extract<
  AccessReason,
  'unauthenticated' | 'workspace-not-found' | 'no-workspace-access'
>;

/* allowGuest typed so the granted user follows the caller's guest policy. */
type GuestUser<TAllowGuest extends boolean> = TAllowGuest extends true
  ? User | undefined
  : User;

export type WorkspaceAccessResult<TAllowGuest extends boolean = false> =
  | {
      ok: true;
      user: GuestUser<TAllowGuest>;
      workspace: Workspace;
      tenant: Tenant;
      url: ServerWorkspaceURLs;
    }
  | {
      ok: false;
      user: User | undefined;
      reason: WorkspaceAccessReason;
    };

/**
 * Resolves whether the current visitor may reach the workspace the request is
 * addressed to, with no sub-app in the question.
 *
 * For what belongs to a workspace rather than to one of its applications — the
 * account screens, the workspace layout, a workspace asset route. Wherever a
 * sub-app code exists, `ensureAccess` is the gate to use instead: it answers
 * this question and the app's as one.
 *
 * The workspace and the tenant come from the request rather than the caller, so
 * a caller can only ever act where the visitor is looking.
 *
 * The granted case costs one scoped query. A denial pays a second to say
 * whether the workspace is missing or merely closed to this visitor, which is
 * what keeps anyone from being sent to a login screen for an address that names
 * nothing.
 */
export async function ensureWorkspaceAccess<
  TAllowGuest extends boolean = false,
>({
  allowGuest = false as TAllowGuest,
}: {allowGuest?: TAllowGuest} = {}): Promise<
  WorkspaceAccessResult<TAllowGuest>
> {
  const user = (await getSession())?.user;

  const scope = await currentWorkspace();

  /* An address that names no workspace is answered like one naming a workspace
   * that does not exist, so a request shaped that way — a tenant's landing
   * address, a probe carrying an escaped separator — is denied rather than
   * raising. */
  if (!scope) {
    return {ok: false, user, reason: 'workspace-not-found'};
  }

  const tenant = await manager.getTenant(scope.tenantId);

  if (!tenant) {
    return {ok: false, user, reason: 'workspace-not-found'};
  }
  const {client} = tenant;

  const url = scope.key();
  const workspace = await findWorkspace({url, user, client});

  /* Fast path: the workspace resolved for this visitor, and either a user is
     present or this caller permits guests. */
  if (workspace && (user || allowGuest)) {
    return {
      ok: true,
      user: user as GuestUser<TAllowGuest>,
      workspace,
      tenant,
      url: scope,
    };
  }

  /* Resolved, but this caller requires a user and none is present. */
  if (workspace) {
    return {ok: false, user, reason: 'unauthenticated'};
  }

  /* The scoped query came back empty, which is two different answers. Confirm
   * the workspace exists before returning any login-eligible reason, so nobody
   * is sent to login for an address that names nothing. */
  const workspaceExists = Boolean(
    await client.aOSPortalWorkspace.findOne({
      where: {url: {like: url}},
      select: {id: true},
    }),
  );
  if (!workspaceExists) {
    return {ok: false, user, reason: 'workspace-not-found'};
  }

  /* The workspace is real and did not resolve. For a signed-in visitor that is
   * a closed door; for an anonymous one it is an unanswered question, and the
   * workspace has been confirmed to exist, so login is the useful answer.
   *
   * `ensureAccess` answers this same case with 'no-workspace-access' whoever is
   * asking, which is why its callers test `access.user` rather than the reason.
   * Aligning the two means changing that line there and this one together. */
  return {
    ok: false,
    user,
    reason: user ? 'no-workspace-access' : 'unauthenticated',
  };
}
