import axios from 'axios';

// ---- CORE IMPORTS ---- //
import {filterPrivate} from '@/orm/filter';
import {manager, type Tenant} from '@/tenant';
import type {
  ID,
  MainWebsite,
  PortalWorkspace,
  User,
  Website,
  WebsitePage,
} from '@/types';
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
import {LayoutMountType, MenuItem} from '../types';
import {Cache} from '../utils/helper';
import {metaModels} from '../templates/meta-models';
import {Maybe} from '@/types/util';

export async function findAllMainWebsites({
  workspaceURL,
  user,
  tenantId,
  locale,
}: {
  workspaceURL: PortalWorkspace['url'];
  user?: User;
  tenantId: Tenant['id'];
  locale?: string;
}) {
  if (!(workspaceURL && tenantId)) {
    return [];
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
    return [];
  }

  const mainWebsites = await client.aOSPortalCmsMainWebsite.find({
    where: {
      workspaceSet: {
        url: workspaceURL,
      },
      defaultWebsite: {
        ...(await filterPrivate({tenantId, user})),
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
            ...(await filterPrivate({tenantId, user})),
          },
        },
        select: {
          language: true,
          website: {
            slug: true,
          },
        },
      },
    },
  });

  return mainWebsites
    .map((mainWebsite: any) => {
      let $website =
        mainWebsite?.languageList?.[0]?.website || mainWebsite?.defaultWebsite;

      if ($website) {
        $website.name = mainWebsite.name;
      }

      return $website;
    })
    .filter(Boolean);
}

export async function findAllWebsites({
  workspaceURL,
  user,
  tenantId,
}: {
  workspaceURL: PortalWorkspace['url'];
  user?: User;
  tenantId: Tenant['id'];
}) {
  if (!(workspaceURL && tenantId)) {
    return [];
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
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
        await filterPrivate({tenantId, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      slug: true,
    },
  });

  return websites;
}

async function buildMenuHierarchy(
  menulinesPromise: Promise<any>,
): Promise<MenuItem[]> {
  const menulines = await menulinesPromise;
  const map = new Map();

  menulines.forEach((item: any) => {
    item.subMenuList = [];
    map.set(item.id, item);
  });

  // Link submenus to their parent
  menulines.forEach((item: any) => {
    if (item.parentMenu && map.has(item.parentMenu.id)) {
      map.get(item.parentMenu.id).subMenuList.push(item);
    }
  });

  // Filter top-level menu items (no parent)
  return menulines.filter((item: any) => !item.parentMenu);
}

export async function findWebsiteBySlug({
  websiteSlug,
  workspaceURL,
  user,
  tenantId,
  mountTypes,
  path,
}: {
  websiteSlug: Website['slug'];
  workspaceURL: PortalWorkspace['url'];
  user?: User;
  tenantId: Tenant['id'];
  mountTypes?: LayoutMountType[];
  /** @param mounTypes should be an array of single mountType for path to work
   * ex: mountTypes:[ "header" ]
   * ex: path:[ "team1Reviews", "1", "attrs", "image" ]
   **/
  path?: string[];
}) {
  if (!(websiteSlug && tenantId)) {
    return null;
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
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
        await filterPrivate({tenantId, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      name: true,
      slug: true,
      isGuestUserAllow: true,
      homepage: {slug: true},
      mainWebsite: true,
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
          language: true,
          menuList: true,
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
            ...(await filterPrivate({tenantId, user})),
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
      .then(lines =>
        lines?.map(line => ({
          ...line,
          page: line?.page && {
            ...line?.page,
            url: `${workspaceURL}/${SUBAPP_CODES.website}/${websiteSlug}/${line?.page?.slug}`,
          },
        })),
      );

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
      tenantId,
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
      tenantId,
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
  tenantId,
}: {
  websiteSlug: Website['slug'];
  workspaceURL: PortalWorkspace['url'];
  user?: User;
  tenantId: Tenant['id'];
}) {
  if (!(websiteSlug && workspaceURL && tenantId)) {
    return [];
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
    return [];
  }

  const pages = await client.aOSPortalCmsPage.find({
    where: {
      website: {
        slug: websiteSlug,
      },
      AND: [
        await filterPrivate({tenantId, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      slug: true,
    },
  });

  return pages;
}

export async function findWebsitePageBySlug({
  websiteSlug,
  websitePageSlug,
  workspaceURL,
  user,
  tenantId,
  contentId,
  path,
}: {
  websiteSlug: Website['slug'];
  websitePageSlug: WebsitePage['slug'];
  workspaceURL: PortalWorkspace['url'];
  user?: User;
  tenantId: Tenant['id'];
  contentId?: string;
  /** @param contentId is required if path is provide
   * ex: path:[ "team1Reviews", "1", "attrs", "image" ]
   **/
  path?: string[];
}) {
  if (!(websiteSlug && websitePageSlug && workspaceURL && tenantId)) {
    return null;
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
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
        await filterPrivate({tenantId, user}),
        {OR: [{archived: false}, {archived: null}]},
      ],
    },
    select: {
      isWiki: true,
      title: true,
      seoTitle: true,
      seoDescription: true,
      seoKeyword: true,
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
      } as {
        select: {
          sequence: true;
          content: {
            title: true;
            component: {title: true; code: true};
            attrs: true;
          };
        };
      },
    },
  });

  if (!page) return null;
  let contentLines: (ReplacedContentLine | undefined)[] = [];

  if (page.contentLines?.length) {
    contentLines = await populateContent({
      contentLines: page?.contentLines,
      tenantId,
      path,
    });
  }

  return {
    ...page,
    contentLines,
  };
}

export async function findAllMainWebsiteLanguages({
  mainWebsiteId,
  workspaceURL,
  user,
  tenantId,
}: {
  mainWebsiteId: MainWebsite['id'] | undefined;
  workspaceURL: PortalWorkspace['url'];
  user?: User;
  tenantId: Tenant['id'];
}) {
  if (!(mainWebsiteId && workspaceURL && tenantId)) {
    return [];
  }

  const client = await manager.getClient(tenantId);

  if (!client) {
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
              ...(await filterPrivate({tenantId, user})),
            },
          },
          select: {
            language: true,
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
  tenantId,
}: any) {
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
      tenantId,
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
  fields,
  modelFieldCache,
  modelRecordCache,
  jsonModelCache,
  jsonModelRecordCache,
  tenantId,
  path,
}: any) {
  const pathFieldName = path?.[0];
  const targetJsonModelName = field?.targetJsonModel?.name;

  if (!targetJsonModelName) {
    return value;
  }

  const isToOneRelation = value?.id;

  const isToManyRelation = Array.isArray(value);

  const client = await manager.getClient(tenantId);

  let targetJsonModel = jsonModelCache.get(targetJsonModelName);

  if (!targetJsonModel) {
    const $targetJsonModel = await client.aOSMetaJsonModel.findOne({
      where: {
        name: targetJsonModelName,
      },
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
            .filter((id, i) =>
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
                tenantId,
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

type ContentLine = {
  id: string;
  version: number;
  sequence?: number;
  content?: {
    id: string;
    version: number;
    title?: string;
    attrs?: Promise<Record<string, any>>;
    component?: {
      id: string;
      version: number;
      title?: string;
      code?: string;
    };
  };
};

type ReplacedContentLine = {
  id: string;
  version: number;
  sequence?: number;
  content?: {
    attrs?: Record<string, any>;
    id: string;
    version: number;
    title?: string;
    component?: {
      id: string;
      version: number;
      title?: string;
      code?: string;
    };
  };
};

const getModelFields = async ({
  modelName,
  jsonModelName,
  modelField,
  modelFieldCache,
  fieldName,
  tenantId,
}: {
  fieldName?: string;
  modelName?: string;
  jsonModelName?: string;
  modelField: string;
  modelFieldCache: Cache;
  tenantId: Tenant['id'];
}) => {
  const cacheKey = `${modelName || jsonModelName}-${modelField}-${fieldName || ''}`;
  if (modelFieldCache.has(cacheKey)) {
    return modelFieldCache.get(cacheKey);
  }

  const fields = await findModelFields({
    tenantId,
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
  tenantId,
  modelFieldCache,
  modelRecordCache,
  jsonModelCache,
  jsonModelRecordCache,
  path,
}: {
  attributes: Record<string, any> | undefined;
  modelName?: string;
  jsonModelName?: string;
  modelField: string;
  tenantId: Tenant['id'];
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

    const isPrimitiveType = typeof value !== 'object' && value !== null;

    if (isPrimitiveType) {
      data[fieldName] = value;
      continue;
    }

    const fields = await getModelFields({
      modelName,
      jsonModelName,
      modelField,
      modelFieldCache,
      tenantId,
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
      fields,
      modelFieldCache,
      modelRecordCache,
      jsonModelCache,
      jsonModelRecordCache,
      tenantId,
      path: path?.[1] ? path.slice(1) : undefined,
    });

    data[fieldName] = $value;
  }

  return data;
};

async function populateContent({
  contentLines,
  tenantId,
  path,
}: {
  path?: string[];
  contentLines: ContentLine[];
  tenantId: Tenant['id'];
}): Promise<(ReplacedContentLine | undefined)[]> {
  const jsonModelCache = new Cache();
  const jsonModelRecordCache = new Cache();
  const modelRecordCache = new Cache();
  const modelFieldCache = new Cache();

  const populatedContentLines = await Promise.allSettled(
    contentLines.map(async line => {
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
            tenantId,
            modelFieldCache,
            modelRecordCache,
            jsonModelCache,
            jsonModelRecordCache,
            path: path,
          }),
        },
      };
    }),
  ).then(results =>
    results.map((result, i) =>
      result.status === 'fulfilled' ? result.value : undefined,
    ),
  );

  return populatedContentLines;
}

async function findModelRecords({
  tenantId,
  modelName,
  ids,
}: {
  tenantId: Tenant['id'];
  modelName: string;
  ids: string[];
}) {
  const metaModel = metaModels[modelName];
  const entity = metaModel?.entity;
  if (entity) {
    const client = await manager.getClient(tenantId);
    // @ts-expect-error  it's dynamic so no issues
    const records = await client[entity].find({
      where: {id: {in: ids}},
      select: metaModel.select,
    });
    return records;
  }

  const tenant = await manager.getTenant(tenantId);
  const aos = tenant?.config?.aos;

  if (!aos?.url) return [];
  const res = await axios
    .post(
      `${aos.url}/ws/rest/${modelName}/search`,
      {
        data: {
          _domain: 'self.id in :ids',
          _domainContext: {ids},
        },
      },
      {auth: aos.auth},
    )
    .then(res => res?.data)
    .catch(() => console.log('Error with trying to fetch model fields'));

  if (res?.status !== 0 || !res.data) {
    return [];
  }

  return res.data;
}

export async function canEditWiki({
  userId,
  tenantId,
}: {
  userId: Maybe<ID>;
  tenantId: Tenant['id'];
}) {
  const client = await manager.getClient(tenantId);
  if (!userId) return false;
  const user = await client.aOSPartner.findOne({
    where: {id: userId},
    select: {canEditWiki: true},
  });

  return !!user?.canEditWiki;
}
