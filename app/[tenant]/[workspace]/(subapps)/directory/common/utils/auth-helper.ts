import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {manager, type Tenant} from '@/tenant';
import {User} from '@/types';
import {Subapp, PortalWorkspace} from '@/orm/workspace';
import {Maybe} from '@/types/util';
import {cache} from 'react';

export type PortalWorkspaceWithConfig = Omit<PortalWorkspace, 'config'> &
  Required<Pick<PortalWorkspace, 'config'>>;

export type AuthProps = {
  user: User | undefined;
  subapp: Subapp;
  workspace: PortalWorkspaceWithConfig;
  workspaceURL: string;
  tenant: Tenant;
};

export const ensureAuth = cache(async function ensureAuth(
  workspaceURL: Maybe<string>,
  tenantId: Tenant['id'],
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
      auth: AuthProps;
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

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return {
      error: true,
      message: await t('Invalid tenant'),
    };
  }
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.directory,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {
      error: true,
      forceLogin: !user,
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
      user,
      subapp,
      workspace: workspace as PortalWorkspaceWithConfig,
      workspaceURL,
      tenant,
    },
  };
});
