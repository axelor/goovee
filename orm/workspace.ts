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
import {and} from '@/utils/orm';
import {Payload, SelectOptions, WhereOptions} from '@goovee/orm';

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
  user?: Pick<User, 'id' | 'isContact' | 'mainPartnerId'>;
  client: Client;
}): Promise<Workspace | null> {
  if (!url) return null;

  /* Workspace-level resolution (no sub-app) reuses the same scoped query as
     ensureAuth's resolveWorkspaceApp. The heavy config is fetched on demand by
     callers via their per-app config getter (e.g. getShopConfig); the sub-app
     slot of the result is unused here. */
  const {workspace} = await resolveWorkspaceApp({code: '', url, user, client});
  return workspace;
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
  const workspace = await findWorkspace({url, user, client});

  const apps = workspace?.apps;

  if (!apps) {
    return [];
  }

  if (!user || !user.isContact) {
    return apps;
  }

  const contactWorkpaceConfig = await findContactWorkspaceConfig({
    url: workspace.url,
    contactId: user.id,
    partnerId: user.mainPartnerId!,
    client,
  });

  if (contactWorkpaceConfig?.isAdmin) {
    return apps.map(app => ({...app, isContactAdmin: true}));
  }

  const contactApps = (contactWorkpaceConfig?.apps || []).filter(app =>
    apps.some(a => a.code === app.code && a.isInstalled),
  );

  return contactApps as Subapp[];
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

export async function findSubapp({
  code,
  url,
  user,
  client,
}: {
  code: string;
  url: string;
  user?: User;
  client: Client;
}): Promise<Subapp | undefined> {
  const subapps = await findSubapps({url, user, client});

  return subapps.find(app => app.code === code);
}

/* ----------------------------------------------------------------------- *
 * Sub-app access resolution
 *
 * A sub-app is shown when it is allowed in the workspace — i.e. one of the
 * workspace's apps — not merely because the app is installed. The rule is:
 *  - guest / partner   -> allowed when the app is one of the workspace's apps
 *  - contact (admin)   -> allowed when the app is one of the workspace's apps;
 *                         the per-app permission list is ignored
 *  - contact (other)   -> allowed when the app is one of the workspace's apps
 *                         AND the contact has a permission row for that code
 *
 * resolveSubappAccess returns a stable shape so callers never need a second
 * query: subapp is null when the code is not one of this workspace's apps, or,
 * for a restricted contact, when the contact has no permission row for it;
 * installed reflects whether such an app row was found (the query reads the
 * workspace's installed apps); accessible folds in the per-user rule above.
 * ----------------------------------------------------------------------- */

type SubappAccessUser = Pick<User, 'id' | 'isContact' | 'mainPartnerId'>;

export type SubappAccess = {
  subapp: Subapp | null;
  installed: boolean;
  accessible: boolean;
};

const NO_SUBAPP_ACCESS: SubappAccess = {
  subapp: null,
  installed: false,
  accessible: false,
};

/**
 * WHERE fragment matching an app by its code, optionally requiring it to be
 * installed. Used to narrow an app relation select to AT MOST the single
 * matching app.
 */
export function getInstalledAppFilter({
  code,
  installedOnly,
}: {
  code: string;
  installedOnly?: boolean;
}): WhereOptions<AOSPortalApp> {
  return installedOnly ? {code, isInstalled: true} : {code};
}

/**
 * Composes the app-relation WHERE used when reading the partner or guest
 * workspace apps for an access check. It matches by code within the
 * workspace's own apps relation — so the app must be allowed in the workspace
 * — and restricts to installed apps. A code that is not one of the workspace's
 * apps collapses to no row. Optional extra conditional clauses fold in via
 * and().
 */
export function withSubappAccess({code}: {code: string}) {
  return function (where?: WhereOptions<AOSPortalApp>) {
    const installedFilter = getInstalledAppFilter({code, installedOnly: true});
    const composed = and<AOSPortalApp>([where, installedFilter]);
    return composed ?? installedFilter;
  };
}

/* Narrows the raw roleSelect string to the Subapp role union. */
const normalizeRole = (roleSelect?: string | null): Subapp['role'] =>
  roleSelect === ROLE.TOTAL ? 'total' : 'restricted';

/**
 * Builds the stable access shape for guests, partners and contact admins: the
 * code-within-workspace match already happened in the query, so an app row
 * here means the app is allowed in the workspace and thus accessible.
 */
const subappToAccess = (
  app: Subapp | null | undefined,
  extra?: {isContactAdmin?: boolean},
): SubappAccess => {
  if (!app) return NO_SUBAPP_ACCESS;
  const installed = Boolean(app.isInstalled);
  const subapp: Subapp = {
    ...app,
    ...(extra?.isContactAdmin ? {isContactAdmin: true} : {}),
  };
  return {subapp, installed, accessible: installed};
};

async function resolveGuestSubappAccess({
  code,
  url,
  client,
}: {
  code: string;
  url: string;
  client: Client;
}): Promise<SubappAccess> {
  const workspace = await client.aOSPortalWorkspace.findOne({
    where: {url: {like: url}},
    select: {
      defaultGuestWorkspace: {
        apps: {
          where: withSubappAccess({code})(),
          select: appSelectFields,
        },
      },
    },
  });

  const app = workspace?.defaultGuestWorkspace?.apps?.[0] ?? null;
  return subappToAccess(app);
}

async function resolvePartnerSubappAccess({
  code,
  url,
  partnerId,
  client,
}: {
  code: string;
  url: string;
  partnerId: ID;
  client: Client;
}): Promise<SubappAccess> {
  const partner = await client.aOSPartner.findOne({
    where: {id: partnerId},
    select: {
      partnerWorkspaceSet: {
        where: {workspace: {url}},
        select: {
          apps: {
            where: withSubappAccess({code})(),
            select: appSelectFields,
          },
        },
      },
    },
  });

  const app = partner?.partnerWorkspaceSet?.[0]?.apps?.[0] ?? null;
  return subappToAccess(app);
}

async function resolveContactSubappAccess({
  code,
  url,
  contactId,
  partnerId,
  client,
}: {
  code: string;
  url: string;
  contactId: ID;
  partnerId: ID;
  client: Client;
}): Promise<SubappAccess> {
  /*
   * One query rooted at the contact: the partner workspace apps (the install
   * source of truth) are reached through mainPartner.partnerWorkspaceSet, while
   * isAdmin and the per-app permission row come from the contact's own
   * contactWorkspaceConfigSet. Both relations are filtered by the app code so
   * each yields at most the single relevant row.
   */
  const contact = await client.aOSPartner.findOne({
    where: {id: contactId},
    select: {
      mainPartner: {
        partnerWorkspaceSet: {
          where: {workspace: {url}},
          select: {
            apps: {
              where: withSubappAccess({code})(),
              select: appSelectFields,
            },
          },
        },
      },
      contactWorkspaceConfigSet: {
        where: {portalWorkspace: {url}, partner: {id: partnerId}},
        select: {
          isAdmin: true,
          contactAppPermissionList: {
            where: {app: {code}},
            select: {
              roleSelect: true,
              app: {code: true},
            },
          },
        },
      },
    },
  });

  const partnerApp =
    contact?.mainPartner?.partnerWorkspaceSet?.[0]?.apps?.[0] ?? null;

  /* Code is not one of this workspace's apps at all. */
  if (!partnerApp) return NO_SUBAPP_ACCESS;

  const config = contact?.contactWorkspaceConfigSet?.[0];

  /* Admins see every app allowed in the workspace; the permission list is
     ignored. */
  if (config?.isAdmin) {
    return subappToAccess(partnerApp, {isContactAdmin: true});
  }

  const permission = config?.contactAppPermissionList?.find(
    item => item.app?.code === code,
  );

  /*
   * A restricted contact only sees the app when there is a permission row for
   * the code. The app is already allowed in the workspace (the partner-app
   * relation matched), so a missing permission row means no sub-app for this
   * contact specifically. installed stays true so callers can tell an
   * unauthorized contact apart from an app that is not part of the workspace.
   */
  if (!permission) return {subapp: null, installed: true, accessible: false};

  return {
    subapp: {
      ...partnerApp,
      role: normalizeRole(permission.roleSelect),
    },
    installed: true,
    accessible: true,
  };
}

export async function resolveSubappAccess({
  code,
  url,
  user,
  client,
}: {
  code: string;
  url: string;
  user?: SubappAccessUser;
  client: Client;
}): Promise<SubappAccess> {
  if (!(code && url)) return NO_SUBAPP_ACCESS;

  if (!user) {
    return resolveGuestSubappAccess({code, url, client});
  }

  if (!user.isContact) {
    return resolvePartnerSubappAccess({
      code,
      url,
      partnerId: getPartnerId(user),
      client,
    });
  }

  if (!user.mainPartnerId) return NO_SUBAPP_ACCESS;

  return resolveContactSubappAccess({
    code,
    url,
    contactId: user.id,
    partnerId: user.mainPartnerId,
    client,
  });
}

export async function findSubappAccess({
  code,
  user,
  url,
  client,
}: {
  code: string;
  user?: SubappAccessUser;
  url: string;
  client: Client;
}): Promise<Subapp | null> {
  const result = await resolveSubappAccess({code, url, user, client});

  return result.accessible ? result.subapp : null;
}

/* ----------------------------------------------------------------------- *
 * Unified workspace + sub-app resolution (single query, no heavy config)
 *
 * resolveWorkspaceApp answers, in ONE scoped query per user type, "what is
 * this workspace and can this user reach <code>?". It returns the workspace
 * WITHOUT its heavy config payload — only config ({id}) — plus
 * the user's accessible apps and the requested sub-app (apps.find(code)).
 * Pages that render config-driven UI fetch it on demand via their per-app config getter.
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

export type WorkspaceApp = {
  workspace: Workspace | null;
  subapp: Subapp | null;
};

const NO_WORKSPACE_APP: WorkspaceApp = {workspace: null, subapp: null};

/* Installed apps of the workspace — the accessible set for guests/partners. */
const installedApps = (apps: Subapp[] | null | undefined): Subapp[] =>
  (apps ?? []).filter(app => app.isInstalled);

/* Resolves a workspace for a visitor with no identity (a guest, or a holder of
   a capability token) from its default guest configuration. Returns the light
   workspace — its installed apps and a config reference — or null when the
   workspace, its guest workspace, or that guest's config is absent. */
export async function resolveGuestWorkspace({
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

async function resolveGuestWorkspaceApp({
  code,
  url,
  client,
}: {
  code: string;
  url: string;
  client: Client;
}): Promise<WorkspaceApp> {
  const workspace = await resolveGuestWorkspace({url, client});
  if (!workspace) return NO_WORKSPACE_APP;

  return {
    workspace,
    subapp: workspace.apps.find(app => app.code === code) ?? null,
  };
}

async function resolvePartnerWorkspaceApp({
  code,
  url,
  partnerId,
  client,
}: {
  code: string;
  url: string;
  partnerId: ID;
  client: Client;
}): Promise<WorkspaceApp> {
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
  if (!partnerWorkspace?.workspace) return NO_WORKSPACE_APP;

  const configRef = partnerWorkspace.portalAppConfig;
  if (!configRef) return NO_WORKSPACE_APP;

  const apps = installedApps(partnerWorkspace.apps as Subapp[]);
  const light = toWorkspace(
    partnerWorkspace.workspace,
    apps,
    configRef,
    partnerWorkspace.id,
  );
  return {
    workspace: light,
    subapp: apps.find(app => app.code === code) ?? null,
  };
}

async function resolveContactWorkspaceApp({
  code,
  url,
  contactId,
  partnerId,
  client,
}: {
  code: string;
  url: string;
  contactId: ID;
  partnerId: ID;
  client: Client;
}): Promise<WorkspaceApp> {
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
  if (!partnerWorkspace?.workspace) return NO_WORKSPACE_APP;

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
  if (!configRef) return NO_WORKSPACE_APP;

  const light = toWorkspace(
    partnerWorkspace.workspace,
    apps,
    configRef,
    partnerWorkspace.id,
  );
  return {
    workspace: light,
    subapp: apps.find(app => app.code === code) ?? null,
  };
}

export async function resolveWorkspaceApp({
  code,
  url,
  user,
  client,
}: {
  code: string;
  url: string;
  user?: SubappAccessUser;
  client: Client;
}): Promise<WorkspaceApp> {
  if (!url) return NO_WORKSPACE_APP;

  if (!user) {
    return resolveGuestWorkspaceApp({code, url, client});
  }

  if (!user.isContact) {
    return resolvePartnerWorkspaceApp({
      code,
      url,
      partnerId: getPartnerId(user),
      client,
    });
  }

  if (!user.mainPartnerId) return NO_WORKSPACE_APP;

  return resolveContactWorkspaceApp({
    code,
    url,
    contactId: user.id,
    partnerId: user.mainPartnerId,
    client,
  });
}
