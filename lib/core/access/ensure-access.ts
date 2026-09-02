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

/* allowGuest typed so the granted user follows the page's guest policy. */
type GuestUser<TAllowGuest extends boolean> = TAllowGuest extends true
  ? User | undefined
  : User;

export type AccessResult<TAllowGuest extends boolean = false> =
  | {
      ok: true;
      user: GuestUser<TAllowGuest>;
      subapp: Subapp;
      workspace: Workspace;
      tenant: Tenant;
      /**
       * The addresses of the workspace just authorized — the same object
       * `tenantURLs(id).workspace(slug)` returns, so the only difference from
       * building one directly is that holding this one is proof the access
       * check passed. That is what `url.fromClient` relies on for the second
       * half of its guarantee.
       */
      url: ServerWorkspaceURLs;
    }
  | {
      ok: false;
      user: User | undefined;
      reason: AccessReason;
    };

/**
 * Resolves whether the current visitor may reach `code` in the workspace the
 * request is addressed to.
 *
 * The workspace and the tenant are read from the request, not given: a caller
 * names only the application it is gating. That is what stops a client naming
 * a workspace it is not on — it can only ever act where it is looking.
 *
 * The positive case is a single scoped query; on denial it runs a couple of
 * extra probes to report a precise reason. With `allowGuest` false (default) a
 * guest is never authorized — but is only sent to login when the workspace AND
 * the app actually exist, so a guest is never bounced to login for something
 * that does not exist (the caller turns those reasons into a 404 instead).
 */
export async function ensureAccess<TAllowGuest extends boolean = false>({
  code,
  allowGuest = false as TAllowGuest,
}: {
  code: string;
  allowGuest?: TAllowGuest;
}): Promise<AccessResult<TAllowGuest>> {
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
  const subapp = workspace?.apps.find(app => app.code === code) ?? null;

  /* Fast path: the app is accessible and either a user is present or this page
     permits guests. */
  if (workspace && subapp && (user || allowGuest)) {
    return {
      ok: true,
      user: user as GuestUser<TAllowGuest>,
      subapp,
      workspace,
      tenant,
      url: scope,
    };
  }

  /* Accessible, but this page requires a user and none is present: the
     workspace and app exist, so it is a login, not a 404. */
  if (workspace && subapp) {
    return {ok: false, user, reason: 'unauthenticated'};
  }

  /* Denial: confirm BOTH the workspace and the app exist before returning any
     login-eligible reason, so a guest is never sent to login for something
     that does not exist. */
  const workspaceExists =
    workspace != null ||
    Boolean(
      await client.aOSPortalWorkspace.findOne({
        where: {url: {like: url}},
        select: {id: true},
      }),
    );
  if (!workspaceExists) {
    return {ok: false, user, reason: 'workspace-not-found'};
  }

  const appInstalled = Boolean(
    await client.aOSPortalApp.findOne({
      where: {code, isInstalled: true},
      select: {id: true},
    }),
  );
  if (!appInstalled) {
    return {ok: false, user, reason: 'app-not-installed'};
  }

  /* Both exist; the visitor simply has no access to them. */
  return {
    ok: false,
    user,
    reason: workspace ? 'no-app-access' : 'no-workspace-access',
  };
}
