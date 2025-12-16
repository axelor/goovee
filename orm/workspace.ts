// ---- CORE IMPORTS ---- //
import {manager, type Tenant} from '@/tenant';
import {AOSPortalAppConfig} from '@/goovee/.generated/models';
import {ID, Partner, PortalWorkspace, User} from '@/types';
import {clone, getPartnerId} from '@/utils';
import {SelectOptions} from '@goovee/orm';

export const portalAppConfigFields: SelectOptions<AOSPortalAppConfig> = {
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
  homepageHeroTitle: true,
  homepageHeroDescription: true,
  homepageHeroOverlayColorSelect: true,
  homepageHeroBgImage: {id: true},
  isFixedHeader: true,
};

export async function findWorkspaceMembers({
  url,
  tenantId,
  partnerId,
}: {
  url?: string;
  tenantId: Tenant['id'];
  partnerId: Partner['id'];
}) {
  if (!(url && tenantId && partnerId)) {
    return {
      partners: [],
      contacts: [],
    };
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
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
    .then((contacts: any) =>
      contacts?.map((c: any) => ({
        ...c,
        contactWorkspaceConfig: c?.contactWorkspaceConfigSet?.[0],
      })),
    );

  return {
    partners: memberPartners,
    contacts: memberContacts,
  };
}

export async function findContactWorkspaceConfig({
  url,
  partnerId,
  contactId,
  tenantId,
}: {
  url?: string;
  partnerId: Partner['id'];
  contactId: ID;
  tenantId: Tenant['id'];
}) {
  if (!(url && contactId && tenantId && partnerId)) return null;

  const client = await manager.getClient(tenantId);

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

  const contactWorkpace: any = contact?.contactWorkspaceConfigSet?.[0];

  const apps = contactWorkpace?.contactAppPermissionList?.map((w: any) => ({
    ...w.app,
    role: w.roleSelect,
  }));

  return {
    ...contactWorkpace,
    apps,
  };
}

export async function findPartnerWorkspaceConfig({
  url,
  partnerId,
  tenantId,
}: {
  url: string;
  partnerId?: ID;
  tenantId: Tenant['id'];
}) {
  if (!(url && partnerId && tenantId)) return null;

  const client = await manager.getClient(tenantId);

  const res: any = await client.aOSPartner.findOne({
    where: {
      id: partnerId,
    },
    select: {
      partnerWorkspaceSet: {
        where: {
          workspace: {
            url: {
              like: `%${url}%`,
            },
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

  return {
    config: partnerWorkspaceConfig?.portalAppConfig,
    apps: partnerWorkspaceConfig?.apps,
    workspacePermissionConfig: {id: partnerWorkspaceConfig.id},
  };
}

export async function findDefaultPartnerWorkspaceConfig({
  url,
  tenantId,
}: {
  url: string;
  tenantId: Tenant['id'];
}) {
  if (!url) return null;

  const client = await manager.getClient(tenantId);

  const workspace: any = await client.aOSPortalWorkspace.findOne({
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
  tenantId,
}: {
  partnerId?: ID;
  tenantId: Tenant['id'];
}) {
  if (!partnerId) return null;

  const client = await manager.getClient(tenantId);

  const res: any = await client.aOSPartner.findOne({
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
  tenantId,
}: {
  url: string;
  tenantId: Tenant['id'];
}) {
  if (!(url && tenantId)) return null;

  const client = await manager.getClient(tenantId);

  const workspace: any = await client.aOSPortalWorkspace.findOne({
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

  return {
    config: defaultGuestWorkspaceConfig?.portalAppConfig,
    apps: defaultGuestWorkspaceConfig?.apps,
    workspacePermissionConfig: {id: workspace?.defaultGuestWorkspace?.id},
  };
}

export async function findWorkspace({
  url = '',
  user,
  tenantId,
}: {
  url?: string;
  user?: User;
  tenantId: Tenant['id'];
}): Promise<PortalWorkspace | null> {
  if (!(url && tenantId)) return null;

  const client = await manager.getClient(tenantId);

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

  let workspaceConfig;

  if (user) {
    const partnerId = getPartnerId(user);

    const partnerWorkspaceConfig = await findPartnerWorkspaceConfig({
      partnerId,
      url,
      tenantId,
    });

    if (partnerWorkspaceConfig?.config) {
      workspaceConfig = partnerWorkspaceConfig;
    }
  } else {
    const defaultGuestWorkspaceConfig = await findDefaultGuestWorkspaceConfig({
      url,
      tenantId,
    });

    if (defaultGuestWorkspaceConfig?.config) {
      workspaceConfig = defaultGuestWorkspaceConfig;
    }
  }

  const workspacePermissionConfig = workspaceConfig?.workspacePermissionConfig;
  let config = workspaceConfig?.config;
  let apps: any[] = workspaceConfig?.apps;

  if (!config) {
    config = null;
  }

  apps = apps || [];

  const {
    id,
    name,
    version,
    defaultTheme: theme,
    navigationSelect = 'leftSide',
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
    config,
    apps,
    navigationSelect,
    workspacePermissionConfig,
    logo,
  };
}

export async function findOpenWorkspaces({
  url,
  tenantId,
}: {
  url?: string;
  tenantId: Tenant['id'];
}) {
  if (!tenantId) return [];

  const client = await manager.getClient(tenantId);

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
      orderBy: {updatedOn: 'DESC'} as any,
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
  tenantId,
}: {
  url?: string;
  partnerId: ID;
  tenantId: Tenant['id'];
}) {
  if (!(partnerId && tenantId)) return [];

  const client = await manager.getClient(tenantId);

  const res: any = await client.aOSPartner
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
    .map((item: any) => item.workspace)
    .filter(Boolean);
}
export async function findContactWorkspaces({
  url,
  partnerId,
  contactId,
  tenantId,
}: {
  url?: string;
  partnerId: ID;
  contactId: ID;
  tenantId: Tenant['id'];
}) {
  if (!(partnerId && contactId)) return [];

  const client = await manager.getClient(tenantId);

  const partnerWorkspaces = await findPartnerWorkspaces({
    url,
    partnerId,
    tenantId,
  });

  if (!partnerWorkspaces?.length) return [];

  const res: any = await client.aOSPartner
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

  const partnerWorkspaceAccess = (workspace: any) => {
    return partnerWorkspaces.some((w: any) => w.id === workspace?.id);
  };

  return res?.contactWorkspaceConfigSet
    .map((item: any) => item.portalWorkspace)
    .filter(partnerWorkspaceAccess)
    .filter(Boolean);
}

export async function findWorkspaceByURL({
  url,
  tenantId,
}: {
  url: string;
  tenantId: Tenant['id'];
}) {
  if (!(url && tenantId)) return null;

  const client = await manager.getClient(tenantId);

  if (!client) return null;

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

export async function findWorkspaces({
  url,
  user,
  tenantId,
}: {
  url?: string;
  user?: User;
  tenantId: Tenant['id'];
}) {
  if (!(url && tenantId)) return [];

  if (!user) {
    return findOpenWorkspaces({url, tenantId});
  }

  if (!user.isContact) {
    return findPartnerWorkspaces({
      url,
      partnerId: user.id,
      tenantId,
    });
  }

  if (user.isContact) {
    return findContactWorkspaces({
      url,
      contactId: user.id,
      partnerId: user.mainPartnerId!,
      tenantId,
    });
  }

  return [];
}

export async function findWorkspaceApps({
  url,
  user,
  tenantId,
}: {
  url?: string;
  user?: User;
  tenantId: Tenant['id'];
}) {
  const workspace = await findWorkspace({url, user, tenantId});

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
    tenantId,
  });

  if (contactWorkpaceConfig.isAdmin) {
    return apps.map(app => ({...app, isContactAdmin: true}));
  }

  const available = (app: any) =>
    apps.some(a => a.code === app.code && a.isInstalled);

  const contactApps = (contactWorkpaceConfig?.apps || []).filter(available);

  return contactApps;
}

export async function findSubapps({
  url,
  user,
  tenantId,
}: {
  url: string;
  user?: User;
  tenantId: Tenant['id'];
}) {
  if (!tenantId) return [];

  const apps = await findWorkspaceApps({
    url,
    user,
    tenantId,
  }).then(clone);

  return apps;
}

export async function findSubapp({
  code,
  url,
  user,
  tenantId,
}: {
  code: string;
  url: string;
  user?: User;
  tenantId: Tenant['id'];
}) {
  if (!tenantId) return null;

  const subapps = await findSubapps({url, user, tenantId});

  return subapps.find((app: any) => app.code === code);
}

export async function findSubappAccess({
  code,
  user,
  url,
  tenantId,
}: {
  code: string;
  user: any;
  url: string;
  tenantId: Tenant['id'];
}) {
  if (!(code && url && tenantId)) return null;

  const subapp = await findSubapp({code, url, user, tenantId});

  if (!subapp?.isInstalled) return null;

  return subapp;
}
