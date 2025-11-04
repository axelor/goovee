import {Tenant, manager} from '@/tenant';
import {SUBAPP_CODES} from '@/constants';
import type {PortalApp, PortalWorkspace, User} from '@/types';
import {findSubappAccess} from './workspace';
import {filterPrivate} from './filter';

type Params = {
  code: PortalApp['code'];
  user: User;
  url: PortalWorkspace['url'];
  tenantId: Tenant['id'];
};

type UpdateParams = Params & {
  record?: {
    id: string;
    activateNotification?: boolean;
  };
  activateNotification?: boolean;
};

const preferencefields: any = {
  [SUBAPP_CODES.events]: {
    eventNotificationConfigs: {
      select: {
        activateNotification: true,
        eventCategory: {name: true},
      },
    },
  },
  [SUBAPP_CODES.news]: {
    newsNotificationConfigs: {
      select: {
        activateNotification: true,
        newsCategory: {name: true},
      },
    },
  },
  [SUBAPP_CODES.resources]: {
    resourceNotificationConfigs: {
      select: {
        activateNotification: true,
        folder: {fileName: true},
      },
    },
  },
  [SUBAPP_CODES.forum]: {
    forumNotificationConfigs: {
      select: {
        activateNotification: true,
        forumGroup: {name: true},
      },
    },
  },
};

const pick = (obj: any = {}, ...keys: string[]) =>
  Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)));

export async function findPartnerPreference(params: Params) {
  const {code, url, user, tenantId} = params;
  const client = await manager.getClient(tenantId);

  const preference = await client.aOSPartner
    .findOne({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        version: true,
        portalUserPreferenceList: {
          where: {
            app: {code},
            workspace: {url},
          },
          select: {
            activateNotification: true,
            ...preferencefields[code],
          },
        },
      },
    })
    .then((res: any) => res?.portalUserPreferenceList?.[0]);

  return preference;
}

async function createPartnerPreference(params: UpdateParams) {
  const {code, url, user, tenantId} = params;
  const client = await manager.getClient(tenantId);

  const partner = await client.aOSPartner.findOne({
    where: {id: user.id},
    select: {id: true, version: true},
  });

  if (!partner) {
    return null;
  }

  const app = await client.aOSPortalApp.findOne({
    where: {code},
    select: {id: true},
  });

  if (!app) {
    return null;
  }

  const workspace = await client.aOSPortalWorkspace.findOne({
    where: {url},
    select: {id: true},
  });

  if (!workspace) {
    return null;
  }

  const preference = await client.aOSPartner
    .update({
      data: {
        id: partner.id,
        version: partner.version,
        portalUserPreferenceList: {
          create: [
            {
              app: {select: {id: app?.id}},
              workspace: {select: {id: workspace?.id}},
              activateNotification: params.activateNotification,
            },
          ],
        },
      },
      select: {
        id: true,
        version: true,
        portalUserPreferenceList: {
          where: {
            app: {code},
            workspace: {url},
          },
          select: {
            activateNotification: true,
            ...preferencefields[code],
          },
        },
      },
    })
    .then((res: any) => res?.portalUserPreferenceList?.[0]);

  return preference;
}

export async function findOrCreatePartnerPreference(params: UpdateParams) {
  let preference = await findPartnerPreference(params);

  if (!preference) {
    preference = await createPartnerPreference(params);
  }

  return preference;
}

const routes = {
  [SUBAPP_CODES.events]: ({url, id}: {url: string; id: string}) =>
    `${url}/${[SUBAPP_CODES.events]}?category=${id}&page=1`,
  [SUBAPP_CODES.news]: ({url, slug}: {url: string; slug: string}) =>
    `${url}/${[SUBAPP_CODES.news]}/${slug}`,
  [SUBAPP_CODES.resources]: ({url, id}: {url: string; id: string}) =>
    `${url}/${[SUBAPP_CODES.resources]}/categories?id=${id}`,
  [SUBAPP_CODES.forum]: ({url, id}: {url: string; id: string}) =>
    `${url}/${[SUBAPP_CODES.forum]}/group/id=${id}`,
  [SUBAPP_CODES.ticketing]: ({
    url,
    id,
    pid,
  }: {
    url: string;
    id: string;
    pid: string;
  }) => `${url}/${[SUBAPP_CODES.ticketing]}/projects/${pid}/tickets/${id}`,
};

async function findEventsCategories(params: Params) {
  const {user, tenantId, url} = params;
  const client = await manager.getClient(tenantId);

  const categories = await client.aOSPortalEventCategory
    .find({
      where: {
        workspace: {url},
        ...(await filterPrivate({user, tenantId})),
      },
      select: {
        name: true,
      },
    })
    .then((categories: any) =>
      categories?.map((c: any) => ({
        ...c,
        route: routes[SUBAPP_CODES.events]({url, id: c.id}),
      })),
    )
    .catch(() => []);

  return categories;
}

async function findEventsPreferences(params: Params) {
  const categories = await findEventsCategories(params);
  const preference = await findPartnerPreference(params);

  const getSubscription = (category: any) =>
    preference?.eventNotificationConfigs?.find(
      (e: any) => e.eventCategory?.id === category?.id,
    );

  return {
    ...pick(preference, 'id', 'version', 'activateNotification'),
    code: params.code,
    subscriptions: categories.map((c: any) => {
      const subscription = getSubscription(c);
      return {
        ...c,
        activateNotification: Boolean(subscription?.activateNotification),
      };
    }),
  };
}

async function findNewsCategories(params: Params) {
  const {user, tenantId, url} = params;
  const client = await manager.getClient(tenantId);

  const categories = await client.aOSPortalNewsCategory
    .find({
      where: {
        workspace: {url},
        ...(await filterPrivate({user, tenantId})),
      },
      select: {
        name: true,
        slug: true,
      },
    })
    .then((categories: any) =>
      categories?.map((c: any) => ({
        ...c,
        route: routes[SUBAPP_CODES.news]({url, slug: c.slug}),
      })),
    )
    .catch(() => []);

  return categories;
}

async function findNewsPreferences(params: Params) {
  const categories = await findNewsCategories(params);
  const preference = await findPartnerPreference(params);

  const getSubscription = (category: any) => {
    return preference?.newsNotificationConfigs?.find(
      (e: any) => e.newsCategory?.id === category?.id,
    );
  };

  return {
    ...pick(preference, 'id', 'version', 'activateNotification'),
    code: params.code,
    subscriptions: categories.map((c: any) => {
      const subscription = getSubscription(c);
      return {
        ...c,
        activateNotification: Boolean(subscription?.activateNotification),
      };
    }),
  };
}

async function findResourcesFolders(params: Params) {
  const {user, tenantId, url} = params;
  const client = await manager.getClient(tenantId);

  const folders = await client.aOSDMSFile
    .find({
      where: {
        isDirectory: true,
        workspaceSet: {url},
        parent: {
          id: {eq: null},
        },
        ...(await filterPrivate({user, tenantId})),
      },
      select: {
        fileName: true,
        parent: {id: true},
      },
    })
    .then(result =>
      result?.map(i => ({
        ...i,
        name: i.fileName,
        route: routes[SUBAPP_CODES.resources]({url, id: i.id}),
      })),
    )
    .catch(() => []);

  return folders;
}

async function findResourcesPreferences(params: Params) {
  const folders = await findResourcesFolders(params);
  const preference = await findPartnerPreference(params);

  const getSubscription = (folder: any) => {
    return preference?.resourceNotificationConfigs?.find(
      (e: any) => e.folder?.id === folder?.id,
    );
  };

  return {
    ...pick(preference, 'id', 'version', 'activateNotification'),
    code: params.code,
    subscriptions: folders.map(c => {
      const subscription = getSubscription(c);
      return {
        ...c,
        activateNotification: Boolean(subscription?.activateNotification),
      };
    }),
  };
}

async function findForumGroups(params: Params) {
  const {user, tenantId, url} = params;
  const client = await manager.getClient(tenantId);

  const groups = await client.aOSPortalForumGroupMember
    .find({
      where: {
        member: {
          AND: [{id: user.id}, {id: {ne: null}}],
        },
        forumGroup: {
          workspace: {url},
          ...(await filterPrivate({user, tenantId})),
        },
      },
      select: {
        forumGroup: {
          name: true,
        },
      },
    })
    .then(result =>
      result?.map(i => ({
        ...i.forumGroup,
        route: routes[SUBAPP_CODES.forum]({url, id: i.id}),
      })),
    )
    .catch(() => []);

  return groups;
}

async function findForumPreferences(params: Params) {
  const groups = await findForumGroups(params);
  const preference = await findPartnerPreference(params);

  const getSubscription = (group: any) => {
    return preference?.forumNotificationConfigs?.find(
      (e: any) => e.forumGroup?.id === group?.id,
    );
  };

  return {
    ...pick(preference, 'id', 'version', 'activateNotification'),
    code: params.code,
    subscriptions: groups.map(c => {
      const subscription = getSubscription(c);
      return {
        ...c,
        activateNotification: Boolean(subscription?.activateNotification),
      };
    }),
  };
}

async function findTickets(params: Params) {
  const {user, tenantId, url} = params;
  const client = await manager.getClient(tenantId);

  const tickets = await client.aOSProjectTask
    .find({
      where: {
        project: {
          portalWorkspace: {url},
          isBusinessProject: true,
          projectStatus: {isCompleted: false},
        },
        typeSelect: 'ticket',
        isPrivate: false,
        OR: [
          {managedByContact: {id: user.id}},
          {createdByContact: {id: user.id}},
        ],
      },
      select: {id: true, fullName: true, name: true, project: {id: true}},
    })
    .then(result =>
      result?.map(({id, fullName, name, project}) => ({
        id,
        name: fullName || name,
        route: routes[SUBAPP_CODES.ticketing]({url, id, pid: project?.id}),
      })),
    )
    .catch(() => []);

  return tickets;
}

async function findTicketingPreferences(params: Params) {
  const tickets = await findTickets(params);
  const preference = await findPartnerPreference(params);

  return {
    ...pick(preference, 'id', 'version', 'activateNotification'),
    code: params.code,
    subscriptions: tickets.map(t => ({
      ...t,
      config: {
        id: t.id,
        name: t.name,
      },
      activateNotification: true,
    })),
  };
}

const preferences: any = {
  [SUBAPP_CODES.events]: findEventsPreferences,
  [SUBAPP_CODES.news]: findNewsPreferences,
  [SUBAPP_CODES.resources]: findResourcesPreferences,
  [SUBAPP_CODES.forum]: findForumPreferences,
  [SUBAPP_CODES.ticketing]: findTicketingPreferences,
};

export async function findPreferences(params: Params) {
  const isAccessible = await findSubappAccess(params);

  if (!isAccessible) {
    return null;
  }

  return preferences[params?.code]?.(params);
}

const updatePreferenceConfigs: any = {
  [SUBAPP_CODES.events]: {
    configField: 'eventNotificationConfigs',
    recordField: 'eventCategory',
    entity: (c: any) => c.aOSPortalEventNotificationConfig,
  },
  [SUBAPP_CODES.news]: {
    configField: 'newsNotificationConfigs',
    recordField: 'newsCategory',
    entity: (c: any) => c.aOSPortalNewsNotificationConfig,
  },
  [SUBAPP_CODES.resources]: {
    configField: 'resourceNotificationConfigs',
    recordField: 'folder',
    entity: (c: any) => c.aOSPortalResourceNotificationConfig,
  },
  [SUBAPP_CODES.forum]: {
    configField: 'forumNotificationConfigs',
    recordField: 'forumGroup',
    entity: (c: any) => c.aOSPortalForumNotificationConfig,
  },
};

export async function updatePartnerPreference(params: UpdateParams) {
  let preference = await findOrCreatePartnerPreference(params);

  const {code, tenantId, record, activateNotification = false} = params;
  const client = await manager.getClient(tenantId);

  if (!record) {
    preference = await client.aOSPortalUserPreference.update({
      data: {
        id: preference.id,
        version: preference.version,
        activateNotification,
      },
      select: {
        activateNotification: true,
      },
    });

    return preference;
  }

  const {entity, configField, recordField} = updatePreferenceConfigs[code];

  const existing = preference[configField]?.find(
    (i: any) => i[recordField]?.id === record.id,
  );

  const data: any = {
    activateNotification: record.activateNotification || false,
  };

  if (existing) {
    data.id = existing.id;
    data.version = existing.version;
  } else {
    data[recordField] = {select: {id: record.id}};
    data.portalUserPreference = {select: {id: preference.id}};
  }

  const c = entity(client);

  const fields = {
    id: true,
    version: true,
    [recordField]: {
      id: true,
    },
    activateNotification: true,
    portalUserPreference: {id: true},
  };

  return existing
    ? c.update({data, select: fields})
    : c.create({data, select: fields});
}

async function updateEventsPreferences(params: UpdateParams) {
  const categories = await findEventsCategories(params);

  const {record} = params;

  if (record?.id) {
    const category = categories.find((c: any) => c.id === record.id);
    if (!category) return null;
  }

  return updatePartnerPreference(params);
}

async function updateNewsPreferences(params: UpdateParams) {
  const categories = await findNewsCategories(params);

  const {record} = params;

  if (record?.id) {
    const category = categories.find((c: any) => c.id === record.id);
    if (!category) return null;
  }

  return updatePartnerPreference(params);
}

async function updateResourcesPreferences(params: UpdateParams) {
  const folders = await findResourcesFolders(params);

  const {record} = params;

  if (record?.id) {
    const folder = folders.find(f => f.id === record.id);
    if (!folder) return null;
  }

  return updatePartnerPreference(params);
}

async function updateForumPreferences(params: UpdateParams) {
  const groups = await findForumGroups(params);

  const {record} = params;

  if (record?.id) {
    const group = groups.find(g => g.id === record.id);
    if (!group) return null;
  }

  return updatePartnerPreference(params);
}

async function updateTicketingPreferences(params: UpdateParams) {
  const {record} = params;

  if (record?.id) {
    return;
  }

  return updatePartnerPreference(params);
}

const updatePreferenceHandlers: any = {
  [SUBAPP_CODES.events]: updateEventsPreferences,
  [SUBAPP_CODES.news]: updateNewsPreferences,
  [SUBAPP_CODES.resources]: updateResourcesPreferences,
  [SUBAPP_CODES.forum]: updateForumPreferences,
  [SUBAPP_CODES.ticketing]: updateTicketingPreferences,
};

export async function updatePreferences(params: UpdateParams) {
  const isAccessible = await findSubappAccess(params);

  if (!isAccessible) {
    return null;
  }

  return updatePreferenceHandlers[params?.code]?.(params);
}
