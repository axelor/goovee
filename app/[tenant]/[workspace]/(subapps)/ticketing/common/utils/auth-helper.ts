import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {findWorkspace} from '@/orm/workspace';
import {classifySubappAccess} from '@/lib/core/workspace/subapp-access';
import {manager, type Tenant} from '@/tenant';
import type {User} from '@/types';
import type {PortalWorkspace, Subapp} from '@/orm/workspace';
import {Maybe} from '@/types/util';
import {cache} from 'react';

export type PortalWorkspaceWithConfig = Omit<PortalWorkspace, 'config'> &
  Required<Pick<PortalWorkspace, 'config'>>;

export type AuthProps = {
  user: User;
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
      unauthorized?: boolean;
      auth?: never;
    }
  | {
      error: false;
      message?: never;
      forceLogin?: never;
      unauthorized?: never;
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

  if (!user) {
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

  const access = await classifySubappAccess({
    code: SUBAPP_CODES.ticketing,
    user,
    url: workspaceURL,
    client,
  });

  if (!access.ok) {
    if (access.reason === 'unauthorized') {
      return {
        error: true,
        unauthorized: true,
        message: await t('Unauthorized'),
      };
    }
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const subapp = access.subapp;

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
