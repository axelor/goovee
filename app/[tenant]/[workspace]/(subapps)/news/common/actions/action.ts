'use server';

import {z} from 'zod';
import {after} from 'next/server';
import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {t, getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {getSession} from '@/auth';
import {ModelMap, ORDER_BY, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import {addComment, findComments} from '@/comments/orm';
import {
  CreateComment,
  CreateCommentPropsSchema,
  FetchComments,
  FetchCommentsPropsSchema,
  isCommentEnabled,
} from '@/comments';
import {zodParseFormData} from '@/utils/formdata';
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

  const session = await getSession();
  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.news,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const {news} = await findNews({workspace, client, user}).then(clone);

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

  const session = await getSession();
  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.news,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const {news} = await findNews({
    workspace,
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

export const createComment: CreateComment = async formData => {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const {workspaceURL, workspaceURI, ...rest} = zodParseFormData(
    formData,
    CreateCommentPropsSchema,
  );

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({user, url: workspaceURL, client});
  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = workspace;
  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.news, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.news];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.news,
    user,
    url: workspaceURL,
    client,
  });
  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  const {news} = await findNews({
    id: rest.recordId,
    workspace,
    client,
    user,
  });
  if (!news?.length) {
    return {error: true, message: await t('Record not found')};
  }

  const newsItem = news[0];

  try {
    const [comment, parentComment] = await addComment({
      modelName,
      userId: user.id,
      workspaceUserId: workspaceUser.id,
      client,
      commentField: 'note',
      trackingField: 'publicBody',
      subject: `${user.simpleFullName || user.name} added a comment`,
      ...rest,
    });

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
  const session = await getSession();

  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  const workspace = await findWorkspace({user, url: workspaceURL, client});

  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.news, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.news];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.news,
    user,
    url: workspaceURL,
    client,
  });
  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  const {news} = await findNews({
    id: rest.recordId,
    workspace,
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
