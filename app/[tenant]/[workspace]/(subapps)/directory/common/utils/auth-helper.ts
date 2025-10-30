import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {Tenant} from '@/tenant';
import {PortalApp, PortalWorkspace, User} from '@/types';
import {Maybe} from '@/types/util';
import {cache} from 'react';

interface Subapp extends Omit<PortalApp, 'installed'> {
  installed: boolean;
  isContactAdmin: boolean;
  role?: 'restricted' | 'total';
}

export type PortalWorkspaceWithConfig = Omit<PortalWorkspace, 'config'> &
  Required<Pick<PortalWorkspace, 'config'>>;

export type AuthProps = {
  user: User | undefined;
  subapp: Subapp;
  workspace: PortalWorkspaceWithConfig;
  workspaceURL: string;
  tenantId: Tenant['id'];
};

export const ensureAuth = cache(async function ensureAuth(
  workspaceURL: Maybe<string>,
  tenantId: Tenant['id'],
): Promise<
  | {
      error: true;
      message: string;
      auth?: never;
    }
  | {
      error: false;
      message?: never;
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

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.directory,
    user,
    url: workspaceURL,
    tenantId,
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
    tenantId,
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
      tenantId,
    },
  };
});
