import type {Cloned} from '@/types/util';

// ---- CORE IMPORTS ----//
import {SUBAPP_CODES} from '@/constants';
import type {Client} from '@/goovee/.generated/client';
import type {Workspace} from '@/orm/workspace';
import {t} from '@/locale/server';
import {getSession} from '@/auth';
import type {User} from '@/types';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {NewsConfig} from '@/subapps/news/common/orm/config';
import type {NewsItem} from '@/subapps/news/common/types';
import {
  findCategoryTitleBySlugName,
  findNewsAttachments,
  findNewsRelatedNews,
} from '@/subapps/news/common/orm/news';
import {
  FeedList,
  SocialMedia,
  AttachmentList,
  Breadcrumbs,
} from '@/subapps/news/common/ui/components';
import {
  RECOMMENDED_NEWS,
  RELATED_FILES,
  RELATED_NEWS,
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

type BreadcrumbItem = {
  id: number;
  title: string;
  slug: string;
};

export async function BreadcrumbsWrapper({
  workspace,
  client,
  segments,
  newsTitle,
  user,
}: {
  workspace: Workspace | Cloned<Workspace>;
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

export async function SocialMediaWrapper({
  config,
}: {
  config: NewsConfig | Cloned<NewsConfig>;
}) {
  const enableSocialMediaSharing = config.enableSocialMediaSharing;
  const availableSocials = config.socialMediaSelect;

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
  workspace: Workspace | Cloned<Workspace>;
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
  workspace: Workspace | Cloned<Workspace>;
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
  config,
  user,
  news,
  workspaceURI,
}: {
  config: NewsConfig | Cloned<NewsConfig>;
  user?: User;
  news: NewsItem;
  workspaceURI: string;
}) {
  const title = await t(COMMENTS);

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.news,
    config,
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
          variant="conversation"
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
          disableReply
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
