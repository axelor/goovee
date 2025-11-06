// ---- CORE IMPORTS ---- //
import {manager, type Tenant} from '@/tenant';
import {clone, getPageInfo, getSkipInfo} from '@/utils';
import type {PortalWorkspace, User} from '@/types';
import {ORDER_BY} from '@/constants';
import {filterPrivate} from '@/orm/filter';

// ---- LOCAL IMPORTS ---- //
import {
  ASIDE_NEWS_LIMIT,
  DEFAULT_NEWS_ASIDE_LIMIT,
  DEFAULT_PAGE,
  FOOTER_NEWS_LIMIT,
  HEADER_NEWS_LIMIT,
  NEWS_FEED_LIMIT,
} from '@/subapps/news/common/constants';
import {getArchivedFilter} from '@/subapps/news/common/utils';
import {NewsResponse} from '@/subapps/news/common/types';

const PAGE_LIMT = ASIDE_NEWS_LIMIT + FOOTER_NEWS_LIMIT + NEWS_FEED_LIMIT;

const EMPTY_NEWS_RESPONSE: NewsResponse = {
  news: [],
  pageInfo: {
    page: 1,
    count: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  },
};

export async function findNonArchivedNewsCategories({
  workspace,
  user,
  tenantId,
}: {
  workspace: PortalWorkspace;
  user?: User;
  tenantId: Tenant['id'];
}) {
  if (!(workspace && tenantId)) return [];

  const client = await manager.getClient(tenantId);

  const categories = await client.aOSPortalNewsCategory
    .find({
      where: {
        workspace: {
          id: workspace.id,
        },

        ...(await filterPrivate({tenantId, user})),
      },
      select: {
        parentCategory: {
          id: true,
        },
        name: true,
        archived: true,
      },
    })
    .then(clone);

  const hiearchy = (categories: any) => {
    const map: any = {};
    categories?.forEach((category: any) => {
      category.children = [];
      map[category.id] = category;
    });

    categories?.forEach((category: any) => {
      const {parentCategory} = category;
      if (parentCategory?.id) {
        map[parentCategory.id]?.children.push(category);
      }
    });

    const _parent = (category: any, parents: any[] = []) => {
      if (!category._parent) {
        category._parent = [...parents];
      }

      category.children.forEach((child: any) => {
        _parent(child, [...parents, category.id]);
      });
    };

    Object.values(map).forEach(category => _parent(category));

    Object.values(map).forEach((category: any) => {
      if (category._parent?.length) {
        category._parentArchived = category._parent.some(
          (p: any) => map[p]?.archived,
        );
      }
    });

    return Object.keys(map)
      .filter(key => {
        const category = map[key];
        const archived = category.archived || category._parentArchived;

        return !archived;
      })
      .map(id => map[id]);
  };

  const _categories: any = hiearchy(categories);

  return _categories;
}

export async function findNews({
  id = '',
  orderBy,
  isFeaturedNews = false,
  page = DEFAULT_PAGE,
  limit,
  slug = null,
  workspace,
  categoryIds = [],
  tenantId,
  user,
  archived = false,
  params,
  skip,
}: {
  id?: string | number;
  orderBy?: any;
  isFeaturedNews?: boolean;
  page?: string | number;
  limit?: number;
  slug?: string | null;
  workspace: any;
  categoryIds?: any[];
  tenantId: Tenant['id'];
  user?: User;
  archived?: boolean;
  params?: any;
  skip?: number;
}) {
  if (!(workspace && tenantId)) {
    return EMPTY_NEWS_RESPONSE;
  }

  const client = await manager.getClient(tenantId);
  if (!client) {
    return EMPTY_NEWS_RESPONSE;
  }

  const nonarchivedcategory = await findNonArchivedNewsCategories({
    tenantId: tenantId,
    workspace: workspace,
    user: user,
  });

  const nonarchivedcategoryids = nonarchivedcategory?.map((c: any) => c.id);
  let categoryIdsFilteredByArchive = nonarchivedcategoryids;

  if (categoryIds?.length) {
    categoryIdsFilteredByArchive = categoryIds
      .map(id => String(id))
      .filter((id: any) => nonarchivedcategoryids.includes(id));
  }

  const $skip = skip ? skip : getSkipInfo(limit, page);

  const whereClause = {
    ...(id
      ? {
          id,
        }
      : {}),
    ...(isFeaturedNews ? {isFeaturedNews: true} : {}),
    ...(slug ? {slug} : {}),
    categorySet: {
      workspace: {
        id: workspace.id,
      },
      ...(categoryIdsFilteredByArchive?.length
        ? {
            id: {
              in: categoryIdsFilteredByArchive,
            },
          }
        : {}),
    },
    ...(params?.where || {}),
    AND: [
      await filterPrivate({user, tenantId}),
      getArchivedFilter({archived}),
      ...(params?.where?.AND || []),
    ],
  };

  const news = await client.aOSPortalNews
    .find({
      where: whereClause,
      ...(orderBy ? {orderBy} : {}),
      take: limit,
      ...($skip ? {skip: $skip} : {}),
      select: {
        title: true,
        publicationDateTime: true,
        image: {id: true, fileName: true},
        categorySet: {
          where: {
            ...(nonarchivedcategoryids?.length
              ? {
                  id: {
                    in: nonarchivedcategoryids,
                  },
                }
              : {}),
          },
          select: {
            id: true,
            name: true,
            color: true,
            parentCategory: {
              id: true,
              name: true,
              color: true,
              parentCategory: {
                name: true,
                color: true,
              },
            },
          },
        },
        slug: true,
        ...params?.select,
      },
    })
    .catch(() => []);

  const pageInfo = getPageInfo({
    count: news?.[0]?._count,
    page,
    limit,
  });
  return {news, pageInfo};
}

export async function findNewsImageBySlug({
  slug,
  workspace,
  tenantId,
  user,
  archived = false,
  isFullView = false,
}: {
  slug: string;
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
  archived?: boolean;
  isFullView?: boolean;
}): Promise<string | undefined> {
  if (!tenantId || !workspace) return;

  const client = await manager.getClient(tenantId);
  const archivedFilter = getArchivedFilter({archived});

  const news = await client.aOSPortalNews.findOne({
    where: {
      slug,
      categorySet: {workspace: {id: workspace.id}},
      AND: [await filterPrivate({user, tenantId}), archivedFilter],
    },
    select: {image: {id: true}, thumbnailImage: {id: true}},
  });

  if (isFullView) {
    return news?.image?.id;
  }
  return news?.thumbnailImage?.id || news?.image?.id;
}

export async function findCategoryImageBySlug({
  slug,
  workspace,
  tenantId,
  user,
}: {
  slug: string;
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
}): Promise<string | undefined> {
  if (!tenantId || !workspace) return;

  const c = await manager.getClient(tenantId);

  const news = await c.aOSPortalNewsCategory.findOne({
    where: {
      slug,
      workspace: {id: workspace.id},
      ...(await filterPrivate({user, tenantId})),
    },
    select: {
      image: {id: true},
      thumbnailImage: {id: true},
    },
  });

  return news?.thumbnailImage?.id || news?.image?.id;
}

export async function isAttachmentOfNews({
  slug,
  fileId,
  workspace,
  tenantId,
  user,
}: {
  slug: string;
  fileId: string;
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
}): Promise<boolean> {
  if (!tenantId || !workspace) return false;

  const client = await manager.getClient(tenantId);

  const news = await client.aOSPortalNews.findOne({
    where: {
      slug,
      attachmentList: {metaFile: {id: fileId}},
      categorySet: {workspace: {id: workspace.id}},
      ...(await filterPrivate({user, tenantId})),
    },
    select: {id: true},
  });

  return Boolean(news);
}

export async function findCategories({
  category = null,
  showAllCategories = false,
  slug = null,
  workspace,
  tenantId,
  user,
  archived = false,
}: {
  category?: any;
  showAllCategories?: boolean;
  slug?: string | null;
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
  archived?: boolean;
}) {
  if (!(workspace && tenantId)) return [];

  const c = await manager.getClient(tenantId);
  const archivedFilter = getArchivedFilter({archived});

  const categories = await c.aOSPortalNewsCategory.find({
    where: {
      workspace: {
        id: workspace.id,
      },
      AND: [await filterPrivate({user, tenantId}), archivedFilter],
      ...(category
        ? {
            parentCategory: {
              name: {like: `%${category}%`},
            },
          }
        : {
            ...(showAllCategories
              ? {}
              : {
                  parentCategory: {
                    id: {
                      eq: null,
                    },
                  },
                }),
          }),
      ...(slug
        ? {
            parentCategory: {
              slug,
            },
          }
        : {}),
    },
    select: {
      name: true,
      image: {id: true},
      parentCategory: {id: true},
      slug: true,
      workspace: {id: true, name: true, url: true},
    },
  });
  return categories;
}

export async function findCategoryTitleBySlugName({
  slug,
  workspace,
  tenantId,
  archived = false,
  user,
}: {
  slug: any;
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  archived?: boolean;
  user?: User;
}) {
  if (!tenantId) {
    return null;
  }

  const c = await manager.getClient(tenantId);
  const archivedFilter = getArchivedFilter({archived});

  const title = await c.aOSPortalNewsCategory.findOne({
    where: {
      slug,
      workspace: {
        id: workspace.id,
      },
      AND: [await filterPrivate({user, tenantId}), archivedFilter],
    },
    select: {
      name: true,
    },
  });

  return title?.name;
}

export async function findNewsByCategory({
  orderBy,
  page,
  limit,
  slug,
  workspace,
  isFeaturedNews,
  tenantId,
  user,
  params,
  skip,
}: {
  orderBy?: any;
  isFeaturedNews?: boolean;
  page?: string | number;
  limit?: number;
  slug?: string;
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
  params?: any;
  skip?: number;
}) {
  if (!tenantId) return EMPTY_NEWS_RESPONSE;

  const categories = await findCategories({
    showAllCategories: true,
    workspace,
    tenantId,
    user,
  });

  const categoryMap = new Map(
    categories.map(category => [Number(category.id), category]),
  );

  const topCategory = categories.find(category => category.slug === slug);

  if (!topCategory) return EMPTY_NEWS_RESPONSE;

  const topCategoryId = Number(topCategory.id);

  const gatherCategoryIds = (categoryId: number): number[] => {
    const ids = [categoryId];

    for (const [id, cat] of categoryMap.entries()) {
      if (cat.parentCategory && Number(cat.parentCategory.id) === categoryId) {
        ids.push(...gatherCategoryIds(id));
      }
    }

    return ids;
  };

  const categoryIds: any = gatherCategoryIds(topCategoryId);

  return await findNews({
    orderBy,
    isFeaturedNews,
    page,
    limit,
    workspace,
    categoryIds,
    tenantId,
    user,
    params,
    skip,
  });
}

export async function findHomePageHeaderNews({
  workspace,
  tenant,
  user,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user?: User;
}) {
  const result = await findNews({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    tenantId: tenant,
    user,
    limit: HEADER_NEWS_LIMIT,
    params: {
      select: {
        description: true,
      },
    },
  }).then(clone);
  return result;
}

export async function findHomePageFeaturedNews({
  workspace,
  tenant,
  user,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user?: User;
}) {
  const result = await findNews({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    tenantId: tenant,
    user,
    limit: DEFAULT_NEWS_ASIDE_LIMIT,
    params: {
      where: {
        isFeaturedNews: true,
      },
    },
  }).then(clone);
  return result;
}

export async function findHomePageAsideNews({
  workspace,
  tenant,
  user,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user?: User;
}) {
  const result = await findNews({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    tenantId: tenant,
    user,
    limit: ASIDE_NEWS_LIMIT,
    skip: HEADER_NEWS_LIMIT,
  }).then(clone);
  return result;
}

export async function findHomePageFooterNews({
  workspace,
  tenant,
  user,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user?: User;
}) {
  const result = await findNews({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    tenantId: tenant,
    user,
    limit: FOOTER_NEWS_LIMIT,
    skip: HEADER_NEWS_LIMIT + ASIDE_NEWS_LIMIT,
  }).then(clone);
  return result;
}

export async function findCategoryPageHeaderNews({
  workspace,
  tenant,
  user,
  slug,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user?: User;
  slug: string;
}) {
  const result = await findNewsByCategory({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    tenantId: tenant,
    user,
    limit: HEADER_NEWS_LIMIT,
    slug,
  }).then(clone);

  return result;
}

export async function findCategoryPageFeaturedNews({
  workspace,
  tenant,
  user,
  slug,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user?: User;
  slug: string;
}) {
  const result = await findNewsByCategory({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    tenantId: tenant,
    user,
    limit: DEFAULT_NEWS_ASIDE_LIMIT,
    slug,
    params: {
      where: {
        isFeaturedNews: true,
      },
    },
  }).then(clone);

  return result;
}
export async function findCategoryAsideNews({
  workspace,
  tenant,
  user,
  slug,
  page = DEFAULT_PAGE,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user?: User;
  slug: string;
  page?: number;
}) {
  const skip =
    page === DEFAULT_PAGE
      ? HEADER_NEWS_LIMIT
      : HEADER_NEWS_LIMIT + PAGE_LIMT * (page - 1);

  const result = await findNewsByCategory({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    tenantId: tenant,
    user,
    limit: ASIDE_NEWS_LIMIT,
    skip,
    slug,
  }).then(clone);

  return result;
}

export async function findCategoryFooterNews({
  workspace,
  tenant,
  user,
  slug,
  page = DEFAULT_PAGE,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user?: User;
  slug: string;
  page?: number;
}) {
  const skip =
    page === DEFAULT_PAGE
      ? HEADER_NEWS_LIMIT + ASIDE_NEWS_LIMIT
      : HEADER_NEWS_LIMIT + PAGE_LIMT * (page - 1) + ASIDE_NEWS_LIMIT;

  const result = await findNewsByCategory({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    tenantId: tenant,
    user,
    limit: FOOTER_NEWS_LIMIT,
    skip,
    slug,
  }).then(clone);

  return result;
}

export async function findCategoryBottomFeedNews({
  workspace,
  tenant,
  user,
  slug,
  page = DEFAULT_PAGE,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user?: User;
  slug: string;
  page?: number;
}) {
  const skip =
    page === DEFAULT_PAGE
      ? HEADER_NEWS_LIMIT + ASIDE_NEWS_LIMIT + FOOTER_NEWS_LIMIT
      : HEADER_NEWS_LIMIT +
        ASIDE_NEWS_LIMIT +
        FOOTER_NEWS_LIMIT +
        PAGE_LIMT * (page - 1);

  const result = await findNewsByCategory({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    tenantId: tenant,
    user,
    limit: ASIDE_NEWS_LIMIT,
    skip,
    slug,
  }).then(clone);

  return result;
}

export async function findNewsCount({
  workspace,
  tenantId,
  user,
  slug,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
  slug?: string;
}) {
  if (!workspace || !tenantId) return null;

  const {news} =
    (await findNews({workspace, tenantId, user, slug, limit: 1})) ?? {};
  return news?.length ?? 0;
}

export async function findNewsAttachments({
  workspace,
  tenantId,
  user,
  slug,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
  slug?: string;
}) {
  if (!workspace || !tenantId) return null;

  const response = await findNews({
    workspace,
    tenantId,
    user,
    slug,
    params: {
      select: {
        attachmentList: {
          select: {
            title: true,
            metaFile: {
              id: true,
              fileName: true,
              fileSize: true,
              sizeText: true,
              fileType: true,
            },
          },
        },
      },
    },
  }).then(clone);

  const [{attachmentList = []} = {}] = response?.news ?? [];
  return attachmentList ?? [];
}

export async function findNewsRelatedNews({
  workspace,
  tenantId,
  user,
  slug,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
  slug?: string;
}) {
  if (!workspace || !tenantId) return null;

  const nonarchivedcategory = await findNonArchivedNewsCategories({
    tenantId: tenantId,
    workspace: workspace,
    user: user,
  });

  const nonarchivedcategoryids = nonarchivedcategory?.map((c: any) => c.id);

  const response = await findNews({
    workspace,
    tenantId,
    user,
    slug,
    params: {
      select: {
        relatedNewsSet: {
          take: DEFAULT_NEWS_ASIDE_LIMIT,
          orderBy: {
            publicationDateTime: ORDER_BY.DESC,
          },
          where: {
            categorySet: {
              workspace: {
                id: workspace.id,
              },
              ...(nonarchivedcategoryids?.length
                ? {
                    id: {
                      in: nonarchivedcategoryids,
                    },
                  }
                : {}),
            },
            AND: [
              await filterPrivate({user, tenantId}),
              getArchivedFilter({archived: false}),
            ],
          },
          select: {
            title: true,
            id: true,
            image: {id: true},
            categorySet: {
              where: {
                ...(nonarchivedcategoryids?.length
                  ? {
                      id: {
                        in: nonarchivedcategoryids,
                      },
                    }
                  : {}),
              },
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            publicationDateTime: true,
            slug: true,
          },
        },
      },
    },
  }).then(clone);

  const [{relatedNewsSet = []} = {}] = response?.news ?? [];
  return relatedNewsSet ?? [];
}

export async function findNewsByCategoryCount({
  workspace,
  tenantId,
  user,
  slug,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  user?: User;
  slug?: string;
}) {
  if (!workspace || !tenantId) return null;

  const {news} =
    (await findNewsByCategory({workspace, tenantId, user, slug, limit: 1})) ??
    {};

  return news?.length ?? 0;
}
