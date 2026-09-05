import type {Client} from '@/goovee/.generated/client';
import {getSession} from '@/auth';
import {getPublicEnvironment} from '@/environment';
import {getTenantConfig} from '@/tenant/config';
import {findWorkspaces} from '@/orm/workspace';
import {clone} from '@/utils';
import {absoluteRoot} from '@/lib/core/url/absolute';
import {resolveAuthTenantId} from '../../../common/tenant';

/**
 * What a registration screen needs from its address: the tenant it is being
 * shown for, the workspace the visitor came from, and that workspace's stored
 * URL to look it up by.
 *
 * The tenant comes from the address the screen was reached at, never from a
 * parameter. A parameter would let a visitor holding one tenant's session open
 * another tenant's registration, where their session is read under the tenant
 * that issued it while every query runs against the other tenant's database —
 * and partner ids are per-tenant, so the same number names somebody else there.
 */
export async function extractSearchParams({
  searchParams,
}: {
  searchParams: {
    workspaceURI?: string;
  };
}) {
  const workspaceURI =
    searchParams?.workspaceURI && decodeURIComponent(searchParams.workspaceURI);

  const tenantId = await resolveAuthTenantId();

  const config = tenantId ? getTenantConfig(tenantId) : null;

  const workspaceURL = `${absoluteRoot(
    getPublicEnvironment(config).GOOVEE_PUBLIC_HOST,
  )}${workspaceURI || ''}`;

  return {
    workspaceURI,
    tenantId,
    workspaceURL,
  };
}

export async function isExistingUser({
  workspaceURL,
  client,
  user: userProp,
}: {
  workspaceURL: string;
  client: Client;
  user?: {
    id: string;
    email: string;
    isContact: boolean;
    mainPartnerId?: string;
  } & any;
}) {
  const session = await getSession();
  const user = userProp || session?.user;

  if (user) {
    const userWorkspaces = await findWorkspaces({
      url: workspaceURL,
      user,
      client,
    }).then(clone);
    const existing = userWorkspaces.some(w => w.url === workspaceURL);

    return existing;
  }
}
