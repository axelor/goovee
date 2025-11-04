// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {manager, type Tenant} from '@/tenant';
import {getSession} from '@/lib/core/auth';
import {and} from '@/utils/orm';
import type {AOSPartner} from '@/goovee/.generated/models';
import {getPartnerId} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {
  validate,
  withSubapp,
  withWorkspace,
} from '@/subapps/events/common/actions/validation';

export async function findContacts({
  search = '',
  workspaceURL,
  tenantId,
}: {
  search?: string;
  workspaceURL: string;
  tenantId: Tenant['id'];
}) {
  const response = await validate([
    withWorkspace(workspaceURL, tenantId, {checkAuth: false}),
    withSubapp(SUBAPP_CODES.events, workspaceURL, tenantId),
  ]);

  if (response.error) {
    return response;
  }

  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return null;
  }

  const partnerId = getPartnerId(user);

  const c = await manager.getClient(tenantId);

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

  const result = await c.aOSPartner.find({
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

  return result;
}
