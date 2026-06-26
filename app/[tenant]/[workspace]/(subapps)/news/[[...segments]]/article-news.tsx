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

// ---- LOCAL IMPORTS ---- //
import type {NewsConfig} from '@/subapps/news/common/orm/config';
import {
  FeedListSkeleton,
  NewsInfoSkeleton,
  SocialMediaSkeleton,
  AttachmentListSkeleton,
  BreadcrumbsSkeleton,
} from '@/subapps/news/common/ui/components';
import {
  AttachmentListWrapper,
  CommentsWrapper,
  NewsInfoWrapper,
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

  const slicedSegments = segments.slice(0, -2);
  const categoryIds = newsObject?.categorySet?.map(item => item.id) ?? [];

  const segmentPath = slicedSegments?.length
    ? `/${slicedSegments.join('/')}`
    : '';

  const navigatingPathFromURL = `${SUBAPP_CODES.news}${segmentPath}`;
  const directRoute = !slicedSegments?.length;

  const isRecommendationEnable = config.enableRecommendedNews || false;

  return (
    <div className={`container mx-auto grid grid-cols-1 gap-6 mt-6`}>
      {!directRoute && (
        <Suspense fallback={<BreadcrumbsSkeleton />}>
          <div className="py-4">
            <BreadcrumbsWrapper
              workspace={workspace}
              client={client}
              segments={slicedSegments}
              newsTitle={newsObject.title}
              user={user}
            />
          </div>
        </Suspense>
      )}

      <div className=" grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main News Info Section */}
        <div className="lg:col-span-2">
          <Suspense fallback={<NewsInfoSkeleton />}>
            <NewsInfoWrapper news={newsObject} config={config} />
          </Suspense>
        </div>

        <div className="w-full flex flex-col gap-6">
          {/* SocialMedia Section */}
          <Suspense fallback={<SocialMediaSkeleton />}>
            <SocialMediaWrapper config={config} />
          </Suspense>

          {/* Attachments Section */}
          <Suspense fallback={<AttachmentListSkeleton />}>
            <AttachmentListWrapper
              workspace={workspace}
              client={client}
              slug={newsObject.slug}
            />
          </Suspense>

          {/* RelatedNews Section */}
          <Suspense fallback={<FeedListSkeleton width="w-full" />}>
            <RelatedNewsWrapper
              workspace={workspace}
              client={client}
              slug={newsObject.slug}
              navigatingPathFrom={navigatingPathFromURL}
            />
          </Suspense>

          {/* RecommendedNews Section */}
          <Suspense fallback={<FeedListSkeleton width="w-full" />}>
            <RecommendedNewsWrapper
              isRecommendationEnable={isRecommendationEnable}
              navigatingPathFrom={navigatingPathFromURL}
              workspaceURL={workspaceURL}
              tenantId={tenantId}
              categoryIds={categoryIds}
            />
          </Suspense>
        </div>
      </div>

      {/* Comments Section */}
      <Suspense fallback={<CommentsSkeleton />}>
        <CommentsWrapper
          news={newsObject}
          config={config}
          user={user}
          workspaceURI={workspaceURI}
        />
      </Suspense>
    </div>
  );
}

export default ArticleNews;
