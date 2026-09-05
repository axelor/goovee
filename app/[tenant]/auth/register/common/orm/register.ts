import {Client} from '@/goovee/.generated/client';

export async function findInviteById({
  id,
  client,
}: {
  id: string;
  client: Client;
}) {
  if (!(id && client)) {
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
