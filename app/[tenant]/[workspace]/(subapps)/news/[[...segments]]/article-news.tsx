import {notFound} from 'next/navigation';
import {Suspense} from 'react';

// ---- CORE IMPORTS ----//
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';
import {type Tenant} from '@/tenant';
import type {PortalWorkspace} from '@/types';
import {CommentsSkeleton} from '@/lib/core/comments';

// ---- LOCAL IMPORTS ---- //
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
  segments,
  tenantId,
  workspaceURL,
  user,
  slug,
}: {
  workspace: PortalWorkspace;
  segments: string[];
  tenantId: Tenant['id'];
  workspaceURL: string;
  user: any;
  slug: string;
}) {
  const {news}: any = await findNews({
    slug,
    workspace,
    tenantId,
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
  const categoryIds = newsObject?.categorySet?.map((item: any) => item.id);

  const segmentPath = slicedSegments?.length
    ? `/${slicedSegments.join('/')}`
    : '';

  const navigatingPathFromURL = `${SUBAPP_CODES.news}${segmentPath}`;
  const directRoute = !slicedSegments?.length;

  const isRecommendationEnable =
    workspace.config?.enableRecommendedNews || false;

  return (
    <div className={`container mx-auto grid grid-cols-1 gap-6 mt-6`}>
      {!directRoute && (
        <Suspense fallback={<BreadcrumbsSkeleton />}>
          <div className="py-4">
            <BreadcrumbsWrapper
              workspace={workspace}
              tenantId={tenantId}
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
            <NewsInfoWrapper news={newsObject} workspace={workspace} />
          </Suspense>
        </div>

        <div className="w-full flex flex-col gap-6">
          {/* SocialMedia Section */}
          <Suspense fallback={<SocialMediaSkeleton />}>
            <SocialMediaWrapper workspace={workspace} />
          </Suspense>

          {/* Attachments Section */}
          <Suspense fallback={<AttachmentListSkeleton />}>
            <AttachmentListWrapper
              workspace={workspace}
              tenantId={tenantId}
              slug={newsObject.slug}
            />
          </Suspense>

          {/* RelatedNews Section */}
          <Suspense fallback={<FeedListSkeleton width="w-full" />}>
            <RelatedNewsWrapper
              workspace={workspace}
              tenantId={tenantId}
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
        <CommentsWrapper news={newsObject} workspace={workspace} user={user} />
      </Suspense>
    </div>
  );
}

export default ArticleNews;
