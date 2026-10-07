import {Client} from '@/goovee/.generated/client';

/* An empty token returns nothing, so an invitation without a token (sent
 * before tokens existed) can never be matched. */
export async function findInviteByToken({
  token,
  client,
}: {
  token: string;
  client: Client;
}) {
  if (!(token && client)) {
    return null;
  }

  const invite = await client.aOSPortalInvitation.findOne({
    where: {
      token,
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
