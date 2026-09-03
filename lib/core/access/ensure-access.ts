import 'server-only';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {manager, type Tenant} from '@/tenant';
import {currentWorkspace} from '@/lib/core/url/current';
import type {ServerWorkspaceURLs} from '@/lib/core/url/scope';
import {findWorkspace, type Subapp, type Workspace} from '@/orm/workspace';
import type {User} from '@/types';

/**
 * Why access was denied, in navigation-neutral terms. The caller maps each to
 * its medium — a page to redirect / unauthorized / notFound, a route to
 * 401 / 403 / 404.
 */
export type AccessReason =
  | 'unauthenticated'
  | 'workspace-not-found'
  | 'no-workspace-access'
  | 'app-not-installed'
  | 'no-app-access';

/* allowGuest typed so the granted user follows the caller's guest policy. */
type GuestUser<TAllowGuest extends boolean> = TAllowGuest extends true
  ? User | undefined
  : User;

type Granted<TAllowGuest extends boolean> = {
  ok: true;
  user: GuestUser<TAllowGuest>;
  workspace: Workspace;
  tenant: Tenant;
  /**
   * The addresses of the workspace just authorized — the same object
   * `tenantURLs(id).workspace(slug)` returns, reached without naming the
   * workspace a second time.
   */
  url: ServerWorkspaceURLs;
};

type Denied = {
  ok: false;
  user: User | undefined;
  reason: AccessReason;
};

/** The result of a gate that named a sub-app, which the grant carries. */
export type AccessResult<TAllowGuest extends boolean = false> =
  | (Granted<TAllowGuest> & {subapp: Subapp})
  | Denied;

/** The result of a gate that named no sub-app. */
export type WorkspaceAccessResult<TAllowGuest extends boolean = false> =
  | Granted<TAllowGuest>
  | Denied;

/**
 * Resolves whether the current visitor may reach `code` in the workspace the
 * request is addressed to, or the workspace itself when no `code` is named.
 *
 * Name a `code` for anything belonging to one of a workspace's applications.
 * Omit it for what belongs to the workspace rather than to an application —
 * the account screens, the workspace layout, a workspace asset route — and the
 * result carries no `subapp`, because none was asked about.
 *
 * The workspace and the tenant are read from the request, not given: a caller
 * names only what it is gating. That is what stops a client naming a workspace
 * it is not on — it can only ever act where it is looking.
 *
 * The granted case costs one scoped query, with the sub-app read from the rows
 * it already returned. A denial pays up to two more to report a precise reason,
 * and reports one a visitor can act on only for what it has confirmed exists,
 * so nobody is sent to sign in for something that does not exist.
 */
export async function ensureAccess<TAllowGuest extends boolean = false>(args: {
  code: string;
  allowGuest?: TAllowGuest;
}): Promise<AccessResult<TAllowGuest>>;
export async function ensureAccess<TAllowGuest extends boolean = false>(args?: {
  allowGuest?: TAllowGuest;
}): Promise<WorkspaceAccessResult<TAllowGuest>>;
export async function ensureAccess({
  code,
  allowGuest = false,
}: {code?: string; allowGuest?: boolean} = {}): Promise<
  AccessResult<boolean> | WorkspaceAccessResult<boolean>
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

  const {tenantId} = scope;
  const url = scope.key();

  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return {ok: false, user, reason: 'workspace-not-found'};
  }
  const {client} = tenant;

  const workspace = await findWorkspace({url, user, client});

  /* Not `Boolean(code)`: an empty code names a sub-app that cannot match, and
   * the overload accepting one has already promised the caller a `subapp`. */
  const named = code !== undefined;

  /* Read from the rows the query above already returned, so naming a sub-app
   * costs no second round trip. */
  const subapp = named
    ? (workspace?.apps.find(app => app.code === code) ?? null)
    : null;

  /* Fast path: what was asked about is reachable, and either a user is present
     or this caller permits guests. */
  if (workspace && (subapp || !named) && (user || allowGuest)) {
    const granted = {
      ok: true as const,
      user,
      workspace,
      tenant,
      url: scope,
    };

    return subapp ? {...granted, subapp} : granted;
  }

  /* Reachable, but this caller requires a user and none is present: what was
     asked about exists, so it is a sign-in, not a 404. */
  if (workspace && (subapp || !named)) {
    return {ok: false, user, reason: 'unauthenticated'};
  }

  /* Denial: the scoped query came back empty, or it resolved a workspace whose
   * application list does not hold the code. Confirm what was asked about
   * exists before returning any reason a visitor can act on, so nobody is sent
   * to sign in for something that does not exist. */
  const workspaceExists =
    workspace != null ||
    Boolean(
      await client.aOSPortalWorkspace.findOne({
        where: {url},
        select: {id: true},
      }),
    );
  if (!workspaceExists) {
    return {ok: false, user, reason: 'workspace-not-found'};
  }

  if (named) {
    const appInstalled = Boolean(
      await client.aOSPortalApp.findOne({
        where: {code, isInstalled: true},
        select: {id: true},
      }),
    );
    if (!appInstalled) {
      return {ok: false, user, reason: 'app-not-installed'};
    }
  }

  /* Everything asked about exists and the request still did not resolve.
   * Without a session that is an unanswered question rather than a closed door:
   * an anonymous visitor is matched against the workspace's guest
   * configuration, which carries its own application list and may be absent
   * altogether, so signing in can change either answer. `allowGuest` is not
   * consulted — it says what this caller tolerates, not what the workspace
   * admits. */
  if (!user) {
    return {ok: false, user, reason: 'unauthenticated'};
  }

  return {
    ok: false,
    user,
    reason: workspace ? 'no-app-access' : 'no-workspace-access',
  };
}
