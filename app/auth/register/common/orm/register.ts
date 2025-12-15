import {Tenant, manager} from '@/tenant';

export async function findInviteById({
  id,
  tenantId,
}: {
  id: string;
  tenantId: Tenant['id'];
}) {
  if (!(id && tenantId)) {
    return null;
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
    return null;
  }

  const invite = await client.aOSPortalInvitation.findOne({
    where: {
      id,
    },
    select: {
      emailAddress: {
        address: true,
      },
      partner: {
        id: true,
        localization: {code: true, isAvailableOnPortal: true, name: true},
      },
      workspace: {
        url: true,
        allowRegistrationSelect: true,
      },
      contactAppPermissionList: {
        select: {
          isAdmin: true,
          contactAppPermissionList: {
            select: {
              roleSelect: true,
              app: {
                id: true,
                code: true,
              },
            },
          },
        },
      },
    },
  });

  return invite;
}
