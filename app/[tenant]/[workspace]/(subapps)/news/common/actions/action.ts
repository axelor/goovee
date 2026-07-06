'use server';

import {z} from 'zod';
import {after} from 'next/server';
import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {t, getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {ModelMap, ORDER_BY, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {getNewsConfig} from '@/subapps/news/common/orm/config';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessMessage} from '@/lib/core/access/denial';
import {TENANT_HEADER} from '@/proxy';
import {addComment, findComments} from '@/comments/orm';
import {
  CreateComment,
  CreateCommentPropsSchema,
  FetchComments,
  FetchCommentsPropsSchema,
  isCommentEnabled,
} from '@/comments';
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {findNews} from '@/subapps/news/common/orm/news';
import {DEFAULT_NEWS_ASIDE_LIMIT} from '@/subapps/news/common/constants';
import {
  FindRecommendedNewsSchema,
  FindSearchNewsSchema,
  type FindRecommendedNewsInput,
  type FindSearchNewsInput,
} from '@/subapps/news/common/validators';

export async function findSearchNews({workspaceURL}: FindSearchNewsInput) {
  const parsed = FindSearchNewsSchema.safeParse({workspaceURL});
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const access = await ensureAccess({
    code: SUBAPP_CODES.news,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client} = access.tenant;

  const config = await getNewsConfig(access.workspace.config.id, client);
  if (!config) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const {news} = await findNews({
    workspace: access.workspace,
    client,
    user,
  }).then(clone);

  return news;
}

export async function findRecommendedNews({
  workspaceURL,
  tenantId,
  categoryIds,
}: FindRecommendedNewsInput) {
  const parsed = FindRecommendedNewsSchema.safeParse({
    workspaceURL,
    tenantId,
    categoryIds,
  });
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }

  const access = await ensureAccess({
    code: SUBAPP_CODES.news,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client} = access.tenant;

  const config = await getNewsConfig(access.workspace.config.id, client);
  if (!config) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const {news} = await findNews({
    workspace: access.workspace,
    client,
    limit: DEFAULT_NEWS_ASIDE_LIMIT,
    orderBy: {
      publicationDateTime: ORDER_BY.DESC,
    },
    categoryIds,
    user,
  }).then(clone);
  return news;
}

export const createComment: CreateComment = async props => {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const parsed = CreateCommentPropsSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: await t('Invalid request')};
  }
  const {workspaceURL, workspaceURI, ...rest} = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.news,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client} = access.tenant;

  const config = await getNewsConfig(access.workspace.config.id, client);
  if (!config) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = access.workspace;
  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.news, config})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.news];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const {news} = await findNews({
    id: rest.recordId,
    workspace: access.workspace,
    client,
    user,
  });
  if (!news?.length) {
    return {error: true, message: await t('Record not found')};
  }

  const newsItem = news[0];

  try {
    // keeps attachment tokens redeemable if creation fails
    const [comment, parentComment] = await access.tenant.client.$transaction(
      txClient =>
        addComment({
          modelName,
          userId: user.id,
          workspaceUserId: workspaceUser.id,
          client: txClient,
          commentField: 'note',
          trackingField: 'publicBody',
          subject: `${user.simpleFullName || user.name} added a comment`,
          ...rest,
        }),
    );

    if (parentComment?.partner?.id && parentComment.partner.id !== user.id) {
      const userName = user.simpleFullName || user.name;
      const newsUrl = withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.news}/${SUBAPP_PAGE.article}/${newsItem.slug}#comment-${comment.id}`,
      );
      const tr = getTranslation.bind(null, {
        locale: parentComment.partner.localization?.code || DEFAULT_LOCALE,
        tenant: tenantId,
      });
      after(async () => {
        await notifyUser({
          userId: parentComment.partner!.id,
          tenantId,
          workspaceURL,
          client,
          payload: {
            title: await tr(
              '{0} replied to your comment on {1}',
              userName ?? '',
              newsItem.title ?? '',
            ),
            body: comment.note ?? '',
            url: newsUrl,
            tag: NotificationTag.newsReply(parentComment.id),
          },
          getReplacementTitle: count =>
            tr(
              'You have {0} new replies to your comment on "{1}"',
              String(count),
              newsItem.title ?? '',
            ),
        });
      });
    }

    return {success: true, data: clone([comment, parentComment])};
  } catch (e) {
    return {
      error: true,
      message:
        e instanceof Error
          ? e.message
          : await t('An unexpected error occurred while fetching comments.'),
    };
  }
};

export const fetchComments: FetchComments = async props => {
  const {workspaceURL, ...rest} = FetchCommentsPropsSchema.parse(props);

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAccess({
    code: SUBAPP_CODES.news,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client} = access.tenant;

  const config = await getNewsConfig(access.workspace.config.id, client);
  if (!config) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.news, config})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.news];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const {news} = await findNews({
    id: rest.recordId,
    workspace: access.workspace,
    client,
    user,
  });
  if (!news?.length) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const data = await findComments({
      modelName,
      client,
      commentField: 'note',
      trackingField: 'publicBody',
      ...rest,
    });
    return {success: true, data: clone(data)};
  } catch (e) {
    return {
      error: true,
      message:
        e instanceof Error
          ? e.message
          : await t('An unexpected error occurred while fetching comments.'),
    };
  }
};
