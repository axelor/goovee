// ---- CORE IMPORTS ---- //
import {
  ALLOW_ALL_REGISTRATION,
  ALLOW_AOS_ONLY_REGISTRATION,
  ROLE,
} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalApp} from '@/goovee/.generated/models';
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

export const portalAppConfigFields = {
  name: true,
  company: {
    id: true,
    name: true,
    logo: {
      id: true,
    },
  },
  byNewest: true,
  byFeature: true,
  byAToZ: true,
  byZToA: true,
  byLessExpensive: true,
  byMostExpensive: true,
  displayPrices: true,
  mainPrice: true,
  displayTwoPrices: true,
  hidePriceForEmptyPricelist: true,
  confirmOrder: true,
  requestQuotation: true,
  priceAfterLogin: true,
  paymentOptionSet: {
    select: {
      name: true,
      typeSelect: true,
      paymentMode: {
        id: true,
      },
      transferTypeSelect: true,
    },
  },
  ticketStatusChangeMethod: true,
  ticketHeroTitle: true,
  ticketHeroBgImage: {
    id: true,
    fileName: true,
  },
  ticketHeroDescription: true,
  ticketHeroOverlayColorSelect: true,
  forumHeroTitle: true,
  forumHeroDescription: true,
  forumHeroOverlayColorSelect: true,
  forumHeroBgImage: {id: true},
  eventHeroTitle: true,
  eventHeroDescription: true,
  eventHeroOverlayColorSelect: true,
  eventHeroBgImage: {id: true},
  newsHeroTitle: true,
  newsHeroDescription: true,
  newsHeroOverlayColorSelect: true,
  newsHeroBgImage: {id: true},
  resourcesHeroTitle: true,
  resourcesHeroDescription: true,
  resourcesHeroOverlayColorSelect: true,
  resourcesHeroBgImage: {id: true},
  allowOnlinePaymentForEcommerce: true,
  carouselList: {
    select: {
      title: true,
      subTitle: true,
      href: true,
      image: {id: true},
    },
  },
  hyperlinkList: {
    select: {
      title: true,
      link: true,
      logo: {id: true},
    },
  },
  allowGuestEventRegistration: true,
  enableRecommendedNews: true,
  enableSocialMediaSharing: true,
  enableComment: true,
  enableNewsComment: true,
  enableEventComment: true,
  socialMediaSelect: true,
  canInviteMembers: true,
  isExistingContactsOnly: true,
  invitationTemplateList: {
    select: {
      localization: {code: true},
      template: {name: true, subject: true, content: true, language: true},
    },
  },
  otpTemplateList: {
    select: {
      localization: {code: true},
      template: {name: true, subject: true, content: true, language: true},
    },
  },
  noMoreStockSelect: true,
  outOfStockQty: true,
  defaultStockLocation: {id: true},
  directoryHeroTitle: true,
  directoryHeroBgImage: {
    id: true,
    fileName: true,
  },
  directoryHeroDescription: true,
  directoryHeroOverlayColorSelect: true,
  nonPublicEmailNotFoundMessage: true,
  canPayInvoice: true,
  allowOnlinePaymentForInvoices: true,
  isShowAllTickets: true,
  isShowMyTickets: true,
  isShowManagedTicket: true,
  isShowCreatedTicket: true,
  isShowResolvedTicket: true,
  ticketingFieldSet: {select: {name: true}},
  ticketingFormFieldSet: {select: {name: true}},
  isDisplayChildTicket: true,
  isDisplayRelatedTicket: true,
  isDisplayTicketParent: true,
  isDisplayAssignmentBtn: true,
  isDisplayCancelBtn: true,
  isDisplayCloseBtn: true,
  isShowPublicationAuthor: true,
  isShowPublicationDate: true,
  isShowPublicationTime: true,
  isDisplayContact: true,
  contactEmailAddress: {address: true},
  contactName: true,
  contactPhone: true,
  isCompanyOrAddressRequired: true,
  payInAdvance: true,
  advancePaymentPercentage: true,
  isHomepageDisplay: true,
  isHomepageDisplayNews: true,
  isHomepageDisplayEvents: true,
  isHomepageDisplayMessage: true,
  isHomepageDisplayResources: true,
  isHomepageDisplayHyperlinks: true,
  homepageHeroTitle: true,
  homepageHeroDescription: true,
  homepageHeroOverlayColorSelect: true,
  homepageHeroBgImage: {id: true},
  isFixedHeader: true,
  chatDisplayTypeSelect: true,
  termsOfUseAcceptanceText: true,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type PortalAppConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof portalAppConfigFields}
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

type IntermediateWorkspaceConfig = Promise<{
  config: PortalAppConfig;
  apps: App[] | null;
  workspacePermissionConfig: {id: string};
} | null>;

export async function findPartnerWorkspaceConfig({
  url,
  partnerId,
  client,
}: {
  url: string;
  partnerId?: ID;
  client: Client;
}): IntermediateWorkspaceConfig {
  if (!(url && partnerId)) return null;

  const res = await client.aOSPartner.findOne({
    where: {
      id: partnerId,
    },
    select: {
      partnerWorkspaceSet: {
        where: {
          workspace: {
            url,
          },
        },
        select: {
          portalAppConfig: portalAppConfigFields,
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
    },
  });

  if (!res?.partnerWorkspaceSet?.length) {
    return null;
  }

  const partnerWorkspaceConfig = res.partnerWorkspaceSet[0];

  if (!partnerWorkspaceConfig) return null;

  const portalAppConfig = partnerWorkspaceConfig?.portalAppConfig;
  if (!portalAppConfig) return null;

  return {
    config: portalAppConfig,
    apps: partnerWorkspaceConfig?.apps,
    workspacePermissionConfig: {id: partnerWorkspaceConfig.id},
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
        portalAppConfig: portalAppConfigFields,
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

export async function findDefaultGuestWorkspaceConfig({
  url,
  client,
}: {
  url: string;
  client: Client;
}): IntermediateWorkspaceConfig {
  if (!url) return null;

  const workspace = await client.aOSPortalWorkspace.findOne({
    where: {
      url: {
        like: url,
      },
    },
    select: {
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
        portalAppConfig: portalAppConfigFields,
      },
    },
  });

  const defaultGuestWorkspaceConfig = workspace?.defaultGuestWorkspace;

  if (!defaultGuestWorkspaceConfig) return null;
  const portalAppConfig = defaultGuestWorkspaceConfig?.portalAppConfig;
  if (!portalAppConfig) return null;

  return {
    config: portalAppConfig,
    apps: defaultGuestWorkspaceConfig.apps,
    workspacePermissionConfig: {id: defaultGuestWorkspaceConfig.id},
  };
}

export type PortalWorkspace = {
  id: string;
  name: string | null;
  version: number;
  workspaceUser: {id: string; version: number} | null;
  theme: {
    id: string;
    version: number;
    name: string | null;
    css: string | null;
  } | null;
  url: string;
  logo: {id: string; version: number} | null;
  navigationSelect: string;
  config: PortalAppConfig;
  apps: App[];
  workspacePermissionConfig: {
    id: string;
  };
};

export async function findWorkspace({
  url = '',
  user,
  client,
}: {
  url?: string;
  user?: Pick<User, 'id' | 'isContact' | 'mainPartnerId'>;
  client: Client;
}): Promise<PortalWorkspace | null> {
  if (!url) return null;

  const workspace = await client.aOSPortalWorkspace.findOne({
    where: {
      url: {
        like: url,
      },
    },
    select: {
      name: true,
      url: true,
      defaultTheme: {name: true, css: true},
      navigationSelect: true,
      user: {id: true},
      workspaceLogo: {
        id: true,
      },
    },
  });

  if (!workspace) return null;

  let workspaceConfig: {
    config: PortalAppConfig;
    apps: App[] | null;
    workspacePermissionConfig: {id: string};
  } | null;

  if (user) {
    const partnerId = getPartnerId(user);

    workspaceConfig = await findPartnerWorkspaceConfig({
      partnerId,
      url,
      client,
    });
  } else {
    workspaceConfig = await findDefaultGuestWorkspaceConfig({
      url,
      client,
    });
  }

  if (!workspaceConfig) return null;

  const {
    id,
    name,
    version,
    defaultTheme: theme,
    navigationSelect,
    user: workspaceUser,
    workspaceLogo: logo,
  } = workspace;

  return {
    id,
    name,
    version,
    workspaceUser,
    theme,
    url,
    logo,
    navigationSelect: navigationSelect || 'leftSide',
    config: workspaceConfig.config,
    apps: workspaceConfig.apps || [],
    workspacePermissionConfig: workspaceConfig.workspacePermissionConfig,
  };
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
  url: PortalWorkspace['url'];
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
  url: PortalWorkspace['url'];
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
