import {Suspense} from 'react';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import {type Tenant} from '@/tenant';
import type {PortalWorkspace} from '@/types';
import {t} from '@/locale/server';
import {getSession} from '@/auth';

// ---- LOCAL IMPORTS ---- //
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
import {NewsResponse} from '../common/types';

interface CategorySegment {
  slug: string;
}

export async function CategorySliderWrapper({
  workspace,
  tenant,
  user,
}: {
  workspace: PortalWorkspace;
  user: any;
  tenant: Tenant['id'];
}) {
  const parentCategories = await findCategories({
    category: null,
    workspace,
    tenantId: tenant,
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
  tenant,
  user,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  user: any;
}) {
  const allCategories = await findCategories({
    showAllCategories: true,
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  return <NavMenu categories={allCategories} />;
}

export async function HomePageHeaderNewsWrapper({
  workspace,
  tenant,
  navigatingPathFrom,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  navigatingPathFrom: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findHomePageHeaderNews({workspace, tenant, user});

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
  tenant,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findHomePageFeaturedNews({
    workspace,
    tenant,
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
  tenant,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findHomePageAsideNews({workspace, tenant, user});

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
  tenant,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findHomePageFooterNews({workspace, tenant, user});

  const news = Array.isArray(response) ? [] : response.news || [];

  if (!news.length) return null;

  return news.map((news: any) => (
    <NewsCard
      key={news.id}
      id={news.id}
      news={news}
      navigatingPathFrom={`${SUBAPP_CODES.news}`}
    />
  ));
}

export async function SubCategorySliderWrapper({
  workspace,
  tenant,
  user,
  slug,
  title,
}: {
  workspace: PortalWorkspace;
  user: any;
  tenant: Tenant['id'];
  slug: string;
  title: string;
}) {
  const subCategories = await findCategories({
    slug,
    workspace,
    tenantId: tenant,
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
  tenant,
  navigatingPathFrom,
  slug,
  page,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  navigatingPathFrom: string;
  slug: string;
  page: number;
}) {
  const session = await getSession();
  const user = session?.user;

  const response: any = await findCategoryPageHeaderNews({
    workspace,
    tenant,
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
  tenant,
  slug,
  navigatingPathFrom,
  page,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  slug: string;
  navigatingPathFrom: string;
  page: string | number;
}) {
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        <Suspense fallback={<FeedListSkeleton count={5} />}>
          <CategoryFeaturedNewsWrapper
            workspace={workspace}
            tenant={tenant}
            slug={slug}
            navigatingPathFrom={navigatingPathFrom}
          />
        </Suspense>
        <Suspense fallback={<NewsListSkeleton width={'flex-1'} count={4} />}>
          <CategoryAsideNewsWrapper
            workspace={workspace}
            tenant={tenant}
            slug={slug}
            navigatingPathFrom={navigatingPathFrom}
            page={page}
          />
        </Suspense>
      </div>
      <Suspense fallback={<NewsCardSkeleton count={5} />}>
        <CategoryFooterNewsWrapper
          workspace={workspace}
          tenant={tenant}
          slug={slug}
          navigatingPathFrom={navigatingPathFrom}
          page={page}
        />
      </Suspense>
      <Suspense fallback={<NewsListSkeleton width="w-full" count={4} />}>
        <CategoryBottomFeedNewsWrapper
          workspace={workspace}
          tenant={tenant}
          slug={slug}
          navigatingPathFrom={navigatingPathFrom}
          page={page}
        />
      </Suspense>
      <PaginationWrapper
        workspace={workspace}
        tenant={tenant}
        slug={slug}
        page={page}
      />
    </>
  );
}

export async function CategoryFeaturedNewsWrapper({
  workspace,
  tenant,
  slug,
  navigatingPathFrom,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  slug: string;
  navigatingPathFrom: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findCategoryPageFeaturedNews({
    workspace,
    tenant,
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
  tenant,
  slug,
  navigatingPathFrom,
  page,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  slug: string;
  navigatingPathFrom: string;
  page: any;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findCategoryAsideNews({
    workspace,
    tenant,
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
  tenant,
  slug,
  navigatingPathFrom,
  page,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  slug: string;
  navigatingPathFrom: string;
  page: any;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findCategoryFooterNews({
    workspace,
    tenant,
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
  tenant,
  slug,
  navigatingPathFrom,
  page,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  slug: string;
  navigatingPathFrom: string;
  page: any;
}) {
  const session = await getSession();
  const user = session?.user;

  const response = await findCategoryBottomFeedNews({
    workspace,
    tenant,
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
  tenant,
  slug,
  page,
}: {
  workspace: PortalWorkspace;
  tenant: Tenant['id'];
  slug: string;
  page: any;
}) {
  const session = await getSession();
  const user = session?.user;

  const response: NewsResponse = await findNewsByCategory({
    workspace,
    tenantId: tenant,
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
  tenantId,
  segments,
  newsTitle,
  user,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  segments: string[];
  newsTitle: string;
  user: any;
}) {
  async function getBreadcrumbs() {
    const results = segments?.map(async (segment: string, index: number) => {
      const categorySegment: CategorySegment = {slug: segment};

      try {
        const categoryTitle = await findCategoryTitleBySlugName({
          slug: categorySegment,
          workspace,
          tenantId,
          user,
        });
        if (!categoryTitle) {
          return '';
        }
        return {id: index + 1, title: categoryTitle, slug: segment};
      } catch (error) {
        console.error(error);
        return '';
      }
    });

    return await Promise.all(results);
  }

  const breadcrumbs = await getBreadcrumbs();

  return <Breadcrumbs items={breadcrumbs} title={newsTitle} />;
}

export async function NewsInfoWrapper({
  news,
  workspace,
}: {
  news: any;
  workspace: PortalWorkspace;
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
  } = news || {};

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
  workspace: PortalWorkspace;
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
  tenantId,
  slug,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  slug: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const attachmentList = await findNewsAttachments({
    workspace,
    tenantId,
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
  tenantId,
  slug,
  navigatingPathFrom,
}: {
  workspace: PortalWorkspace;
  tenantId: Tenant['id'];
  slug: string;
  navigatingPathFrom: string;
}) {
  const session = await getSession();
  const user = session?.user;

  const relatedNewsSet = await findNewsRelatedNews({
    workspace,
    tenantId,
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
  tenantId: Tenant['id'];
  categoryIds: any;
}) {
  if (!isRecommendationEnable) {
    return;
  }

  const news = await findRecommendedNews({
    workspaceURL,
    tenantId,
    categoryIds,
  });
  const title = await t(RECOMMENDED_NEWS);

  if (!news?.length) {
    return null;
  }

  return (
    <FeedList
      title={title}
      items={news}
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
  workspace: PortalWorkspace;
  user: any;
  news: any;
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
          attachmentDownloadUrl={`${workspaceURI}/${SUBAPP_CODES.news}/api/comments/attachments/${news.id}`}
        />
      </div>
    </div>
  );
}
