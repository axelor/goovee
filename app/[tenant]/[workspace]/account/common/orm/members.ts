// ---- CORE IMPORTS ---- //
import {SUBAPP_WITH_ROLES} from '@/constants';
import {getSession} from '@/lib/core/auth';
import {isAdminContact, isPartner} from '@/orm/partner';
import {findSubapps, findWorkspaceMembers} from '@/orm/workspace';
import type {Client} from '@/goovee/.generated/client';
import type {Partner} from '@/types';
import type {WorkspaceLight} from '@/orm/workspace';
import {clone} from '@/utils';

export async function findAvailableSubapps({
  url,
  client,
}: {
  url: WorkspaceLight['url'];
  client: Client;
}) {
  if (!url) {
    return [];
  }

  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return [];
  }

  const apps = findSubapps({
    url,
    user: {
      id: user?.isContact ? user.mainPartnerId! : user.id,
    } as any,
    client,
  })
    .then(clone)
    .then(apps =>
      apps
        .filter((a: any) => a.id)
        .map(({id, name, code}: any) => ({
          id,
          name,
          code,
          authorization: SUBAPP_WITH_ROLES.includes(code),
        })),
    );

  return apps;
}

export async function findMembers({
  workspaceURL,
  client,
  partnerId,
}: {
  workspaceURL: WorkspaceLight['url'];
  client: Client;
  partnerId: Partner['id'];
}) {
  if (!partnerId) {
    return [];
  }

  const admin = await isPartner();

  let adminContact;
  if (!admin) {
    adminContact = await isAdminContact({client, workspaceURL});
    if (!adminContact) return [];
  }

  const workspaceMembers = await findWorkspaceMembers({
    url: workspaceURL,
    client,
    partnerId,
  }).then(clone);

  return workspaceMembers;
}
