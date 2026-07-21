import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {Workspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';
import type {User} from '@/types';
import {CommentsSkeleton} from '@/lib/core/comments';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import type {NewsConfig} from '@/subapps/news/common/orm/config';
import {
  FeedListSkeleton,
  SocialMediaSkeleton,
  AttachmentListSkeleton,
  BreadcrumbsSkeleton,
  NewsCard,
  NewsArticleHero,
  NewsArticleBody,
} from '@/subapps/news/common/ui/components';
import {
  AttachmentListWrapper,
  CommentsWrapper,
  RecommendedNewsWrapper,
  RelatedNewsWrapper,
  SocialMediaWrapper,
  BreadcrumbsWrapper,
} from '@/subapps/news/[[...segments]]/wrappers';
import {findNews} from '@/subapps/news/common/orm/news';

export async function ArticleNews({
  workspace,
  config,
  segments,
  client,
  tenantId,
  workspaceURL,
  workspaceURI,
  user,
  slug,
}: {
  workspace: Workspace | Cloned<Workspace>;
  config: NewsConfig | Cloned<NewsConfig>;
  segments: string[];
  client: Client;
  tenantId: string;
  workspaceURL: string;
  workspaceURI: string;
  user?: User;
  slug: string;
}) {
  const {news} = await findNews({
    slug,
    workspace,
    client,
    user,
    params: {
      select: {
        content: true,
        author: {
          simpleFullName: true,
          picture: {id: true},
        },
      },
    },
  }).then(clone);

  const [newsObject] = news;

  if (!newsObject) {
    return notFound();
  }

  // "Discover next" strip — latest news excluding the current article.
  const {news: moreNews = []} = await findNews({
    workspace,
    client,
    user,
    limit: 5,
    orderBy: {publicationDateTime: 'DESC'},
  }).then(clone);
  const discoverNext = moreNews
    .filter(a => a.slug !== newsObject.slug)
    .slice(0, 4);

  const slicedSegments = segments.slice(0, -2);
  const categoryIds = newsObject?.categorySet?.map(item => item.id) ?? [];

  const segmentPath = slicedSegments?.length
    ? `/${slicedSegments.join('/')}`
    : '';

  const navigatingPathFromURL = `${SUBAPP_CODES.news}${segmentPath}`;
  const directRoute = !slicedSegments?.length;

  const isRecommendationEnable = config.enableRecommendedNews || false;

  return (
    <div className="bg-ink-25 min-h-full">
      <NewsArticleHero article={newsObject} workspace={workspace} />

      <div className="container mx-auto grid grid-cols-1 gap-6 py-8 mb-20 lg:mb-0">
        {!directRoute && (
          <Suspense fallback={<BreadcrumbsSkeleton />}>
            <BreadcrumbsWrapper
              workspace={workspace}
              client={client}
              segments={slicedSegments}
              newsTitle={newsObject.title}
              user={user}
            />
          </Suspense>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Article */}
          <NewsArticleBody article={newsObject} />

          {/* Sidebar */}
          <aside className="w-full flex flex-col gap-4 lg:sticky lg:top-6">
            <Suspense fallback={<FeedListSkeleton width="w-full" />}>
              <RelatedNewsWrapper
                workspace={workspace}
                client={client}
                slug={newsObject.slug}
                navigatingPathFrom={navigatingPathFromURL}
              />
            </Suspense>

            <Suspense fallback={<AttachmentListSkeleton />}>
              <AttachmentListWrapper
                workspace={workspace}
                client={client}
                slug={newsObject.slug}
              />
            </Suspense>

            <Suspense fallback={<FeedListSkeleton width="w-full" />}>
              <RecommendedNewsWrapper
                isRecommendationEnable={isRecommendationEnable}
                navigatingPathFrom={navigatingPathFromURL}
                workspaceURL={workspaceURL}
                tenantId={tenantId}
                categoryIds={categoryIds}
              />
            </Suspense>

            <Suspense fallback={<SocialMediaSkeleton />}>
              <SocialMediaWrapper config={config} />
            </Suspense>
          </aside>
        </div>

        {/* Comments */}
        <Suspense fallback={<CommentsSkeleton />}>
          <div className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
            <CommentsWrapper
              news={newsObject}
              config={config}
              user={user}
              workspaceURI={workspaceURI}
            />
          </div>
        </Suspense>

        {/* Discover next */}
        {discoverNext.length > 0 && (
          <section className="mt-2">
            <h2 className="mb-[18px] text-lg font-bold tracking-[-0.015em] text-ink-900">
              {await t('Discover next')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
              {discoverNext.map(a => (
                <NewsCard
                  key={a.slug}
                  id={a.slug}
                  news={a}
                  navigatingPathFrom={SUBAPP_CODES.news}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ArticleNews;
