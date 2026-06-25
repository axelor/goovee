import 'server-only';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {manager, type Tenant} from '@/tenant';
import {
  resolveWorkspaceApp,
  type Subapp,
  type WorkspaceLight,
} from '@/orm/workspace';
import type {User} from '@/types';
import type {Client} from '@/goovee/.generated/client';

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
      workspace: WorkspaceLight;
      tenant: Tenant;
      client: Client;
    }
  | {
      ok: false;
      user: User | undefined;
      reason: AccessReason;
    };

/**
 * Resolves whether the current visitor may reach `code` in this workspace.
 * The positive case is a single scoped query; on denial it runs a couple of
 * extra probes to report a precise reason. With `allowGuest` false (default) a
 * guest is never authorized — but is only sent to login when the workspace AND
 * the app actually exist, so a guest is never bounced to login for something
 * that does not exist (the caller turns those reasons into a 404 instead).
 */
export async function ensureAuth<TAllowGuest extends boolean = false>({
  code,
  url,
  tenantId,
  allowGuest = false as TAllowGuest,
}: {
  code: string;
  url: string;
  tenantId: Tenant['id'];
  allowGuest?: TAllowGuest;
}): Promise<AccessResult<TAllowGuest>> {
  const tenant = await manager.getTenant(tenantId);
  const user = (await getSession())?.user;

  if (!tenant) {
    return {ok: false, user, reason: 'workspace-not-found'};
  }
  const {client} = tenant;

  const {workspace, subapp} = await resolveWorkspaceApp({
    code,
    url,
    user,
    client,
  });

  /* Fast path: the app is accessible and either a user is present or this page
     permits guests. */
  if (workspace && subapp && (user || allowGuest)) {
    return {
      ok: true,
      user: user as GuestUser<TAllowGuest>,
      subapp,
      workspace,
      tenant,
      client,
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
