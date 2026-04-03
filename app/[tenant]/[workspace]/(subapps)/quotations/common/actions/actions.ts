'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {ModelMap, SUBAPP_CODES} from '@/constants';
import {t, getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {TENANT_HEADER} from '@/proxy';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {clone} from '@/utils';
import {addComment, findComments} from '@/comments/orm';
import {
  CreateComment,
  CreateCommentPropsSchema,
  FetchComments,
  FetchCommentsPropsSchema,
  isCommentEnabled,
} from '@/comments';
import {zodParseFormData} from '@/utils/formdata';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey} from '@/types';
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';

// ---- LOCAL IMPORTS ---- //
import {findQuotation} from '../orm/quotations';

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

  const workspace = await findWorkspace({user, url: workspaceURL, tenantId});
  if (!workspace) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = workspace;
  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (!isCommentEnabled({subapp: SUBAPP_CODES.quotations, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.quotations];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }
  const {role, isContactAdmin} = app;

  const quotationWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const quotation = await findQuotation({
    id: rest.recordId,
    tenantId,
    params: {where: quotationWhereClause},
    workspaceURL,
  });
  if (!quotation) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const [comment, parentComment] = await addComment({
      modelName,
      userId: user.id,
      workspaceUserId: workspaceUser.id,
      tenantId,
      commentField: 'body',
      trackingField: 'body',
      subject: `${user.simpleFullName || user.name} added a comment`,
      ...rest,
    });

    if (parentComment?.partner?.id && parentComment.partner.id !== user.id) {
      const userName = user.simpleFullName || user.name;
      const quotationUrl = `${workspaceURI}/${SUBAPP_CODES.quotations}/${rest.recordId}`;
      const tr = getTranslation.bind(null, {
        locale: parentComment.partner.localization?.code || DEFAULT_LOCALE,
        tenant: tenantId,
      });
      notifyUser({
        userId: parentComment.partner.id,
        tenantId,
        workspaceURL,
        payload: {
          title: await tr(
            '{0} replied to your comment on {1}',
            userName ?? '',
            quotation.saleOrderSeq ?? '',
          ),
          body: comment.body ?? '',
          url: `${quotationUrl}#comment-${comment.id}`,
          tag: NotificationTag.quotationReply(parentComment.id),
        },
        getReplacementTitle: count =>
          tr(
            'You have {0} new replies to your comment on "{1}"',
            String(count),
            quotation.saleOrderSeq ?? '',
          ),
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
  if (!user) {
    return {error: true, message: await t('Unauthorized')};
  }

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

  if (!isCommentEnabled({subapp: SUBAPP_CODES.quotations, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.quotations];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.quotations,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  const {role, isContactAdmin} = app;

  const quotationWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const quotation = await findQuotation({
    id: rest.recordId,
    tenantId,
    params: {where: quotationWhereClause},
    workspaceURL,
  });
  if (!quotation) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const data = await findComments({
      modelName,
      tenantId,
      commentField: 'body',
      trackingField: 'body',
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
