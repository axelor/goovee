// ---- CORE IMPORTS ---- //
import {cache} from 'react';
import type {Client} from '@/goovee/.generated/client';
import type {Cloned} from '@/types/util';
import {clone, getPageInfo} from '@/utils';
import {getSkip} from '@/utils/pagination';
import type {User} from '@/types';
import type {Workspace} from '@/orm/workspace';
import {ORDER_BY} from '@/constants';
import {filterPrivate} from '@/orm/filter';

type OrderBy = Record<string, string>;

type NewsQueryParams = {
  where?: Record<string, unknown> & {AND?: unknown[]};
  select?: Record<string, unknown>;
};

interface OrmCategoryEntry {
  id: string | number;
  name: string;
  archived?: boolean | null;
  parentCategory?: {id: string | number} | null;
}

interface CategoryNode extends OrmCategoryEntry {
  children: CategoryNode[];
  _parent?: Array<string | number>;
  _parentArchived?: boolean;
}

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
import type {
  NewsItem,
  NewsResponse,
  RawNewsCategory,
} from '@/subapps/news/common/types';

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

export const findNonArchivedNewsCategories = cache(
  async (workspaceId: string, user: User | undefined, client: Client) => {
    if (!workspaceId) return [];

    const categories = await client.aOSPortalNewsCategory
      .find({
        where: {
          workspace: {
            id: workspaceId,
          },

          ...filterPrivate({user}),
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

    const hiearchy = (categories: OrmCategoryEntry[]): CategoryNode[] => {
      const map: Record<string | number, CategoryNode> = {};
      categories?.forEach(category => {
        (category as CategoryNode).children = [];
        map[category.id] = category as CategoryNode;
      });

      categories?.forEach(category => {
        const {parentCategory} = category;
        if (parentCategory?.id) {
          map[parentCategory.id]?.children.push(map[category.id]);
        }
      });

      const _parent = (
        category: CategoryNode,
        parents: Array<string | number> = [],
      ) => {
        if (!category._parent) {
          category._parent = [...parents];
        }

        category.children.forEach(child => {
          _parent(child, [...parents, category.id]);
        });
      };

      Object.values(map).forEach(category => _parent(category));

      Object.values(map).forEach(category => {
        if (category._parent?.length) {
          category._parentArchived = category._parent.some(
            p => map[p]?.archived,
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

    const _categories: CategoryNode[] = hiearchy(
      categories as OrmCategoryEntry[],
    );

    return _categories;
  },
);

export async function findNews({
  id = '',
  orderBy,
  isFeaturedNews = false,
  page = DEFAULT_PAGE,
  limit,
  slug = null,
  workspace,
  categoryIds = [],
  client,
  user,
  archived = false,
  params,
  skip,
}: {
  id?: string | number;
  orderBy?: OrderBy;
  isFeaturedNews?: boolean;
  page?: string | number;
  limit?: number;
  slug?: string | null;
  workspace: Workspace | Cloned<Workspace>;
  categoryIds?: (string | number)[];
  client: Client;
  user?: User;
  archived?: boolean;
  params?: NewsQueryParams;
  skip?: number;
}): Promise<NewsResponse> {
  if (!workspace) {
    return EMPTY_NEWS_RESPONSE;
  }

  const nonarchivedcategory = await findNonArchivedNewsCategories(
    workspace.id,
    user,
    client,
  );

  const nonarchivedcategoryids = nonarchivedcategory?.map(c => c.id);
  let categoryIdsFilteredByArchive = nonarchivedcategoryids;

  if (categoryIds?.length) {
    categoryIdsFilteredByArchive = categoryIds
      .map(id => String(id))
      .filter(id => nonarchivedcategoryids?.includes(id));
  }

  const $skip = skip ? skip : limit ? getSkip(limit, page) : undefined;

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
      filterPrivate({user}),
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
  return {news: news as NewsItem[], pageInfo};
}

export async function findNewsImageBySlug({
  slug,
  workspace,
  client,
  user,
  archived = false,
  isFullView = false,
}: {
  slug: string;
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  archived?: boolean;
  isFullView?: boolean;
}): Promise<string | undefined> {
  if (!workspace) return;

  const archivedFilter = getArchivedFilter({archived});

  const news = await client.aOSPortalNews.findOne({
    where: {
      slug,
      categorySet: {workspace: {id: workspace.id}},
      AND: [filterPrivate({user}), archivedFilter],
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
  client,
  user,
}: {
  slug: string;
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
}): Promise<string | undefined> {
  if (!workspace) return;

  const news = await client.aOSPortalNewsCategory.findOne({
    where: {
      slug,
      workspace: {id: workspace.id},
      ...filterPrivate({user}),
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
  client,
  user,
}: {
  slug: string;
  fileId: string;
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
}): Promise<boolean> {
  if (!workspace) return false;

  const news = await client.aOSPortalNews.findOne({
    where: {
      slug,
      attachmentList: {metaFile: {id: fileId}},
      categorySet: {workspace: {id: workspace.id}},
      ...filterPrivate({user}),
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
  client,
  user,
  archived = false,
}: {
  category?: string | null;
  showAllCategories?: boolean;
  slug?: string | null;
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  archived?: boolean;
}): Promise<RawNewsCategory[]> {
  if (!workspace) return [];

  const archivedFilter = getArchivedFilter({archived});

  const categories = await client.aOSPortalNewsCategory.find({
    where: {
      workspace: {
        id: workspace.id,
      },
      AND: [filterPrivate({user}), archivedFilter],
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
  return categories as RawNewsCategory[];
}

export async function findCategoryTitleBySlugName({
  slug,
  workspace,
  client,
  archived = false,
  user,
}: {
  slug: string;
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  archived?: boolean;
  user?: User;
}) {
  const archivedFilter = getArchivedFilter({archived});

  const title = await client.aOSPortalNewsCategory.findOne({
    where: {
      slug,
      workspace: {
        id: workspace.id,
      },
      AND: [filterPrivate({user}), archivedFilter],
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
  client,
  user,
  params,
  skip,
}: {
  orderBy?: OrderBy;
  isFeaturedNews?: boolean;
  page?: string | number;
  limit?: number;
  slug?: string;
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  params?: NewsQueryParams;
  skip?: number;
}) {
  const categories = await findCategories({
    showAllCategories: true,
    workspace,
    client,
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

  const categoryIds: number[] = gatherCategoryIds(topCategoryId);

  return await findNews({
    orderBy,
    isFeaturedNews,
    page,
    limit,
    workspace,
    categoryIds,
    client,
    user,
    params,
    skip,
  });
}

export async function findHomePageHeaderNews({
  workspace,
  client,
  user,
  limit = HEADER_NEWS_LIMIT,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  limit?: number;
}) {
  const result = await findNews({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    client,
    user,
    limit,
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
  client,
  user,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
}) {
  const result = await findNews({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    client,
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
  client,
  user,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
}) {
  const result = await findNews({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    client,
    user,
    limit: ASIDE_NEWS_LIMIT,
    skip: HEADER_NEWS_LIMIT,
  }).then(clone);
  return result;
}

export async function findHomePageFooterNews({
  workspace,
  client,
  user,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
}) {
  const result = await findNews({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    client,
    user,
    limit: FOOTER_NEWS_LIMIT,
    skip: HEADER_NEWS_LIMIT + ASIDE_NEWS_LIMIT,
  }).then(clone);
  return result;
}

export async function findCategoryPageHeaderNews({
  workspace,
  client,
  user,
  slug,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  slug: string;
}) {
  const result = await findNewsByCategory({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    client,
    user,
    limit: HEADER_NEWS_LIMIT,
    slug,
  }).then(clone);

  return result;
}

export async function findCategoryPageFeaturedNews({
  workspace,
  client,
  user,
  slug,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  slug: string;
}) {
  const result = await findNewsByCategory({
    orderBy: {publicationDateTime: ORDER_BY.DESC},
    workspace,
    client,
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
  client,
  user,
  slug,
  page = DEFAULT_PAGE,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
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
    client,
    user,
    limit: ASIDE_NEWS_LIMIT,
    skip,
    slug,
  }).then(clone);

  return result;
}

export async function findCategoryFooterNews({
  workspace,
  client,
  user,
  slug,
  page = DEFAULT_PAGE,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
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
    client,
    user,
    limit: FOOTER_NEWS_LIMIT,
    skip,
    slug,
  }).then(clone);

  return result;
}

export async function findCategoryBottomFeedNews({
  workspace,
  client,
  user,
  slug,
  page = DEFAULT_PAGE,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
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
    client,
    user,
    limit: ASIDE_NEWS_LIMIT,
    skip,
    slug,
  }).then(clone);

  return result;
}

export async function findNewsCount({
  workspace,
  client,
  user,
  slug,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  slug?: string;
}) {
  if (!workspace) return null;

  const {news} =
    (await findNews({workspace, client, user, slug, limit: 1})) ?? {};
  return news?.length ?? 0;
}

export async function findNewsAttachments({
  workspace,
  client,
  user,
  slug,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  slug?: string;
}) {
  if (!workspace) return null;

  const response = await findNews({
    workspace,
    client,
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

  const [{attachmentList = []} = {}] = (response as NewsResponse)?.news ?? [];
  return attachmentList ?? [];
}

export async function findNewsRelatedNews({
  workspace,
  client,
  user,
  slug,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  slug?: string;
}) {
  if (!workspace) return null;

  const nonarchivedcategory = await findNonArchivedNewsCategories(
    workspace.id,
    user,
    client,
  );

  const nonarchivedcategoryids = nonarchivedcategory?.map(c => c.id);

  const response = await findNews({
    workspace,
    client,
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
            AND: [filterPrivate({user}), getArchivedFilter({archived: false})],
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

  const [{relatedNewsSet = []} = {}] = (response as NewsResponse)?.news ?? [];
  return relatedNewsSet ?? [];
}

export async function findNewsByCategoryCount({
  workspace,
  client,
  user,
  slug,
}: {
  workspace: Workspace | Cloned<Workspace>;
  client: Client;
  user?: User;
  slug?: string;
}) {
  if (!workspace) return null;

  const {news} =
    (await findNewsByCategory({workspace, client, user, slug, limit: 1})) ?? {};

  return news?.length ?? 0;
}
