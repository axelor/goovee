import {Suspense} from 'react';
import type {Cloned} from '@/types/util';

// ---- CORE IMPORTS ----//
import type {Client} from '@/goovee/.generated/client';
import {getSession} from '@/auth';
import type {PortalAppConfig, WorkspaceLight} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import type {User} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {
  CategoriesSkeleton,
  Hero,
  NavMenuSkeleton,
  HomeNewsFeedSkeleton,
  LeadStoriesSkeleton,
  HomepageNewsGridSkeleton,
  FeedListSkeleton,
  NewsListSkeleton,
  NewsCardSkeleton,
} from '@/subapps/news/common/ui/components';
import {
  CategorySliderWrapper,
  FeaturedHomePageNewsWrapper,
  HomePageAsideNewsWrapper,
  HomePageFooterNewsWrapper,
  HomePageHeaderNewsWrapper,
  NavMenuWrapper,
} from '@/subapps/news/[[...segments]]/wrappers';
import styles from '@/subapps/news/common/ui/styles/news.module.scss';
import {findNewsCount} from '@/subapps/news/common/orm/news';
import {NO_NEWS_AVAILABLE} from '@/subapps/news/common/constants';

async function HomePageNewsFeed({
  workspace,
  client,
  user,
}: {
  workspace: WorkspaceLight | Cloned<WorkspaceLight>;
  user?: User;
  client: Client;
}) {
  const newsCount = await findNewsCount({workspace, client, user});

  if (!newsCount) {
    return (
      <div className="font-medium text-center flex items-center justify-center py-4 flex-1">
        {await t(NO_NEWS_AVAILABLE)}
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<LeadStoriesSkeleton />}>
        <HomePageHeaderNewsWrapper
          workspace={workspace}
          client={client}
          navigatingPathFrom={`${SUBAPP_CODES.news}`}
        />
      </Suspense>

      <Suspense fallback={<HomepageNewsGridSkeleton />}>
        <div className="flex flex-col lg:flex-row gap-6">
          <Suspense fallback={<FeedListSkeleton count={5} />}>
            <FeaturedHomePageNewsWrapper
              workspace={workspace}
              client={client}
            />
          </Suspense>
          <div className="flex flex-col flex-1 gap-4">
            <Suspense fallback={<NewsListSkeleton width="flex-1" count={4} />}>
              <HomePageAsideNewsWrapper workspace={workspace} client={client} />
            </Suspense>
          </div>
        </div>
      </Suspense>

      <Suspense fallback={<NewsCardSkeleton count={5} />}>
        <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
          <HomePageFooterNewsWrapper workspace={workspace} client={client} />
        </div>
      </Suspense>
    </>
  );
}

export async function Homepage({
  workspace,
  config,
  client,
}: {
  workspace: WorkspaceLight | Cloned<WorkspaceLight>;
  config: PortalAppConfig | Cloned<PortalAppConfig>;
  client: Client;
}) {
  const session = await getSession();
  const user = session?.user;

  return (
    <div className={`flex flex-col h-full flex-1 ${styles['news-container']}`}>
      <div className="hidden lg:block relative">
        <Suspense fallback={<NavMenuSkeleton />}>
          <NavMenuWrapper workspace={workspace} client={client} user={user} />
        </Suspense>
      </div>

      <div className="h-full flex flex-col">
        <Hero config={config} />

        <div className="container mx-auto grid grid-cols-1 gap-6 mb-20 lg:mb-0">
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategorySliderWrapper
              workspace={workspace}
              user={user}
              client={client}
            />
          </Suspense>
          <Suspense fallback={<HomeNewsFeedSkeleton />}>
            <HomePageNewsFeed
              workspace={workspace}
              user={user}
              client={client}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default Homepage;
