import type {Client} from '@/goovee/.generated/client';
import {AOSPartner, AOSPortalUserPreference} from '@/goovee/.generated/models';
import type {
  CreateArgs,
  Entity,
  Payload,
  Repository,
  SelectOptions,
  UpdateArgs,
} from '@goovee/orm';
import {SUBAPP_CODES} from '@/constants';
import type {User} from '@/types';
import type {WorkspaceLight} from '@/orm/workspace';
import type {NotificationAppCode} from '@/utils/validators';
import {findSubappAccess} from './workspace';
import {filterPartnersByRecordAccess, filterPrivate} from './filter';

type Params = {
  code: NotificationAppCode;
  user: User;
  url: WorkspaceLight['url'];
  client: Client;
};

export type PreferenceResponse = {
  id: string;
  version: number;
  activateNotification: boolean | null;
  code: NotificationAppCode;
  subscriptions: Array<{
    id: string;
    version: number;
    name: string | null;
    slug?: string | null;
    fileName?: string | null;
    parent?: {id: string; version: number} | null;
    route: string;
    config?: {id: string; name: string};
    activateNotification: boolean;
  }>;
};

type UpdateParams = Params & {
  record?: {
    id: string;
    activateNotification?: boolean;
  };
  activateNotification?: boolean;
};

const preferencefields = {
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
  [SUBAPP_CODES.ticketing]: {} as never,
} as const satisfies Record<
  NotificationAppCode,
  SelectOptions<AOSPortalUserPreference>
>;

type PartnerPreference = {
  id: string;
  version: number;
  activateNotification: boolean | null;
  eventNotificationConfigs?: Array<{
    id: string;
    version: number;
    activateNotification: boolean | null;
    eventCategory: {id: string; version: number; name: string | null} | null;
  }> | null;
  newsNotificationConfigs?: Array<{
    id: string;
    version: number;
    activateNotification: boolean | null;
    newsCategory: {id: string; version: number; name: string | null} | null;
  }> | null;
  resourceNotificationConfigs?: Array<{
    id: string;
    version: number;
    activateNotification: boolean | null;
    folder: {id: string; version: number; fileName: string | null} | null;
  }> | null;
  forumNotificationConfigs?: Array<{
    id: string;
    version: number;
    activateNotification: boolean | null;
    forumGroup: {id: string; version: number; name: string | null} | null;
  }> | null;
};
export async function findPartnerPreference(
  params: Params,
): Promise<PartnerPreference | null> {
  const {code, url, user, client} = params;

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
    .then(
      res =>
        (res?.portalUserPreferenceList?.[0] as PartnerPreference | undefined) ??
        null,
    );

  return preference;
}

async function createPartnerPreference(
  params: UpdateParams,
): Promise<PartnerPreference | null> {
  const {code, url, user, client} = params;

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
    .then(
      res =>
        (res?.portalUserPreferenceList?.[0] as PartnerPreference | undefined) ??
        null,
    );

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
    `${url}/${[SUBAPP_CODES.forum]}/group/${id}`,
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
  const {user, client, url} = params;

  const categories = await client.aOSPortalEventCategory
    .find({
      where: {
        workspace: {url},
        ...(await filterPrivate({user, client})),
      },
      select: {
        name: true,
      },
    })
    .then(categories =>
      categories?.map(c => ({
        id: c.id,
        version: c.version,
        name: c.name,
        route: routes[SUBAPP_CODES.events]({url, id: c.id}),
      })),
    )
    .catch(() => []);

  return categories;
}

async function findEventsPreferences(
  params: Params,
): Promise<PreferenceResponse | null> {
  const categories = await findEventsCategories(params);
  const preference = await findPartnerPreference(params);

  if (!preference) {
    return null;
  }

  const getSubscription = (categoryId: string) =>
    preference.eventNotificationConfigs?.find(
      e => e.eventCategory?.id === categoryId,
    );

  return {
    id: preference.id,
    version: preference.version,
    activateNotification: preference.activateNotification || false,
    code: SUBAPP_CODES.events,
    subscriptions: categories.map(c => ({
      id: c.id,
      version: c.version,
      name: c.name,
      route: c.route,
      activateNotification: Boolean(
        getSubscription(c.id)?.activateNotification,
      ),
    })),
  };
}

async function findNewsCategories(params: Params) {
  const {user, client, url} = params;

  const categories = await client.aOSPortalNewsCategory
    .find({
      where: {
        workspace: {url},
        ...(await filterPrivate({user, client})),
      },
      select: {
        name: true,
        slug: true,
      },
    })
    .then(
      categories =>
        categories
          ?.filter(c => c.slug)
          ?.map(c => ({
            id: c.id,
            version: c.version,
            name: c.name,
            slug: c.slug || '',
            route: routes[SUBAPP_CODES.news]({url, slug: c.slug || ''}),
          })) || [],
    )
    .catch(() => []);

  return categories;
}

async function findNewsPreferences(
  params: Params,
): Promise<PreferenceResponse | null> {
  const categories = await findNewsCategories(params);
  const preference = await findPartnerPreference(params);

  if (!preference) {
    return null;
  }

  const getSubscription = (categoryId: string) => {
    return preference.newsNotificationConfigs?.find(
      e => e.newsCategory?.id === categoryId,
    );
  };

  return {
    id: preference.id,
    version: preference.version,
    activateNotification: preference.activateNotification || false,
    code: SUBAPP_CODES.news,
    subscriptions: categories.map(c => ({
      id: c.id,
      version: c.version,
      name: c.name,
      slug: c.slug,
      route: c.route,
      activateNotification: Boolean(
        getSubscription(c.id)?.activateNotification,
      ),
    })),
  };
}

async function findResourcesFolders(params: Params) {
  const {user, client, url} = params;

  const folders = await client.aOSDMSFile
    .find({
      where: {
        isDirectory: true,
        workspaceSet: {url},
        parent: {
          id: {eq: null},
        },
        ...(await filterPrivate({user, client})),
      },
      select: {
        fileName: true,
        parent: {id: true},
      },
    })
    .then(
      result =>
        result?.map(i => ({
          id: i.id,
          version: i.version,
          name: i.fileName || '',
          fileName: i.fileName,
          parent: i.parent,
          route: routes[SUBAPP_CODES.resources]({url, id: i.id}),
        })) || [],
    )
    .catch(() => []);

  return folders;
}

async function findResourcesPreferences(
  params: Params,
): Promise<PreferenceResponse | null> {
  const folders = await findResourcesFolders(params);
  const preference = await findPartnerPreference(params);

  if (!preference) {
    return null;
  }

  const getSubscription = (folderId: string) => {
    return preference.resourceNotificationConfigs?.find(
      e => e.folder?.id === folderId,
    );
  };

  return {
    id: preference.id,
    version: preference.version,
    activateNotification: preference.activateNotification,
    code: SUBAPP_CODES.resources,
    subscriptions: folders.map(c => ({
      id: c.id,
      version: c.version,
      name: c.name,
      fileName: c.fileName,
      parent: c.parent,
      route: c.route,
      activateNotification: Boolean(
        getSubscription(c.id)?.activateNotification,
      ),
    })),
  };
}

async function findForumGroups(params: Params) {
  const {user, client, url} = params;

  const groups = await client.aOSPortalForumGroupMember
    .find({
      where: {
        member: {
          AND: [{id: user.id}, {id: {ne: null}}],
        },
        forumGroup: {
          workspace: {url},
          ...(await filterPrivate({user, client})),
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
        id: i.forumGroup?.id || '',
        version: i.forumGroup?.version || 0,
        name: i.forumGroup?.name || '',
        route: routes[SUBAPP_CODES.forum]({url, id: i.forumGroup?.id || ''}),
      })),
    )
    .catch(() => []);

  return groups;
}

async function findForumPreferences(
  params: Params,
): Promise<PreferenceResponse | null> {
  const groups = await findForumGroups(params);
  const preference = await findPartnerPreference(params);

  if (!preference) {
    return null;
  }

  const getSubscription = (groupId: string) => {
    return preference.forumNotificationConfigs?.find(
      e => e.forumGroup?.id === groupId,
    );
  };

  return {
    id: preference.id,
    version: preference.version,
    activateNotification: preference.activateNotification,
    code: SUBAPP_CODES.forum,
    subscriptions: groups.map(c => ({
      id: c.id,
      version: c.version,
      name: c.name,
      route: c.route,
      activateNotification: Boolean(
        getSubscription(c.id)?.activateNotification,
      ),
    })),
  };
}

async function findTickets(params: Params) {
  const {user, client, url} = params;

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
      result?.map(({id, version, fullName, name, project}) => ({
        id,
        version,
        name: fullName || name,
        route: routes[SUBAPP_CODES.ticketing]({url, id, pid: project?.id!}),
      })),
    )
    .catch(() => []);

  return tickets;
}

async function findTicketingPreferences(
  params: Params,
): Promise<PreferenceResponse | null> {
  const tickets = await findTickets(params);
  const preference = await findPartnerPreference(params);

  if (!preference) {
    return null;
  }

  return {
    id: preference.id,
    version: preference.version,
    activateNotification: preference.activateNotification || false,
    code: SUBAPP_CODES.ticketing,
    subscriptions: tickets.map(t => ({
      id: t.id,
      version: t.version,
      name: t.name,
      route: t.route,
      config: {
        id: t.id,
        name: t.name,
      },
      activateNotification: true,
    })),
  };
}

const preferences: Record<
  string,
  (params: Params) => Promise<PreferenceResponse | null>
> = {
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

type EventNotificationConfigResult = {
  id: string;
  version: number;
  eventCategory: {id: string; version: number} | null;
  activateNotification: boolean | null;
  portalUserPreference: {id: string; version: number} | null;
};

type NewsNotificationConfigResult = {
  id: string;
  version: number;
  newsCategory: {id: string; version: number} | null;
  activateNotification: boolean | null;
  portalUserPreference: {id: string; version: number} | null;
};

type ResourceNotificationConfigResult = {
  id: string;
  version: number;
  folder: {id: string; version: number} | null;
  activateNotification: boolean | null;
  portalUserPreference: {id: string; version: number} | null;
};

type ForumNotificationConfigResult = {
  id: string;
  version: number;
  forumGroup: {id: string; version: number} | null;
  activateNotification: boolean | null;
  portalUserPreference: {id: string; version: number} | null;
};

type UpdatePreferenceConfig = {
  configField: string;
  recordField: string;
  entity: (client: Client) => Repository<Entity>;
};

const updatePreferenceConfigs: Record<string, UpdatePreferenceConfig> = {
  [SUBAPP_CODES.events]: {
    configField: 'eventNotificationConfigs',
    recordField: 'eventCategory',
    entity: (c: Client) => c.aOSPortalEventNotificationConfig,
  },
  [SUBAPP_CODES.news]: {
    configField: 'newsNotificationConfigs',
    recordField: 'newsCategory',
    entity: (c: Client) => c.aOSPortalNewsNotificationConfig,
  },
  [SUBAPP_CODES.resources]: {
    configField: 'resourceNotificationConfigs',
    recordField: 'folder',
    entity: (c: Client) => c.aOSPortalResourceNotificationConfig,
  },
  [SUBAPP_CODES.forum]: {
    configField: 'forumNotificationConfigs',
    recordField: 'forumGroup',
    entity: (c: Client) => c.aOSPortalForumNotificationConfig,
  },
};

export async function updatePartnerPreference(
  params: UpdateParams,
): Promise<
  | PartnerPreference
  | EventNotificationConfigResult
  | NewsNotificationConfigResult
  | ResourceNotificationConfigResult
  | ForumNotificationConfigResult
  | null
> {
  let preference = await findOrCreatePartnerPreference(params);

  if (!preference) {
    return null;
  }

  const {code, client, record, activateNotification = false} = params;

  if (!record) {
    preference = await client.aOSPortalUserPreference.update({
      data: {
        id: preference.id,
        version: preference.version,
        activateNotification,
      },
      select: {
        activateNotification: true,
        ...preferencefields[code],
      },
    });

    return preference;
  }

  const config = updatePreferenceConfigs[code];
  if (!config) {
    return null;
  }

  const {entity, configField, recordField} = config;
  const configArray = preference[configField as keyof PartnerPreference];

  let existing: Record<string, unknown> | undefined;
  if (Array.isArray(configArray)) {
    existing = configArray.find(i => {
      const item = i as Record<string, any>;
      const relation = item[recordField];
      return relation && (relation as Record<string, unknown>).id === record.id;
    }) as Record<string, unknown> | undefined;
  }

  const data: Record<string, unknown> = {
    activateNotification: record.activateNotification || false,
  };

  if (existing) {
    data.id = existing['id'];
    data.version = existing['version'];
  } else {
    data[recordField] = {select: {id: record.id}};
    data.portalUserPreference = {select: {id: preference.id}};
  }

  const repository = entity(client);
  const fields: Record<string, unknown> = {
    id: true,
    version: true,
    [recordField]: {
      id: true,
    },
    activateNotification: true,
    portalUserPreference: {id: true},
  };

  return (existing
    ? repository.update({data: data as UpdateArgs<Entity>, select: fields})
    : repository.create({
        data: data as CreateArgs<Entity>,
        select: fields,
      })) as unknown as Promise<
    | EventNotificationConfigResult
    | NewsNotificationConfigResult
    | ResourceNotificationConfigResult
    | ForumNotificationConfigResult
  >;
}

async function updateEventsPreferences(
  params: UpdateParams,
): Promise<PartnerPreference | null> {
  const categories = await findEventsCategories(params);

  const {record} = params;

  if (record?.id) {
    const category = categories.find(c => c.id === record.id);
    if (!category) return null;
  }

  return updatePartnerPreference(params);
}

async function updateNewsPreferences(
  params: UpdateParams,
): Promise<PartnerPreference | NewsNotificationConfigResult | null> {
  const categories = await findNewsCategories(params);

  const {record} = params;

  if (record?.id) {
    const category = categories.find(c => c.id === record.id);
    if (!category) return null;
  }

  return updatePartnerPreference(params);
}

async function updateResourcesPreferences(
  params: UpdateParams,
): Promise<PartnerPreference | ResourceNotificationConfigResult | null> {
  const folders = await findResourcesFolders(params);

  const {record} = params;

  if (record?.id) {
    const folder = folders.find(f => f.id === record.id);
    if (!folder) return null;
  }

  return updatePartnerPreference(params);
}

async function updateForumPreferences(
  params: UpdateParams,
): Promise<PartnerPreference | ForumNotificationConfigResult | null> {
  const groups = await findForumGroups(params);

  const {record} = params;

  if (record?.id) {
    const group = groups.find(g => g.id === record.id);
    if (!group) return null;
  }

  return updatePartnerPreference(params);
}

async function updateTicketingPreferences(
  params: UpdateParams,
): Promise<PartnerPreference | null> {
  const {record} = params;

  if (record?.id) {
    return null;
  }

  return updatePartnerPreference(params);
}

type UpdatePreferenceHandler = (
  params: UpdateParams,
) => Promise<PartnerPreference | null>;

const updatePreferenceHandlers: Record<string, UpdatePreferenceHandler> = {
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

const partnerSelect = {
  emailAddress: {address: true},
  localization: {code: true},
  isContact: true,
  simpleFullName: true,
  fullName: true,
  mainPartner: {id: true},
} as const;

type Partner = Payload<AOSPartner, {select: typeof partnerSelect}>;

function partnerToUser(partner: Partner, tenantId: string): User {
  return {
    id: partner.id,
    name: partner.fullName,
    email: partner.emailAddress!.address!,
    locale: partner.localization?.code,
    isContact: partner.isContact,
    simpleFullName: partner.simpleFullName,
    mainPartnerId: partner.isContact ? partner.mainPartner?.id : undefined,
    tenantId,
    image: null,
  };
}

type Subscriber = {user: User; entity: {id: string; route: string}};

function partnersToSubscribers({
  partners,
  recordId,
  route,
  tenantId,
}: {
  partners: ReadonlyArray<Partner>;
  recordId: string;
  route: string;
  tenantId: string;
}): Subscriber[] {
  return partners
    .map(partner => {
      if (!partner.emailAddress?.address) return null;
      return {
        user: partnerToUser(partner, tenantId),
        entity: {id: recordId, route},
      };
    })
    .filter((r): r is Subscriber => r != null);
}

type FindSubscribersParams = {
  code: NotificationAppCode;
  workspaceUrl: string;
  recordId: string;
  tenantId: string;
  client: Client;
};

async function findEventCategorySubscribers(params: FindSubscribersParams) {
  const {code, workspaceUrl, recordId, tenantId, client} = params;

  const record = await client.aOSPortalEventCategory.findOne({
    where: {id: recordId},
    select: {
      isPrivate: true,
      partnerSet: {select: {id: true}},
      partnerCategorySet: {select: {id: true}},
    },
  });
  if (!record) return [];

  const partners = await client.aOSPartner.find({
    where: {
      isActivatedOnPortal: true,
      emailAddress: {address: {ne: null}},
      ...filterPartnersByRecordAccess(record),
      portalUserPreferenceList: {
        activateNotification: true,
        app: {code},
        workspace: {url: workspaceUrl},
        eventNotificationConfigs: {
          activateNotification: true,
          eventCategory: {id: recordId},
        },
      },
    },
    select: partnerSelect,
  });

  const route = routes[SUBAPP_CODES.events]({url: workspaceUrl, id: recordId});
  return partnersToSubscribers({partners, recordId, route, tenantId});
}

async function findNewsCategorySubscribers(params: FindSubscribersParams) {
  const {code, workspaceUrl, recordId, tenantId, client} = params;

  const record = await client.aOSPortalNewsCategory.findOne({
    where: {id: recordId},
    select: {
      isPrivate: true,
      slug: true,
      partnerSet: {select: {id: true}},
      partnerCategorySet: {select: {id: true}},
    },
  });
  if (!record) return [];

  const partners = await client.aOSPartner.find({
    where: {
      isActivatedOnPortal: true,
      emailAddress: {address: {ne: null}},
      ...filterPartnersByRecordAccess(record),
      portalUserPreferenceList: {
        activateNotification: true,
        app: {code},
        workspace: {url: workspaceUrl},
        newsNotificationConfigs: {
          activateNotification: true,
          newsCategory: {id: recordId},
        },
      },
    },
    select: partnerSelect,
  });

  const route = routes[SUBAPP_CODES.news]({
    url: workspaceUrl,
    slug: record.slug || '',
  });
  return partnersToSubscribers({partners, recordId, route, tenantId});
}

async function findResourceFolderSubscribers(params: FindSubscribersParams) {
  const {code, workspaceUrl, recordId, tenantId, client} = params;

  const record = await client.aOSDMSFile.findOne({
    where: {id: recordId},
    select: {
      isPrivate: true,
      partnerSet: {select: {id: true}},
      partnerCategorySet: {select: {id: true}},
    },
  });
  if (!record) return [];

  const partners = await client.aOSPartner.find({
    where: {
      isActivatedOnPortal: true,
      emailAddress: {address: {ne: null}},
      ...filterPartnersByRecordAccess(record),
      portalUserPreferenceList: {
        activateNotification: true,
        app: {code},
        workspace: {url: workspaceUrl},
        resourceNotificationConfigs: {
          activateNotification: true,
          folder: {id: recordId},
        },
      },
    },
    select: partnerSelect,
  });

  const route = routes[SUBAPP_CODES.resources]({
    url: workspaceUrl,
    id: recordId,
  });
  return partnersToSubscribers({partners, recordId, route, tenantId});
}

async function findForumGroupSubscribers(params: FindSubscribersParams) {
  const {code, workspaceUrl, recordId, tenantId, client} = params;

  const record = await client.aOSPortalForumGroup.findOne({
    where: {id: recordId},
    select: {
      isPrivate: true,
      partnerSet: {select: {id: true}},
      partnerCategorySet: {select: {id: true}},
    },
  });
  if (!record) return [];

  const partners = await client.aOSPartner.find({
    where: {
      isActivatedOnPortal: true,
      emailAddress: {address: {ne: null}},
      ...filterPartnersByRecordAccess(record),
      portalUserPreferenceList: {
        activateNotification: true,
        app: {code},
        workspace: {url: workspaceUrl},
        forumNotificationConfigs: {
          activateNotification: true,
          forumGroup: {id: recordId},
        },
      },
    },
    select: partnerSelect,
  });

  const route = routes[SUBAPP_CODES.forum]({url: workspaceUrl, id: recordId});
  return partnersToSubscribers({partners, recordId, route, tenantId});
}

async function findTicketSubscribers(
  params: FindSubscribersParams,
): Promise<Subscriber[]> {
  const {code, workspaceUrl, recordId, tenantId, client} = params;

  const task = await client.aOSProjectTask.findOne({
    where: {
      id: recordId,
      typeSelect: 'ticket',
      isPrivate: false,
      project: {
        portalWorkspace: {url: workspaceUrl},
        isBusinessProject: true,
        projectStatus: {isCompleted: false},
      },
      OR: [
        {
          managedByContact: {
            isActivatedOnPortal: true,
            emailAddress: {address: {ne: null}},
          },
        },
        {
          createdByContact: {
            isActivatedOnPortal: true,
            emailAddress: {address: {ne: null}},
          },
        },
      ],
    },
    select: {
      project: {id: true},
      managedByContact: {
        ...partnerSelect,
        portalUserPreferenceList: {
          where: {
            activateNotification: true,
            app: {code},
            workspace: {url: workspaceUrl},
          },
          select: {id: true},
        },
      },
      createdByContact: {
        ...partnerSelect,
        portalUserPreferenceList: {
          where: {
            activateNotification: true,
            app: {code},
            workspace: {url: workspaceUrl},
          },
          select: {id: true},
        },
      },
    },
  });

  if (!task) {
    return [];
  }

  const subscribers: Subscriber[] = [];
  const uniqueContacts = new Map<string, Partner>();

  if (task.managedByContact?.portalUserPreferenceList?.length) {
    uniqueContacts.set(task.managedByContact.id, task.managedByContact);
  }
  if (task.createdByContact?.portalUserPreferenceList?.length) {
    uniqueContacts.set(task.createdByContact.id, task.createdByContact);
  }

  for (const partner of uniqueContacts.values()) {
    const route = routes[SUBAPP_CODES.ticketing]({
      url: workspaceUrl,
      id: recordId,
      pid: task.project?.id || '',
    });

    subscribers.push({
      user: partnerToUser(partner, tenantId),
      entity: {id: recordId, route},
    });
  }

  return subscribers;
}

export async function findSubscribers(
  params: FindSubscribersParams,
): Promise<Subscriber[]> {
  switch (params.code) {
    case SUBAPP_CODES.events:
      return findEventCategorySubscribers(params);
    case SUBAPP_CODES.news:
      return findNewsCategorySubscribers(params);
    case SUBAPP_CODES.resources:
      return findResourceFolderSubscribers(params);
    case SUBAPP_CODES.forum:
      return findForumGroupSubscribers(params);
    case SUBAPP_CODES.ticketing:
      return findTicketSubscribers(params);
    default:
      return [];
  }
}
