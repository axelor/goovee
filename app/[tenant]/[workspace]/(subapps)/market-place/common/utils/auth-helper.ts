import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {manager, type Tenant} from '@/tenant';
import type {User} from '@/types';
import type {PortalWorkspace, Subapp} from '@/orm/workspace';
import {Maybe} from '@/types/util';

export type PortalWorkspaceWithConfig = Omit<PortalWorkspace, 'config'> &
  Required<Pick<PortalWorkspace, 'config'>>;

export type AuthProps<TAllowGuest extends boolean = false> = {
  user: TAllowGuest extends true ? User | undefined : User;
  subapp: Subapp;
  workspace: PortalWorkspaceWithConfig;
  workspaceURL: string;
  tenant: Tenant;
};

type EnsureAuthConfig<T extends boolean = false> = {
  /** When true, unauthenticated users are allowed through and auth.user may be undefined. */
  allowGuest?: T;
};

export async function ensureAuth<T extends boolean = false>(
  workspaceURL: Maybe<string>,
  tenantId: Tenant['id'],
  {allowGuest = false as T}: EnsureAuthConfig<T> = {},
): Promise<
  | {
      error: true;
      message: string;
      forceLogin?: boolean;
      auth?: never;
    }
  | {
      error: false;
      message?: never;
      forceLogin?: never;
      auth: AuthProps<T>;
    }
> {
  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Workspace not provided.'),
    };
  }

  const session = await getSession();
  const user = session?.user;

  if (!user && !allowGuest) {
    return {
      error: true,
      forceLogin: true,
      message: await t('Unauthorized'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return {
      error: true,
      message: await t('Invalid tenant'),
    };
  }
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.marketplace,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace?.config) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  return {
    error: false,
    auth: {
      user: user as AuthProps<T>['user'],
      subapp,
      workspace: workspace as PortalWorkspaceWithConfig,
      workspaceURL,
      tenant,
    },
  };
}
