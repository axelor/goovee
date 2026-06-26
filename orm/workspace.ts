// ---- CORE IMPORTS ---- //
import {
  ALLOW_ALL_REGISTRATION,
  ALLOW_AOS_ONLY_REGISTRATION,
  ROLE,
} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {
  AOSPortalApp,
  AOSPortalWorkspace,
} from '@/goovee/.generated/models';
import {AOSPortalAppConfig} from '@/goovee/.generated/models';
import {ID, Partner, User} from '@/types';
import {clone, getPartnerId} from '@/utils';
import {Payload, SelectOptions} from '@goovee/orm';

/**
 * Reusable SELECT fragment for the AOSPortalApp columns surfaced as a
 * workspace sub-app. The ORM always returns id and version for a relation
 * select, so the resulting App / Subapp type carries those too.
 */
export const appSelectFields = {
  background: true,
  orderForMySpaceMenu: true,
  showInMySpace: true,
  code: true,
  showInTopMenu: true,
  color: true,
  icon: true,
  isInstalled: true,
  name: true,
  orderForTopMenu: true,
} as const satisfies SelectOptions<AOSPortalApp>;

/* Reusable select fragments for the config concerns shared across sub-apps.
   A per-app config select spreads the fragments it needs, so the shared
   consumer — <Payments>, isCommentEnabled, shouldHidePricesAndPurchase —
   accepts the app's narrow config rather than every config field. */
export const paymentConfigSelect = {
  allowOnlinePaymentForEcommerce: true,
  paymentOptionSet: {
    select: {
      name: true,
      typeSelect: true,
      transferTypeSelect: true,
      paymentMode: {
        id: true,
      },
    },
  },
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type PaymentConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof paymentConfigSelect}
>;

export const commentConfigSelect = {
  enableComment: true,
  enableEventComment: true,
  enableNewsComment: true,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type CommentConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof commentConfigSelect}
>;

export const priceVisibilityConfigSelect = {
  hidePriceForEmptyPricelist: true,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type PriceVisibilityConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof priceVisibilityConfigSelect}
>;

export const mainPriceConfigSelect = {
  mainPrice: true,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type MainPriceConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof mainPriceConfigSelect}
>;

export const otpTemplateConfigSelect = {
  otpTemplateList: {
    select: {
      localization: {code: true},
      template: {name: true, subject: true, content: true, language: true},
    },
  },
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type OtpTemplateConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof otpTemplateConfigSelect}
>;

export type App = {
  id: string;
  version: number;
  name: string | null;
  code: string | null;
  color: string | null;
  background: string | null;
  icon: string | null;
  isInstalled: boolean | null;
  orderForMySpaceMenu: number | null;
  orderForTopMenu: number | null;
  showInMySpace: boolean | null;
  showInTopMenu: boolean | null;
};

export type AppWithRole = App & {role: string | null};

export async function findWorkspaceMembers({
  url,
  client,
  partnerId,
}: {
  url?: string;
  client: Client;
  partnerId: Partner['id'];
}) {
  if (!(url && partnerId)) {
    return {
      partners: [],
      contacts: [],
    };
  }

  const memberPartners = await client.aOSPartner.find({
    where: {
      isContact: false,
      id: partnerId,
      isActivatedOnPortal: true,
      partnerWorkspaceSet: {
        workspace: {
          url,
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      name: true,
      fullName: true,
      picture: {id: true},
      isContact: true,
      emailAddress: {
        address: true,
      },
    },
  });

  const memberContacts = await client.aOSPartner
    .find({
      where: {
        isContact: true,
        isActivatedOnPortal: true,
        mainPartner: {
          id: partnerId,
        },
        contactWorkspaceConfigSet: {
          portalWorkspace: {
            url,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        name: true,
        fullName: true,
        picture: {id: true},
        isContact: true,
        emailAddress: {
          address: true,
        },
        contactWorkspaceConfigSet: {
          where: {portalWorkspace: {url}},
          select: {
            isAdmin: true,
            portalWorkspace: {
              url: true,
            },
            contactAppPermissionList: {
              select: {
                app: {
                  name: true,
                  code: true,
                  isInstalled: true,
                },
                roleSelect: true,
              },
            },
          },
        },
      },
    })
    .then(contacts =>
      contacts?.map(c => ({
        ...c,
        contactWorkspaceConfig: c?.contactWorkspaceConfigSet?.[0],
      })),
    );

  return {
    partners: memberPartners,
    contacts: memberContacts,
  };
}

export type ContactWorkspaceConfig = {
  apps: AppWithRole[] | undefined;
  id: string;
  version: number;
  isAdmin: boolean | null;
};

export async function findContactWorkspaceConfig({
  url,
  partnerId,
  contactId,
  client,
}: {
  url?: string;
  partnerId: Partner['id'];
  contactId: ID;
  client: Client;
}): Promise<ContactWorkspaceConfig | null> {
  if (!(url && contactId && partnerId)) return null;

  const contact = await client.aOSPartner.findOne({
    where: {
      id: contactId,
    },
    select: {
      contactWorkspaceConfigSet: {
        where: {
          portalWorkspace: {
            url,
          },
          partner: {
            id: partnerId,
          },
        },
        select: {
          isAdmin: true,
          contactAppPermissionList: {
            select: {
              roleSelect: true,
              app: {
                background: true,
                orderForMySpaceMenu: true,
                showInMySpace: true,
                code: true,
                showInTopMenu: true,
                color: true,
                icon: true,
                isInstalled: true,
                name: true,
                orderForTopMenu: true,
              },
            },
          },
        },
      },
    },
  });

  const contactWorkpace = contact?.contactWorkspaceConfigSet?.[0];
  if (!contactWorkpace) return null;

  const apps = contactWorkpace.contactAppPermissionList
    ?.filter(w => w.app)
    ?.map(w => ({
      ...w.app!,
      role: w.roleSelect,
    }));

  return {
    id: contactWorkpace.id,
    version: contactWorkpace.version,
    isAdmin: contactWorkpace.isAdmin,
    apps,
  };
}

export async function findDefaultPartnerWorkspaceConfig({
  url,
  client,
}: {
  url: string;
  client: Client;
}) {
  if (!url) return null;

  const workspace = await client.aOSPortalWorkspace.findOne({
    where: {
      url: {
        like: url,
      },
    },
    select: {
      defaultPartnerWorkspace: {
        apps: {
          select: {
            background: true,
            orderForMySpaceMenu: true,
            showInMySpace: true,
            code: true,
            showInTopMenu: true,
            color: true,
            icon: true,
            isInstalled: true,
            name: true,
            orderForTopMenu: true,
          },
        },
        portalAppConfig: otpTemplateConfigSelect,
      },
    },
  });

  return workspace?.defaultPartnerWorkspace;
}

export async function findDefaultPartnerWorkspace({
  partnerId,
  client,
}: {
  partnerId?: ID;
  client: Client;
}) {
  if (!partnerId) return null;

  const res = await client.aOSPartner.findOne({
    where: {
      id: partnerId,
    },
    select: {
      defaultWorkspace: {
        workspace: {
          url: true,
        },
      },
    },
  });

  return res?.defaultWorkspace;
}

export async function findWorkspace({
  url = '',
  user,
  client,
}: {
  url?: string;
  user?: WorkspaceUser;
  client: Client;
}): Promise<Workspace | null> {
  if (!url) return null;

  /* One scoped query per user type resolves the workspace and the user's
     accessible apps (each carrying its role for contacts). The heavy config is
     fetched on demand by callers via their per-app config getter (e.g.
     getShopConfig); a sub-app check is just apps.find(code) on the result. */
  if (!user) {
    return findGuestWorkspace({url, client});
  }

  if (!user.isContact) {
    return findPartnerWorkspace({
      url,
      partnerId: getPartnerId(user),
      client,
    });
  }

  if (!user.mainPartnerId) return null;

  return findContactWorkspace({
    url,
    contactId: user.id,
    partnerId: user.mainPartnerId,
    client,
  });
}

export async function findOpenWorkspaces({
  url,
  client,
}: {
  url?: string;
  client: Client;
}) {
  const workspaces = await client.aOSPortalWorkspace
    .find({
      where: {
        url: {
          like: `${url}%`,
        },
      },
      select: {
        name: true,
        url: true,
        allowRegistrationSelect: true,
        defaultGuestWorkspace: {
          apps: {
            select: {
              background: true,
              orderForMySpaceMenu: true,
              showInMySpace: true,
              code: true,
              showInTopMenu: true,
              color: true,
              icon: true,
              isInstalled: true,
              name: true,
              orderForTopMenu: true,
            },
          },
        },
      },
      orderBy: {updatedOn: 'DESC'},
    })
    .then(workspaces => {
      return (workspaces || [])?.filter(
        workspace => workspace?.defaultGuestWorkspace?.apps?.length,
      );
    });

  return workspaces;
}

export async function findPartnerWorkspaces({
  url,
  partnerId,
  client,
}: {
  url?: string;
  partnerId: ID;
  client: Client;
}) {
  if (!partnerId) return [];

  const res = await client.aOSPartner
    .findOne({
      where: {
        id: partnerId,
      },
      select: {
        partnerWorkspaceSet: {
          where: {
            ...(url
              ? {
                  workspace: {
                    url: {
                      like: `${url}%`,
                    },
                  },
                }
              : {}),
          },
          select: {
            workspace: {
              id: true,
              name: true,
              url: true,
              allowRegistrationSelect: true,
            },
          },
        },
      },
    })
    .then(clone);

  if (!res?.partnerWorkspaceSet?.length) {
    return [];
  }

  return res?.partnerWorkspaceSet
    .map(item => item.workspace)
    .filter((x): x is NonNullable<typeof x> => x != null);
}

export async function findContactWorkspaces({
  url,
  partnerId,
  contactId,
  client,
}: {
  url?: string;
  partnerId: ID;
  contactId: ID;
  client: Client;
}) {
  if (!(partnerId && contactId)) return [];

  const partnerWorkspaces = await findPartnerWorkspaces({
    url,
    partnerId,
    client,
  });

  if (!partnerWorkspaces?.length) return [];

  const res = await client.aOSPartner
    .findOne({
      where: {
        id: contactId,
      },
      select: {
        contactWorkspaceConfigSet: {
          where: {
            ...(url
              ? {
                  portalWorkspace: {
                    url: {
                      like: `${url}%`,
                    },
                  },
                }
              : {}),
            partner: {
              id: partnerId,
            },
          },
          select: {
            portalWorkspace: {
              id: true,
              name: true,
              url: true,
              allowRegistrationSelect: true,
            },
          },
        },
      },
    })
    .then(clone);

  if (!res?.contactWorkspaceConfigSet?.length) {
    return [];
  }

  const partnerWorkspaceAccess = <T extends Record<string, unknown> | null>(
    workspace: T,
  ) => {
    return partnerWorkspaces?.some(w => w?.id === workspace?.id);
  };

  return res?.contactWorkspaceConfigSet
    .map(item => item.portalWorkspace)
    .filter(partnerWorkspaceAccess)
    .filter((x): x is NonNullable<typeof x> => x != null);
}

export async function findWorkspaceByURL({
  url,
  client,
}: {
  url: string;
  client: Client;
}) {
  if (!url) return null;

  return client.aOSPortalWorkspace.findOne({
    where: {
      url,
    },
    select: {
      name: true,
      navigationSelect: true,
      url: true,
      defaultGuestWorkspace: {id: true, name: true},
      defaultTheme: {css: true, name: true},
      defaultPartnerWorkspace: {id: true, name: true},
      allowRegistrationSelect: true,
    },
  });
}

export type WorkspaceForRegistration = Awaited<
  ReturnType<typeof findWorkspaceForRegistration>
>;
export async function findWorkspaceForRegistration({
  url,
  client,
}: {
  url: Workspace['url'];
  client: Client;
}) {
  if (!url) {
    return null;
  }

  try {
    const workspace = await client.aOSPortalWorkspace
      .findOne({
        where: {
          url: {
            like: `${url}%`,
          },
          AND: [
            {
              OR: [
                {
                  allowRegistrationSelect: ALLOW_ALL_REGISTRATION,
                },
                {
                  allowRegistrationSelect: ALLOW_AOS_ONLY_REGISTRATION,
                },
              ],
            },
          ],
        },
        select: {
          name: true,
          url: true,
          allowRegistrationSelect: true,
          defaultGuestWorkspace: {
            apps: {
              select: {
                background: true,
                orderForMySpaceMenu: true,
                showInMySpace: true,
                code: true,
                showInTopMenu: true,
                color: true,
                icon: true,
                isInstalled: true,
                name: true,
                orderForTopMenu: true,
              },
            },
            portalAppConfig: {
              termsOfUseAcceptanceText: true,
            },
          },
        },
      })
      .then(clone);

    if (!workspace) return null;

    return {
      ...workspace,
      config: workspace.defaultGuestWorkspace?.portalAppConfig,
    };
  } catch (err) {}

  return null;
}

export async function canRegisterForWorkspace({
  url,
  client,
}: {
  url: Workspace['url'];
  client: Client;
}): Promise<boolean> {
  if (!url) {
    return false;
  }

  return findWorkspaceForRegistration({url, client}).then(workspace =>
    Boolean(workspace?.id),
  );
}

export async function findWorkspaces({
  url,
  user,
  client,
}: {
  url?: string;
  user?: User;
  client: Client;
}) {
  if (!url) return [];

  if (!user) {
    return findOpenWorkspaces({url, client});
  }

  if (!user.isContact) {
    return findPartnerWorkspaces({
      url,
      partnerId: user.id,
      client,
    });
  }

  if (user.isContact) {
    return findContactWorkspaces({
      url,
      contactId: user.id,
      partnerId: user.mainPartnerId!,
      client,
    });
  }

  return [];
}

export type Subapp = {
  id: string;
  version: number;
  name: string | null;
  code: string | null;
  color: string | null;
  background: string | null;
  icon: string | null;
  isInstalled: boolean | null;
  orderForMySpaceMenu: number | null;
  orderForTopMenu: number | null;
  showInMySpace: boolean | null;
  showInTopMenu: boolean | null;
  role?: 'restricted' | 'total';
  isContactAdmin?: boolean;
};

export async function findWorkspaceApps({
  url,
  user,
  client,
}: {
  url?: string;
  user?: User;
  client: Client;
}): Promise<Subapp[]> {
  /* findWorkspace already resolves the user's accessible apps per type —
     contact permissions and admin included — so no further filtering here. */
  const workspace = await findWorkspace({url, user, client});
  return workspace?.apps ?? [];
}

export async function findSubapps({
  url,
  user,
  client,
}: {
  url: string;
  user?: User;
  client: Client;
}): Promise<Subapp[]> {
  const apps = await findWorkspaceApps({
    url,
    user,
    client,
  }).then(clone);

  return apps;
}

/* User identity needed to resolve a workspace and its accessible apps. */
type WorkspaceUser = Pick<User, 'id' | 'isContact' | 'mainPartnerId'>;

/* Narrows the raw roleSelect string to the Subapp role union. */
const normalizeRole = (roleSelect?: string | null): Subapp['role'] =>
  roleSelect === ROLE.TOTAL ? 'total' : 'restricted';

export async function findSubappAccess({
  code,
  user,
  url,
  client,
}: {
  code: string;
  user?: WorkspaceUser;
  url: string;
  client: Client;
}): Promise<Subapp | null> {
  const workspace = await findWorkspace({url, user, client});
  return workspace?.apps.find(app => app.code === code) ?? null;
}

/* ----------------------------------------------------------------------- *
 * Workspace resolution (single query, no heavy config)
 *
 * findWorkspace answers, in ONE scoped query per user type, "what is this
 * workspace and which of its apps can this user reach?". It returns the
 * workspace WITHOUT its heavy config payload — only config ({id}) — plus the
 * user's accessible apps (each carrying its role for contacts). Pages that
 * render config-driven UI fetch the config on demand via their per-app config
 * getter; a sub-app reachability check is just apps.find(code) on the result.
 * ----------------------------------------------------------------------- */

/* AOSPortalWorkspace identity columns surfaced in Workspace, read either
   at the query root (guest) or through the workspace relation (partner /
   contact). */
const workspaceFields = {
  name: true,
  url: true,
  defaultTheme: {name: true, css: true},
  navigationSelect: true,
  user: {id: true},
  workspaceLogo: {id: true},
} as const satisfies SelectOptions<AOSPortalWorkspace>;

type WorkspaceRow = Payload<
  AOSPortalWorkspace,
  {select: typeof workspaceFields}
>;

/* Assembles the light workspace shape: workspace identity, the user's
   accessible apps, a config reference ({id} only — the heavy payload is
   fetched on demand), and the permission config id. Workspace is derived
   from this assembler so the returned shape and its type stay in lock-step. */
const toWorkspace = (
  ws: WorkspaceRow,
  apps: Subapp[],
  config: {id: string},
  permissionConfigId: string,
) => ({
  id: ws.id,
  name: ws.name,
  version: ws.version,
  workspaceUser: ws.user,
  theme: ws.defaultTheme,
  url: ws.url ?? '',
  logo: ws.workspaceLogo,
  navigationSelect: ws.navigationSelect || 'leftSide',
  apps,
  config,
  workspacePermissionConfig: {id: permissionConfigId},
});

export type Workspace = ReturnType<typeof toWorkspace>;

/* Installed apps of the workspace — the accessible set for guests/partners. */
const installedApps = (apps: Subapp[] | null | undefined): Subapp[] =>
  (apps ?? []).filter(app => app.isInstalled);

/* Resolves a workspace for a visitor with no identity (a guest, or a holder of
   a capability token) from its default guest configuration. Returns the light
   workspace — its installed apps and a config reference — or null when the
   workspace, its guest workspace, or that guest's config is absent. */
export async function findGuestWorkspace({
  url,
  client,
}: {
  url: string;
  client: Client;
}): Promise<Workspace | null> {
  const workspace = await client.aOSPortalWorkspace.findOne({
    where: {url: {like: url}},
    select: {
      ...workspaceFields,
      defaultGuestWorkspace: {
        portalAppConfig: {id: true},
        apps: {select: appSelectFields},
      },
    },
  });

  const guest = workspace?.defaultGuestWorkspace;
  if (!workspace || !guest) return null;

  const configRef = guest.portalAppConfig;
  if (!configRef) return null;

  const apps = installedApps(guest.apps as Subapp[]);
  return toWorkspace(workspace, apps, configRef, guest.id);
}

async function findPartnerWorkspace({
  url,
  partnerId,
  client,
}: {
  url: string;
  partnerId: ID;
  client: Client;
}): Promise<Workspace | null> {
  const partner = await client.aOSPartner.findOne({
    where: {id: partnerId},
    select: {
      partnerWorkspaceSet: {
        where: {workspace: {url}},
        select: {
          portalAppConfig: {id: true},
          apps: {select: appSelectFields},
          workspace: workspaceFields,
        },
      },
    },
  });

  const partnerWorkspace = partner?.partnerWorkspaceSet?.[0];
  if (!partnerWorkspace?.workspace) return null;

  const configRef = partnerWorkspace.portalAppConfig;
  if (!configRef) return null;

  const apps = installedApps(partnerWorkspace.apps as Subapp[]);
  return toWorkspace(
    partnerWorkspace.workspace,
    apps,
    configRef,
    partnerWorkspace.id,
  );
}

async function findContactWorkspace({
  url,
  contactId,
  partnerId,
  client,
}: {
  url: string;
  contactId: ID;
  partnerId: ID;
  client: Client;
}): Promise<Workspace | null> {
  const contact = await client.aOSPartner.findOne({
    where: {id: contactId},
    select: {
      mainPartner: {
        partnerWorkspaceSet: {
          where: {workspace: {url}},
          select: {
            portalAppConfig: {id: true},
            apps: {select: appSelectFields},
            workspace: workspaceFields,
          },
        },
      },
      contactWorkspaceConfigSet: {
        where: {portalWorkspace: {url}, partner: {id: partnerId}},
        select: {
          isAdmin: true,
          contactAppPermissionList: {
            select: {roleSelect: true, app: {code: true}},
          },
        },
      },
    },
  });

  const partnerWorkspace = contact?.mainPartner?.partnerWorkspaceSet?.[0];
  if (!partnerWorkspace?.workspace) return null;

  const partnerApps = installedApps(partnerWorkspace.apps as Subapp[]);
  const config = contact?.contactWorkspaceConfigSet?.[0];

  /* Admins see every installed app of the workspace; everyone else sees only
     the apps they have a permission row for, carrying that row's role. */
  let apps: Subapp[];
  if (config?.isAdmin) {
    apps = partnerApps.map(app => ({...app, isContactAdmin: true}));
  } else {
    const permissions = config?.contactAppPermissionList ?? [];
    apps = partnerApps
      .filter(app => permissions.some(item => item.app?.code === app.code))
      .map(app => ({
        ...app,
        role: normalizeRole(
          permissions.find(item => item.app?.code === app.code)?.roleSelect,
        ),
      }));
  }

  const configRef = partnerWorkspace.portalAppConfig;
  if (!configRef) return null;

  return toWorkspace(
    partnerWorkspace.workspace,
    apps,
    configRef,
    partnerWorkspace.id,
  );
}
