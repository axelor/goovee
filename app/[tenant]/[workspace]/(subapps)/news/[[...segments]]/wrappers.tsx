import {Suspense} from 'react';
import type {Cloned} from '@/types/util';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {PortalWorkspace} from '@/orm/workspace';
import {t} from '@/locale/server';
import {getSession} from '@/auth';
import type {User} from '@/types';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {NewsItem} from '@/subapps/news/common/types';
import {
  findCategories,
  findCategoryAsideNews,
  findCategoryBottomFeedNews,
  findCategoryFooterNews,
  findCategoryPageFeaturedNews,
  findCategoryPageHeaderNews,
  findCategoryTitleBySlugName,
  findHomePageAsideNews,
  findHomePageFeaturedNews,
  findHomePageFooterNews,
  findHomePageHeaderNews,
  findNewsAttachments,
  findNewsByCategory,
  findNewsRelatedNews,
} from '@/subapps/news/common/orm/news';
import {
  NavMenu,
  CategorySlider,
  LeadStories,
  NewsCard,
  NewsList,
  FeedList,
  NewsInfo,
  SocialMedia,
  AttachmentList,
  FeedListSkeleton,
  NewsListSkeleton,
  NewsCardSkeleton,
  Breadcrumbs,
} from '@/subapps/news/common/ui/components';
import {
  CATEGORIES,
  DEFAULT_LIMIT,
  FEATURED_NEWS,
  LATEST_NEWS,
  RECOMMENDED_NEWS,
  RELATED_FILES,
  RELATED_NEWS,
  SUBSCRIBE,
} from '@/subapps/news/common/constants';
import {
  Comments,
  COMMENTS,
  isCommentEnabled,
  SORT_TYPE,
} from '@/lib/core/comments';
import {
  createComment,
  fetchComments,
  findRecommendedNews,
} from '@/subapps/news/common/actions/action';
import PaginationContent from '@/subapps/news/[[...segments]]/pagination-content';

type BreadcrumbItem = {
  id: number;
  title: string;
  slug: string;
};

export async function CategorySliderWrapper({
  workspace,
  client,
  user,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: User;
  client: Client;
}) {
  const parentCategories = await findCategories({
    category: null,
    workspace,
    client,
    user,
  }).then(clone);

  const categorySliderTitle = await t(CATEGORIES);

  return (
    <CategorySlider
      showTitle={Boolean(parentCategories?.length)}
      title={categorySliderTitle}
      categories={parentCategories}
    />
  );
}

export async function NavMenuWrapper({
  workspace,
  client,
  user,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  user?: User;
}) {
  const allCategories = await findCategories({
    showAllCategories: true,
    workspace,
    client,
    user,
  }).then(clone);

  return <NavMenu categories={allCategories} />;
}

export async function HomePageHeaderNewsWrapper({
  workspace,
  client,
  navigatingPathFrom,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  navigatingPathFrom: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findHomePageHeaderNews({workspace, client, user});

  const news = Array.isArray(response) ? [] : response.news || [];

  if (!news?.length) {
    return null;
  }

  const title = await t(LATEST_NEWS);
  return (
    <div>
      <LeadStories
        title={title}
        news={news}
        navigatingPathFrom={navigatingPathFrom}
      />
    </div>
  );
}

export async function FeaturedHomePageNewsWrapper({
  workspace,
  client,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findHomePageFeaturedNews({
    workspace,
    client,
    user,
  }).then(clone);

  const featuredNews = Array.isArray(response) ? [] : response.news || [];

  if (!featuredNews.length) return null;

  return (
    <FeedList
      title={await t(FEATURED_NEWS)}
      items={featuredNews}
      navigatingPathFrom={`${SUBAPP_CODES.news}`}
    />
  );
}

export async function HomePageAsideNewsWrapper({
  workspace,
  client,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findHomePageAsideNews({workspace, client, user});

  const news = Array.isArray(response) ? [] : response.news || [];

  if (!news.length) return null;

  return news.map(item => (
    <NewsList
      key={item.id}
      id={item.id}
      news={item}
      navigatingPathFrom={SUBAPP_CODES.news}
    />
  ));
}

export async function HomePageFooterNewsWrapper({
  workspace,
  client,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findHomePageFooterNews({workspace, client, user});

  const news = Array.isArray(response) ? [] : response.news || [];

  if (!news.length) return null;

  return news.map(item => (
    <NewsCard
      key={item.id}
      id={item.id}
      news={item}
      navigatingPathFrom={`${SUBAPP_CODES.news}`}
    />
  ));
}

export async function SubCategorySliderWrapper({
  workspace,
  client,
  user,
  slug,
  title,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: User;
  client: Client;
  slug: string;
  title: string;
}) {
  const subCategories = await findCategories({
    slug,
    workspace,
    client,
    user,
  }).then(clone);

  const buttonText = await t(SUBSCRIBE);
  return (
    <CategorySlider
      title={title}
      categories={subCategories}
      showButton={false}
      buttonText={buttonText}
      /**
       * TODO: At the moment, we are not using the "Subscribe" button for the categories
       * Later will need to send the button icon from the client component
       */
      // buttonIcon={MdOutlineNotificationAdd}
    />
  );
}

export async function CategoryPageHeaderNewsWrapper({
  workspace,
  client,
  navigatingPathFrom,
  slug,
  page,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  navigatingPathFrom: string;
  slug: string;
  page: number;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findCategoryPageHeaderNews({
    workspace,
    client,
    user,
    slug,
  });

  const {news} = response;
  if (page !== 1 || !news.length) return null;

  const title = await t(LATEST_NEWS);

  return (
    <div>
      <LeadStories
        title={title}
        news={news}
        navigatingPathFrom={navigatingPathFrom}
      />
    </div>
  );
}

export async function CategoryNewsGridLayoutWrapper({
  workspace,
  client,
  slug,
  navigatingPathFrom,
  page,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
  navigatingPathFrom: string;
  page: number;
}) {
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        <Suspense fallback={<FeedListSkeleton count={5} />}>
          <CategoryFeaturedNewsWrapper
            workspace={workspace}
            client={client}
            slug={slug}
            navigatingPathFrom={navigatingPathFrom}
          />
        </Suspense>
        <Suspense fallback={<NewsListSkeleton width={'flex-1'} count={4} />}>
          <CategoryAsideNewsWrapper
            workspace={workspace}
            client={client}
            slug={slug}
            navigatingPathFrom={navigatingPathFrom}
            page={page}
          />
        </Suspense>
      </div>
      <Suspense fallback={<NewsCardSkeleton count={5} />}>
        <CategoryFooterNewsWrapper
          workspace={workspace}
          client={client}
          slug={slug}
          navigatingPathFrom={navigatingPathFrom}
          page={page}
        />
      </Suspense>
      <Suspense fallback={<NewsListSkeleton width="w-full" count={4} />}>
        <CategoryBottomFeedNewsWrapper
          workspace={workspace}
          client={client}
          slug={slug}
          navigatingPathFrom={navigatingPathFrom}
          page={page}
        />
      </Suspense>
      <PaginationWrapper
        workspace={workspace}
        client={client}
        slug={slug}
        page={page}
      />
    </>
  );
}

export async function CategoryFeaturedNewsWrapper({
  workspace,
  client,
  slug,
  navigatingPathFrom,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
  navigatingPathFrom: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findCategoryPageFeaturedNews({
    workspace,
    client,
    user,
    slug,
  }).then(clone);

  const featuredNews = Array.isArray(response) ? [] : response.news || [];

  if (!featuredNews.length) return null;

  return (
    <FeedList
      title={await t(FEATURED_NEWS)}
      items={featuredNews}
      navigatingPathFrom={navigatingPathFrom}
    />
  );
}

export async function CategoryAsideNewsWrapper({
  workspace,
  client,
  slug,
  navigatingPathFrom,
  page,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
  navigatingPathFrom: string;
  page: number;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findCategoryAsideNews({
    workspace,
    client,
    user,
    slug,
    page,
  }).then(clone);

  const news = Array.isArray(response) ? [] : response.news || [];

  if (!news.length) return null;

  return (
    <div className={`flex-1 flex flex-col gap-4`}>
      {news.map(item => (
        <NewsList
          key={item.id}
          id={item.id}
          news={item}
          navigatingPathFrom={navigatingPathFrom}
        />
      ))}
    </div>
  );
}

export async function CategoryFooterNewsWrapper({
  workspace,
  client,
  slug,
  navigatingPathFrom,
  page,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
  navigatingPathFrom: string;
  page: number;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findCategoryFooterNews({
    workspace,
    client,
    user,
    slug,
    page,
  }).then(clone);

  const news = Array.isArray(response) ? [] : response.news || [];

  if (!news.length) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
      {news.map(item => (
        <NewsCard
          key={item.id}
          id={item.id}
          news={item}
          navigatingPathFrom={navigatingPathFrom}
        />
      ))}
    </div>
  );
}

export async function CategoryBottomFeedNewsWrapper({
  workspace,
  client,
  slug,
  navigatingPathFrom,
  page,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
  navigatingPathFrom: string;
  page: number;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findCategoryBottomFeedNews({
    workspace,
    client,
    user,
    slug,
    page,
  }).then(clone);

  const news = Array.isArray(response) ? [] : response.news || [];

  if (!news.length) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      {news.map(item => (
        <NewsList
          key={item.id}
          id={item.id}
          news={item}
          navigatingPathFrom={navigatingPathFrom}
        />
      ))}
    </div>
  );
}

export async function PaginationWrapper({
  workspace,
  client,
  slug,
  page,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
  page: number;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findNewsByCategory({
    workspace,
    client,
    user,
    slug,
    page,
    limit: DEFAULT_LIMIT,
  }).then(clone);

  const {pageInfo, news = []} = response;

  if (!news?.length) {
    return null;
  }

  return <PaginationContent pageInfo={pageInfo} />;
}

export async function BreadcrumbsWrapper({
  workspace,
  client,
  segments,
  newsTitle,
  user,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  segments: string[];
  newsTitle: string;
  user?: User;
}) {
  async function getBreadcrumbs(): Promise<BreadcrumbItem[]> {
    const results = segments?.map(async (segment: string, index: number) => {
      try {
        const categoryTitle = await findCategoryTitleBySlugName({
          slug: segment,
          workspace,
          client,
          user,
        });
        if (!categoryTitle) {
          return null;
        }
        return {id: index + 1, title: categoryTitle, slug: segment};
      } catch (error) {
        console.error(error);
        return null;
      }
    });

    const resolved = await Promise.all(results);
    return resolved.filter((item): item is BreadcrumbItem => item !== null);
  }

  const breadcrumbs = await getBreadcrumbs();

  return <Breadcrumbs items={breadcrumbs} title={newsTitle} />;
}

export async function NewsInfoWrapper({
  news,
  workspace,
}: {
  news: NewsItem;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const {
    title,
    categorySet,
    image,
    description,
    publicationDateTime,
    content,
    author,
    slug,
  } = news;

  return (
    <NewsInfo
      title={title}
      categorySet={categorySet}
      image={image}
      description={description}
      publicationDateTime={publicationDateTime}
      content={content}
      author={author}
      slug={slug}
      workspace={workspace}
    />
  );
}

export async function SocialMediaWrapper({
  workspace,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
}) {
  const enableSocialMediaSharing = workspace.config?.enableSocialMediaSharing;
  const availableSocials = workspace.config?.socialMediaSelect;

  /**
   * Temporarly Disabled the rendering of Social Media Icons
   */
  if (true) {
    return;
  }
  if (!enableSocialMediaSharing) {
    return null;
  }

  return <SocialMedia availableSocials={availableSocials} />;
}

export async function AttachmentListWrapper({
  workspace,
  client,
  slug,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const attachmentList = await findNewsAttachments({
    workspace,
    client,
    slug,
    user,
  });

  if (!attachmentList?.length) {
    return null;
  }

  const title = await t(RELATED_FILES);

  return (
    <AttachmentList
      slug={slug}
      title={title}
      items={attachmentList}
      width="w-full"
    />
  );
}

export async function RelatedNewsWrapper({
  workspace,
  client,
  slug,
  navigatingPathFrom,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  client: Client;
  slug: string;
  navigatingPathFrom: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const relatedNewsSet = await findNewsRelatedNews({
    workspace,
    client,
    slug,
    user,
  });

  if (!relatedNewsSet?.length) {
    return null;
  }

  const title = await t(RELATED_NEWS);
  return (
    <FeedList
      title={title}
      items={relatedNewsSet}
      width="w-full"
      navigatingPathFrom={navigatingPathFrom}
    />
  );
}

export async function RecommendedNewsWrapper({
  navigatingPathFrom,
  isRecommendationEnable,
  workspaceURL,
  tenantId,
  categoryIds,
}: {
  navigatingPathFrom: string;
  isRecommendationEnable: boolean;
  workspaceURL: string;
  tenantId: string;
  categoryIds: string[];
}) {
  if (!isRecommendationEnable) {
    return;
  }

  const newsResult = await findRecommendedNews({
    workspaceURL,
    tenantId,
    categoryIds,
  });
  const title = await t(RECOMMENDED_NEWS);

  if (!Array.isArray(newsResult) || !newsResult.length) {
    return null;
  }

  return (
    <FeedList
      title={title}
      items={newsResult}
      width="w-full"
      navigatingPathFrom={navigatingPathFrom}
    />
  );
}

export async function CommentsWrapper({
  workspace,
  user,
  news,
  workspaceURI,
}: {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: User;
  news: NewsItem;
  workspaceURI: string;
}) {
  const title = await t(COMMENTS);

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.news,
    workspace,
  });
  const isDisabled = !user ? true : false;

  if (!enableComment) {
    return null;
  }

  return (
    <div className="w-full mb-24 lg:mb-4">
      <div className="p-4 bg-white flex flex-col gap-4 rounded-lg">
        <div>
          <div className="text-xl font-semibold">{title}</div>
        </div>

        <Comments
          recordId={news.id}
          subapp={SUBAPP_CODES.news}
          disabled={isDisabled}
          inputPosition="bottom"
          sortBy={SORT_TYPE.old}
          showCommentsByDefault
          hideCommentsHeader
          hideSortBy
          hideTopBorder
          hideCloseComments
          showRepliesInMainThread
          trackingField="publicBody"
          commentField="note"
          createComment={createComment}
          fetchComments={fetchComments}
          attachmentDownloadUrl={withBasePath(
            `${workspaceURI}/${SUBAPP_CODES.news}/api/comments/attachments/${news.id}`,
          )}
        />
      </div>
    </div>
  );
}
