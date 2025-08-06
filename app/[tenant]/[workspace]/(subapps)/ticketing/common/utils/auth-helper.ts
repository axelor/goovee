import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {AuthProps, PortalWorkspaceWithConfig} from '@/orm/project-task';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {Tenant} from '@/tenant';
import {Maybe} from '@/types/util';
import {cache} from 'react';

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

  if (!user) {
    return {
      error: true,
      forceLogin: true,
      message: await t('Unauthorized'),
    };
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.ticketing,
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
