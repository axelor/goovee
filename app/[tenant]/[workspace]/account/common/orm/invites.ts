// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {Cloned} from '@/types/util';
import {findEmailAddress, isAdminContact, isPartner} from '@/orm/partner';
import {clone} from '@/utils';
import type {Partner} from '@/types';
import type {Workspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {InviteAppsConfig, Role} from '../types';

export async function findInviteById({
  id,
  client,
}: {
  id: string;
  client: Client;
}) {
  if (!id) {
    return null;
  }

  const invite = await client.aOSPortalInvitation
    .findOne({
      where: {
        id,
      },
      select: {
        partner: {
          id: true,
        },
        contactAppPermissionList: {
          select: {
            isAdmin: true,
            contactAppPermissionList: {
              select: {
                app: {
                  background: true,
                  code: true,
                  name: true,
                  color: true,
                  icon: true,
                  isInstalled: true,
                  orderForMySpaceMenu: true,
                  orderForTopMenu: true,
                  showInMySpace: true,
                  showInTopMenu: true,
                },
                roleSelect: true,
              },
            },
          },
        },
      },
    })
    .then(clone);

  return invite;
}

export async function deleteInviteById({
  id,
  client,
}: {
  id: string;
  client: Client;
}) {
  if (!id) {
    return null;
  }

  const invite = await findInviteById({id, client});
  const contactConfig = invite?.contactAppPermissionList?.[0];

  if (!invite) {
    return null;
  }

  try {
    const updatedInvite = await client.aOSPortalInvitation.update({
      data: {
        id,
        version: invite?.version,
        ...(contactConfig
          ? {
              contactAppPermissionList: {
                remove: [contactConfig.id],
              },
            }
          : {}),
      },
      select: {id: true},
    });

    const result = await client.aOSPortalInvitation.delete({
      id,
      version: updatedInvite.version,
    });

    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function findInvites({
  workspaceURL,
  client,
  partnerId,
}: {
  workspaceURL: Workspace['url'];
  client: Client;
  partnerId: Partner['id'];
}) {
  if (!partnerId) {
    return [];
  }

  if (!client) {
    return [];
  }

  const admin = await isPartner();

  let adminContact;

  if (!admin) {
    adminContact = await isAdminContact({client, workspaceURL});
    if (!adminContact) return [];
  }

  const invites = await client.aOSPortalInvitation
    .find({
      where: {
        workspace: {
          url: workspaceURL,
        },
        partner: {
          id: partnerId,
        },
      },
      select: {
        emailAddress: {
          address: true,
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
    })
    .then(clone);

  return invites;
}

export async function findInviteForEmail({
  email,
  client,
  partnerId,
  workspaceURL,
}: {
  email: string;
  workspaceURL: Workspace['url'];
  client: Client;
  partnerId: Partner['id'];
}) {
  if (false) {
    return null;
  }

  if (!client) {
    return null;
  }

  const invite = await client.aOSPortalInvitation.findOne({
    where: {
      emailAddress: {
        address: email,
      },
      workspace: {
        url: workspaceURL,
      },
      partner: {
        id: partnerId,
      },
    },
    select: {id: true},
  });

  return invite;
}

export async function createInvite({
  workspace,
  client,
  role = Role.user,
  email,
  apps,
  partnerId,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  role: Role;
  email: string;
  apps: InviteAppsConfig;
  partnerId: Partner['id'];
}) {
  if (!(workspace?.id && role && email && apps && partnerId)) {
    return null;
  }

  if (!client) {
    return null;
  }

  let contactConfig;

  try {
    contactConfig = await client.aOSPortalContactWorkspaceConfig.create({
      data: {
        name: `${email}-${workspace.name || workspace.url}-partner-${partnerId}-config`,
        partner: {
          select: {
            id: partnerId,
          },
        },
        portalWorkspace: {
          select: {
            id: workspace.id,
          },
        },
        isAdmin: role === Role.admin,
        contactAppPermissionList: {
          create: Object.entries(apps)
            .filter(([key, config]) => config.id && config.access === 'yes')
            .map(([key, config]) => ({
              app: {
                select: {id: config.id},
              },
              roleSelect: config.authorization,
            })),
        },
      },
      select: {id: true},
    });
  } catch (err) {
    console.error(err);
    return null;
  }

  const emailAddress = await findEmailAddress(email, client);

  try {
    const contactInvite = await client.aOSPortalInvitation
      .create({
        data: {
          emailAddress: {
            ...(emailAddress
              ? {
                  select: {
                    id: emailAddress.id,
                  },
                }
              : {
                  create: {
                    address: email,
                    name: email,
                  },
                }),
          },
          workspace: {
            select: {
              id: workspace.id,
            },
          },
          partner: {
            select: {
              id: partnerId,
            },
          },
          contactAppPermissionList: {
            select: [
              {
                id: contactConfig.id,
              },
            ],
          },
        },
        select: {id: true},
      })
      .then(clone);

    return contactInvite;
  } catch (err) {
    console.error(err);
  }
}
