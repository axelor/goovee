// ---- CORE IMPORTS ---- //
import {aosClient} from '@/service';
import {filterPrivate} from '@/orm/filter';
import type {TenantConfig} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import type {ID, MainWebsite, User, Website, WebsitePage} from '@/types';
import type {WorkspaceLight} from '@/orm/workspace';
import {clone} from '@/utils';
import {findModelFields} from '@/orm/model-fields';
import {SUBAPP_CODES} from '@/constants';
import {
  JSON_MODEL_ATTRS,
  RelationalFieldTypes,
  JsonRelationalFieldTypes,
  CONTENT_MODEL,
  CONTENT_MODEL_ATTRS,
  MOUNT_TYPE,
} from '../constants';
import {LayoutMountType} from '../types';
import {Cache, chunkArray} from '../utils/helper';
import {metaModels} from '../templates/meta-models';
import {Maybe} from '@/types/util';
import {JsonObject} from '@goovee/orm';

type MainWebsiteResult = {
  id: string;
  version: number;
  slug: string | null;
  name?: string | null;
};

export async function findAllMainWebsites({
  workspaceURL,
  user,
  client,
  locale,
}: {
  workspaceURL: WorkspaceLight['url'];
  user?: User;
  client: Client;
  locale?: string | null;
}): Promise<MainWebsiteResult[]> {
  if (!(workspaceURL && client)) {
    return [];
  }

  const mainWebsites = await client.aOSPortalCmsMainWebsite.find({
    where: {
      workspaceSet: {
        url: workspaceURL,
      },
      defaultWebsite: {
        ...(await filterPrivate({client, user})),
      },
      AND: [{OR: [{archived: false}, {archived: null}]}],
    },
    select: {
      name: true,
      defaultWebsite: {
        slug: true,
      },
      languageList: {
        where: {
          ...(locale
            ? {
                language: {
                  code: locale,
                  isAvailableOnPortal: true,
                },
              }
            : {}),
          website: {
            ...(await filterPrivate({client, user})),
          },
        },
        select: {
          language: {code: true, isAvailableOnPortal: true, name: true},
          website: {
            slug: true,
          },
        },
      },
    },
  });

  return mainWebsites
    .map((mainWebsite): MainWebsiteResult | undefined => {
      const $website =
        mainWebsite?.languageList?.[0]?.website || mainWebsite?.defaultWebsite;

      if ($website) {
        ($website as MainWebsiteResult).name = mainWebsite.name;
      }

      return $website as MainWebsiteResult | undefined;
    })
    .filter(x => !!x);
}

export async function findAllWebsites({
  workspaceURL,
  user,
  client,
}: {
  workspaceURL: WorkspaceLight['url'];
  user?: User;
  client: Client;
}) {
  if (!(workspaceURL && client)) {
    return [];
  }

  const websites = await client.aOSPortalCmsSite.find({
    where: {
      mainWebsite: {
        workspaceSet: {
          url: workspaceURL,
        },
      },
      AND: [
        await filterPrivate({client, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      slug: true,
    },
  });

  return websites;
}

type MenuLineRecord = {
  id: string;
  parentMenu: {id: string; title: string | null} | null;
  page: {slug: string | null; url?: string; [key: string]: any} | null;
  subMenuList?: MenuLineRecord[];
  [key: string]: any;
};

async function buildMenuHierarchy(
  menulinesPromise: Promise<MenuLineRecord[]>,
): Promise<MenuLineRecord[]> {
  const menulines = await menulinesPromise;
  const map = new Map();

  menulines.forEach((item: MenuLineRecord) => {
    item.subMenuList = [];
    map.set(item.id, item);
  });

  // Link submenus to their parent
  menulines.forEach((item: MenuLineRecord) => {
    if (item.parentMenu && map.has(item.parentMenu.id)) {
      map.get(item.parentMenu.id).subMenuList!.push(item);
    }
  });

  // Filter top-level menu items (no parent)
  return menulines.filter(
    (item: MenuLineRecord): item is MenuLineRecord => !item.parentMenu,
  );
}

export async function findWebsiteSeoBySlug({
  websiteSlug,
  workspaceURL,
  user,
  client,
}: {
  websiteSlug: Website['slug'];
  workspaceURL: WorkspaceLight['url'];
  user?: User;
  client: Client;
}) {
  if (!(websiteSlug && workspaceURL && client)) {
    return null;
  }

  const website = await client.aOSPortalCmsSite.findOne({
    where: {
      slug: websiteSlug,
      mainWebsite: {workspaceSet: {url: workspaceURL}},
      AND: [
        await filterPrivate({client, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {name: true},
  });
  return website;
}

export async function findWebsiteBySlug({
  websiteSlug,
  workspaceURL,
  workspaceURI,
  user,
  client,
  config,
  mountTypes,
  path,
}: {
  websiteSlug: Website['slug'];
  workspaceURL: WorkspaceLight['url'];
  workspaceURI: string;
  user?: User;
  client: Client;
  config: TenantConfig;
  mountTypes?: LayoutMountType[];
  /** @param mounTypes should be an array of single mountType for path to work
   * ex: mountTypes:[ "header" ]
   * ex: path:[ "team1Reviews", "1", "attrs", "image" ]
   **/
  path?: string[];
}) {
  if (!(websiteSlug && client)) {
    return null;
  }

  const includeHeader = mountTypes?.includes(MOUNT_TYPE.HEADER);
  const includeFooter = mountTypes?.includes(MOUNT_TYPE.FOOTER);
  const includeMenu = mountTypes?.includes(MOUNT_TYPE.MENU);

  const website = await client.aOSPortalCmsSite.findOne({
    where: {
      slug: websiteSlug,
      mainWebsite: {workspaceSet: {url: workspaceURL}},
      AND: [
        await filterPrivate({client, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      name: true,
      slug: true,
      isGuestUserAllow: true,
      homepage: {slug: true},
      mainWebsite: {name: true},
      ...(includeHeader && {
        header: {attrs: true, component: {title: true, code: true}},
      }),
      ...(includeFooter && {
        footer: {attrs: true, component: {title: true, code: true}},
      }),
      ...(includeMenu && {
        menu: {
          title: true,
          component: {title: true, code: true, typeSelect: true},
          language: {code: true, isAvailableOnPortal: true, name: true},
        },
      }),
    },
  });

  if (!website) return null;
  const isGuest = !user;

  if (isGuest && !website.isGuestUserAllow) {
    return null;
  }

  let menuListPromise;
  if (website.menu) {
    const menuList = client.aOSPortalCmsMenuLine
      .find({
        where: {
          menu: {
            id: website.menu.id,
          },
          page: {
            ...(await filterPrivate({client, user})),
          },
        },
        select: {
          parentMenu: {
            id: true,
            title: true,
          },
          page: {
            slug: true,
          },
        },
      })
      .then(lines => {
        return lines?.map(line => ({
          ...line,
          page: line?.page && {
            ...line?.page,
            url: `${workspaceURI}/${SUBAPP_CODES.website}/${websiteSlug}/${line?.page?.slug}`,
          },
        }));
      });

    menuListPromise = buildMenuHierarchy(menuList);
  }

  const jsonModelCache = new Cache();
  const jsonModelRecordCache = new Cache();
  const modelRecordCache = new Cache();
  const modelFieldCache = new Cache();
  let footerAttrsPromise;
  let headerAttrsPromise;

  if (website.footer?.attrs) {
    footerAttrsPromise = populateAttributes({
      attributes: await website.footer.attrs,
      modelName: CONTENT_MODEL,
      modelField: CONTENT_MODEL_ATTRS,
      client,
      config,
      path,
      modelFieldCache,
      modelRecordCache,
      jsonModelCache,
      jsonModelRecordCache,
    });
  }

  if (website.header?.attrs) {
    headerAttrsPromise = populateAttributes({
      attributes: await website.header.attrs,
      modelName: CONTENT_MODEL,
      modelField: CONTENT_MODEL_ATTRS,
      client,
      config,
      path,
      modelFieldCache,
      modelRecordCache,
      jsonModelCache,
      jsonModelRecordCache,
    });
  }
  const [menuList, footerAttrs, headerAttrs] = await Promise.all([
    menuListPromise,
    footerAttrsPromise,
    headerAttrsPromise,
  ]);

  return {
    ...website,
    ...(website.menu && {menu: {...website.menu, menuList}}),
    ...(website.footer && {footer: {...website.footer, attrs: footerAttrs}}),
    ...(website.header && {header: {...website.header, attrs: headerAttrs}}),
  };
}

export async function findAllWebsitePages({
  websiteSlug,
  workspaceURL,
  user,
  client,
}: {
  websiteSlug: Website['slug'];
  workspaceURL: WorkspaceLight['url'];
  user?: User;
  client: Client;
}) {
  if (!(websiteSlug && workspaceURL && client)) {
    return [];
  }

  const pages = await client.aOSPortalCmsPage.find({
    where: {
      website: {
        slug: websiteSlug,
      },
      AND: [
        await filterPrivate({client, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      slug: true,
    },
  });

  return pages;
}

export async function findWebsitePageSeoBySlug({
  websiteSlug,
  websitePageSlug,
  workspaceURL,
  user,
  client,
}: {
  websiteSlug: Website['slug'];
  websitePageSlug: WebsitePage['slug'];
  workspaceURL: WorkspaceLight['url'];
  user?: User;
  client: Client;
}) {
  if (!(websiteSlug && websitePageSlug && workspaceURL && client)) {
    return null;
  }

  const page = await client.aOSPortalCmsPage.findOne({
    where: {
      slug: websitePageSlug,
      statusSelect: '1',
      website: {
        slug: websiteSlug,
        mainWebsite: {
          workspaceSet: {
            url: workspaceURL,
          },
        },
      },
      AND: [
        await filterPrivate({client, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {seoTitle: true, seoDescription: true, seoKeyword: true},
  });
  return page;
}

export async function findWebsitePageBySlug({
  websiteSlug,
  websitePageSlug,
  workspaceURL,
  user,
  client,
  contentId,
}: {
  websiteSlug: Website['slug'];
  websitePageSlug: WebsitePage['slug'];
  workspaceURL: WorkspaceLight['url'];
  user?: User;
  client: Client;
  contentId?: string;
}) {
  if (!(websiteSlug && websitePageSlug && workspaceURL && client)) {
    return null;
  }

  const page = await client.aOSPortalCmsPage.findOne({
    where: {
      slug: websitePageSlug,
      statusSelect: '1',
      website: {
        slug: websiteSlug,
        mainWebsite: {
          workspaceSet: {
            url: workspaceURL,
          },
        },
      },
      ...(contentId && {contentLines: {content: {id: contentId}}}),
      AND: [
        await filterPrivate({client, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      isWiki: true,
      title: true,
      contentLines: {
        ...(contentId && {where: {content: {id: contentId}}}),
        select: {
          sequence: true,
          content: {
            title: true,
            component: {title: true, code: true},
            attrs: true,
          },
        },
        orderBy: {sequence: 'ASC'},
      },
    },
  });

  if (!page) return null;
  return page;
}

export async function findAllMainWebsiteLanguages({
  mainWebsiteId,
  workspaceURL,
  user,
  client,
}: {
  mainWebsiteId: MainWebsite['id'] | undefined;
  workspaceURL: WorkspaceLight['url'];
  user?: User;
  client: Client;
}) {
  if (!(mainWebsiteId && workspaceURL && client)) {
    return [];
  }

  const mainWebsiteLanguages = await client.aOSPortalCmsMainWebsite
    .findOne({
      where: {
        id: mainWebsiteId,
        workspaceSet: {
          url: workspaceURL,
        },
        AND: [{OR: [{archived: false}, {archived: null}]}],
      },
      select: {
        languageList: {
          where: {
            website: {
              ...(await filterPrivate({client, user})),
            },
          },
          select: {
            language: {code: true, isAvailableOnPortal: true, name: true},
            website: {
              slug: true,
            },
          },
        },
      },
    })
    .then(clone);

  return mainWebsiteLanguages?.languageList;
}

async function getRelationalFieldTypeData({
  field,
  value,
  modelRecordCache,
  client,
  config,
}: {
  field: {targetModel?: string};
  value: any;
  modelRecordCache: Cache;
  client: Client;
  config: TenantConfig;
}) {
  const targetModel = field?.targetModel;

  if (!targetModel) {
    return value;
  }

  const isManyToOneRelation = value?.id;

  const isToManyRelation = Array.isArray(value);

  if (isToManyRelation || isManyToOneRelation) {
    const ids = isManyToOneRelation
      ? [value.id]
      : isToManyRelation
        ? value.map(({id}) => id)
        : [];

    if (!ids.length) return value;

    const cachedRecords = ids
      .map(id => modelRecordCache.get(`${targetModel}-${id}`))
      .filter(Boolean);

    const cachedIds = cachedRecords.map(r => r.id);

    const difference = (arr1: any, arr2: any) =>
      arr1.filter((item: any) => !arr2.includes(item));

    const uncachedIds = difference(ids, cachedIds);

    let records = await findModelRecords({
      client,
      config,
      modelName: targetModel,
      ids: uncachedIds,
    });

    if (records?.length) {
      records.forEach((record: any) => {
        modelRecordCache.set(`${targetModel}-${record.id}`, record);
      });
    }

    records = [...cachedRecords, ...records];

    if (isManyToOneRelation) {
      return records?.[0];
    }

    if (isToManyRelation) {
      return value.map(
        item => records.find((r: any) => r.id == item.id) || item,
      );
    }
  } else {
    return value;
  }
}

async function getCustomRelationalFieldTypeData({
  field,
  value,
  modelFieldCache,
  modelRecordCache,
  jsonModelCache,
  jsonModelRecordCache,
  client,
  config,
  path,
}: {
  field: {targetJsonModel?: {name?: string}};
  value: any;
  modelFieldCache: Cache;
  modelRecordCache: Cache;
  jsonModelCache: Cache;
  jsonModelRecordCache: Cache;
  client: Client;
  config: TenantConfig;
  path?: string[];
}) {
  const pathFieldName = path?.[0];
  const targetJsonModelName = field?.targetJsonModel?.name;

  if (!targetJsonModelName) {
    return value;
  }

  const isToOneRelation = value?.id;

  const isToManyRelation = Array.isArray(value);

  let targetJsonModel = jsonModelCache.get(targetJsonModelName);

  if (!targetJsonModel) {
    const $targetJsonModel = await client.aOSMetaJsonModel.findOne({
      where: {
        name: targetJsonModelName,
      },
      select: {id: true},
    });

    if (!$targetJsonModel) {
      return value;
    }

    jsonModelCache.set(targetJsonModelName, $targetJsonModel);
    targetJsonModel = $targetJsonModel;
  }

  if (isToManyRelation || isToOneRelation) {
    const ids = isToOneRelation
      ? [value.id]
      : isToManyRelation
        ? value
            .map(({id}) => id)
            .filter((_id, i) =>
              pathFieldName ? i === Number(pathFieldName) : true,
            ) // for toMany relation, pathFieldName is index of the array, so we skip getting value for other indices
        : [];

    if (!ids.length) return value;

    const cachedRecords = ids
      .map(id => jsonModelRecordCache.get(`${targetJsonModelName}-${id}`))
      .filter(Boolean);

    const cachedIds = cachedRecords.map(r => r.id);

    const difference = (arr1: any, arr2: any) =>
      arr1.filter((item: any) => !arr2.includes(item));

    const uncachedIds = difference(ids, cachedIds);

    let records = await client.aOSMetaJsonRecord
      .find({
        where: {
          jsonModel: targetJsonModelName,
          id: {in: uncachedIds},
        },
        select: {
          name: true,
          jsonModel: true,
          createdOn: true,
          updatedOn: true,
          attrs: true,
        },
      })
      .then(records =>
        Promise.all(
          records.map(async r => {
            const attrs = await r.attrs;
            return {
              ...r,
              attrs: await populateAttributes({
                attributes: attrs,
                modelField: JSON_MODEL_ATTRS,
                jsonModelName: targetJsonModelName,
                client,
                config,
                modelFieldCache,
                modelRecordCache,
                jsonModelCache,
                jsonModelRecordCache,
                path: pathFieldName
                  ? isToManyRelation
                    ? path.slice(2) // [0 , attrs, image] , we are at index part if toMany, so we skip index, and attrs
                    : path.slice(1) // [attrs, image] , we skip attrs
                  : undefined,
              }),
            };
          }),
        ),
      );

    if (records?.length) {
      records.forEach((record: any) => {
        modelRecordCache.set(`${targetJsonModelName}-${record.id}`, record);
      });
    }

    records = [...cachedRecords, ...records];

    if (isToOneRelation) {
      return records?.[0];
    }

    if (isToManyRelation) {
      return value.map(
        item => records.find((r: any) => r.id == item.id) || item,
      );
    }
  } else {
    return value;
  }
}

export type ContentLine = {
  id: string;
  version: number;
  sequence: number | null;
  content: {
    id: string;
    version: number;
    title: string | null;
    attrs: any | null;
    component: {
      id: string;
      version: number;
      title: string | null;
      code: string | null;
    } | null;
  } | null;
};

export type ReplacedContentLine = {
  id: string;
  version: number;
  sequence: number | null;
  content: {
    attrs: Record<string, any> | null;
    id: string;
    version: number;
    title: string | null;
    component: {
      id: string;
      version: number;
      title: string | null;
      code: string | null;
    } | null;
  } | null;
};

const getModelFields = async ({
  modelName,
  jsonModelName,
  modelField,
  modelFieldCache,
  fieldName,
  client,
}: {
  fieldName?: string;
  modelName?: string;
  jsonModelName?: string;
  modelField: string;
  modelFieldCache: Cache;
  client: Client;
}) => {
  const cacheKey = `${modelName || jsonModelName}-${modelField}-${fieldName || ''}`;
  if (modelFieldCache.has(cacheKey)) {
    return modelFieldCache.get(cacheKey);
  }

  const fields = await findModelFields({
    client,
    jsonModelName,
    modelName,
    modelField,
    fieldName,
  });

  modelFieldCache.set(cacheKey, fields);
  return fields;
};

const populateAttributes = async ({
  attributes,
  modelName,
  jsonModelName,
  modelField,
  client,
  config,
  modelFieldCache,
  modelRecordCache,
  jsonModelCache,
  jsonModelRecordCache,
  path,
}: {
  attributes: JsonObject | null;
  modelName?: string;
  jsonModelName?: string;
  modelField: string;
  client: Client;
  config: TenantConfig;
  modelFieldCache: Cache;
  modelRecordCache: Cache;
  jsonModelCache: Cache;
  jsonModelRecordCache: Cache;
  path?: string[];
}): Promise<Record<string, any>> => {
  if (!attributes) return {};
  const pathFieldName = path?.[0];
  const fieldNames = pathFieldName ? [pathFieldName] : Object.keys(attributes);

  const data: Record<string, any> = {};

  for (const fieldName of fieldNames) {
    const value = attributes[fieldName];

    const isPrimitiveType = typeof value !== 'object';

    if (isPrimitiveType) {
      data[fieldName] = value;
      continue;
    }

    const fields = await getModelFields({
      modelName,
      jsonModelName,
      modelField,
      modelFieldCache,
      client,
      fieldName: pathFieldName,
    });

    const field = fields.find((field: any) => field.name === fieldName);

    if (!field?.type) {
      data[fieldName] = value;
      continue;
    }

    const type = field.type;
    const isRelationalField = RelationalFieldTypes.includes(type);
    const isCustomRelationalField = JsonRelationalFieldTypes.includes(type);

    let handler;

    if (isRelationalField) {
      handler = getRelationalFieldTypeData;
    } else if (isCustomRelationalField) {
      handler = getCustomRelationalFieldTypeData;
    }

    if (!handler) {
      data[fieldName] = value;
      continue;
    }

    const $value = await handler({
      field,
      value,
      modelFieldCache,
      modelRecordCache,
      jsonModelCache,
      jsonModelRecordCache,
      client,
      config,
      path: path?.[1] ? path.slice(1) : undefined,
    });

    data[fieldName] = $value;
  }

  return data;
};

export async function populateContent({
  line,
  path,
  client,
  config,
  modelFieldCache = new Cache(),
  modelRecordCache = new Cache(),
  jsonModelCache = new Cache(),
  jsonModelRecordCache = new Cache(),
}: {
  line: ContentLine;
  /*
   * ex: path:[ "team1Reviews", "1", "attrs", "image" ]
   */
  path?: string[];
  client: Client;
  config: TenantConfig;
  modelFieldCache?: Cache;
  modelRecordCache?: Cache;
  jsonModelCache?: Cache;
  jsonModelRecordCache?: Cache;
}): Promise<ReplacedContentLine> {
  if (!line.content) return line;
  const attrs = await line.content?.attrs;
  return {
    ...line,
    content: {
      ...line.content,
      attrs: await populateAttributes({
        attributes: attrs,
        modelName: CONTENT_MODEL,
        modelField: CONTENT_MODEL_ATTRS,
        client,
        config,
        modelFieldCache,
        modelRecordCache,
        jsonModelCache,
        jsonModelRecordCache,
        path: path,
      }),
    },
  };
}

export function populateLinesByChunk({
  contentLines,
  client,
  config,
  path,
  chunkSize,
}: {
  /*
   * ex: path:[ "team1Reviews", "1", "attrs", "image" ]
   */
  path?: string[];
  chunkSize?: number;
  contentLines: ContentLine[];
  client: Client;
  config: TenantConfig;
}): Promise<ReplacedContentLine[]>[] {
  const jsonModelCache = new Cache();
  const jsonModelRecordCache = new Cache();
  const modelRecordCache = new Cache();
  const modelFieldCache = new Cache();

  const chunkedContentLines = chunkSize
    ? chunkArray(contentLines, chunkSize)
    : [contentLines];

  const promises: Promise<ReplacedContentLine[]>[] = [];
  let previousPromise: Promise<any> = Promise.resolve();

  for (const chunk of chunkedContentLines) {
    const currentPromise = previousPromise.then(async () => {
      const populatedContentLines = await Promise.allSettled(
        chunk.map(line =>
          populateContent({
            line,
            client,
            config,
            path,
            modelFieldCache,
            modelRecordCache,
            jsonModelCache,
            jsonModelRecordCache,
          }),
        ),
      ).then(
        results =>
          results
            .map(result =>
              result.status === 'fulfilled' ? result.value : undefined,
            )
            .filter(Boolean) as ReplacedContentLine[],
      );

      return populatedContentLines;
    });

    promises.push(currentPromise);
    previousPromise = currentPromise; // chain for next chunk
  }

  return promises;
}

async function findModelRecords({
  client,
  config,
  modelName,
  ids,
}: {
  client: Client;
  config: TenantConfig;
  modelName: string;
  ids: string[];
}) {
  const metaModel = metaModels[modelName];
  const entity = metaModel?.entity;
  if (entity) {
    // @ts-expect-error  it's dynamic so no issues
    const records = await client[entity].find({
      where: {id: {in: ids}},
      select: metaModel.select,
    });
    return records;
  }

  const aos = config?.aos;

  if (!aos?.url) return [];

  return aosClient(aos)
    .search(modelName, {
      data: {_domain: 'self.id in :ids', _domainContext: {ids}},
    })
    .then(({records}) => records)
    .catch(() => {
      console.log('Error with trying to fetch model fields');
      return [];
    });
}

export async function canEditWiki({
  userId,
  client,
}: {
  userId: Maybe<ID>;
  client: Client;
}) {
  if (!userId) return false;
  const user = await client.aOSPartner.findOne({
    where: {id: userId},
    select: {canEditWiki: true},
  });

  return !!user?.canEditWiki;
}
