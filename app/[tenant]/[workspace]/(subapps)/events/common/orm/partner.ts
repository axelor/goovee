// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {and} from '@/utils/orm';
import type {AOSPartner} from '@/goovee/.generated/models';
import {getPartnerId} from '@/utils';
import type {Client} from '@/goovee/.generated/client';
import type {ExpandRecursively} from '@/types/util';

export async function findContacts({
  search = '',
  workspaceURL,
  client,
}: {
  search?: string;
  workspaceURL: string;
  client: Client;
}) {
  const session = await getSession();
  const user = session?.user;
  if (!user) return [];

  const partnerId = getPartnerId(user);

  const whereClause = and<AOSPartner>([
    {
      isContact: true,
      isActivatedOnPortal: true,
      mainPartner: {id: partnerId},
      contactWorkspaceConfigSet: {portalWorkspace: {url: workspaceURL}},
    },
    search && {simpleFullName: {like: `%${search.toLowerCase()}%`}},
    {OR: [{archived: false}, {archived: null}]},
  ]);

  return client.aOSPartner.find({
    where: whereClause,
    select: {
      id: true,
      name: true,
      firstName: true,
      simpleFullName: true,
      emailAddress: {address: true},
      fixedPhone: true,
      mainPartner: {id: true, simpleFullName: true},
    },
  });
}

export type Contact = ExpandRecursively<
  Awaited<ReturnType<typeof findContacts>>
>[number];
