'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {getSession} from '@/auth';
import {ModelMap, ORDER_BY, SUBAPP_CODES} from '@/constants';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {TENANT_HEADER} from '@/middleware';
import {type Tenant} from '@/tenant';
import {addComment, findComments} from '@/comments/orm';
import {
  CreateComment,
  CreateCommentPropsSchema,
  FetchComments,
  FetchCommentsPropsSchema,
  isCommentEnabled,
} from '@/comments';
import {zodParseFormData} from '@/utils/formdata';

// ---- LOCAL IMPORTS ---- //
import {findNews} from '@/subapps/news/common/orm/news';
import {DEFAULT_NEWS_ASIDE_LIMIT} from '@/subapps/news/common/constants';

export async function findSearchNews({workspaceURL}: {workspaceURL: string}) {
  const session = await getSession();
  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.news,
    user,
    url: workspaceURL,
    tenantId,
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
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const {news}: any = await findNews({workspace, tenantId, user}).then(clone);

  return news;
}

export async function findRecommendedNews({
  workspaceURL,
  tenantId,
  categoryIds,
}: {
  workspaceURL: string;
  tenantId: Tenant['id'];
  categoryIds: string[];
}) {
  if (!workspaceURL) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const session = await getSession();
  const user = session?.user;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.news,
    user,
    url: workspaceURL,
    tenantId,
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
    tenantId,
  });

  if (!workspace) {
    return {
      error: true,
      message: await t('Invalid workspace'),
    };
  }

  const {news}: any = await findNews({
    workspace,
    tenantId,
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

  const {workspaceURL, ...rest} = zodParseFormData(
    formData,
    CreateCommentPropsSchema,
  );

  const workspace = await findWorkspace({user, url: workspaceURL, tenantId});
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
    tenantId,
  });
  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  const {news}: any = await findNews({
    id: rest.recordId,
    workspace,
    tenantId,
    user,
  });
  if (!news?.length) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const res = await addComment({
      modelName,
      userId: user.id,
      workspaceUserId: workspaceUser.id,
      tenantId,
      commentField: 'note',
      trackingField: 'publicBody',
      subject: `${user.simpleFullName || user.name} added a comment`,
      ...rest,
    });

    return {success: true, data: clone(res)};
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

  const workspace = await findWorkspace({user, url: workspaceURL, tenantId});

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
    tenantId,
  });
  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  const {news}: any = await findNews({
    id: rest.recordId,
    workspace,
    tenantId,
    user,
  });
  if (!news?.length) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const data = await findComments({
      modelName,
      tenantId,
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
