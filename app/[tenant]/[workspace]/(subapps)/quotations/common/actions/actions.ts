'use server';

import {after} from 'next/server';

// ---- CORE IMPORTS ---- //
import {ModelMap, SUBAPP_CODES} from '@/constants';
import {t, getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import type {WorkspaceSubPath} from '@/lib/core/url';
import {getQuotationsConfig} from '../orm/config';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessMessage} from '@/lib/core/access/denial';
import {clone} from '@/utils';
import {addComment, findComments} from '@/comments/orm';
import {
  CreateComment,
  CreateCommentPropsSchema,
  FetchComments,
  FetchCommentsPropsSchema,
  isCommentEnabled,
} from '@/comments';
import {getWhereClauseForEntity} from '@/utils/filters';
import {PartnerKey} from '@/types';
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';

// ---- LOCAL IMPORTS ---- //
import {findQuotation} from '../orm/quotations';

export const createComment: CreateComment = async props => {
  const parsed = CreateCommentPropsSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: await t('Invalid request')};
  }
  const commentProps = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.quotations,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, subapp} = access;
  const {client} = access.tenant;
  const config = await getQuotationsConfig(access.workspace.config.id, client);
  if (!config) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = access.workspace;
  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (
    !isCommentEnabled({
      subapp: SUBAPP_CODES.quotations,
      config,
    })
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.quotations];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const {role, isContactAdmin} = subapp;

  const quotationWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const quotation = await findQuotation({
    id: commentProps.recordId,
    client,
    params: {where: quotationWhereClause},
    workspaceURL: access.workspace.url,
  });
  if (!quotation) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    // keeps attachment tokens redeemable if creation fails
    const [comment, parentComment] = await access.tenant.client.$transaction(
      txClient =>
        addComment({
          modelName,
          userId: user.id,
          workspaceUserId: workspaceUser.id,
          client: txClient,
          commentField: 'body',
          trackingField: 'body',
          subject: `${user.simpleFullName || user.name} added a comment`,
          ...commentProps,
        }),
    );

    if (parentComment?.partner?.id && parentComment.partner.id !== user.id) {
      const userName = user.simpleFullName || user.name;
      const quotationLink: WorkspaceSubPath = `/${SUBAPP_CODES.quotations}/${commentProps.recordId}#comment-${comment.id}`;
      const tr = getTranslation.bind(null, {
        locale: parentComment.partner.localization?.code || DEFAULT_LOCALE,
        tenant: access.tenant.id,
      });
      after(async () => {
        await notifyUser({
          userId: parentComment.partner!.id,
          tenantId: access.tenant.id,
          workspaceURL: access.workspace.url,
          client,
          payload: {
            title: await tr(
              '{0} replied to your comment on {1}',
              userName ?? '',
              quotation.saleOrderSeq ?? '',
            ),
            body: comment.body ?? '',
            link: quotationLink,
            tag: NotificationTag.quotationReply(parentComment.id),
          },
          getReplacementTitle: count =>
            tr(
              'You have {0} new replies to your comment on "{1}"',
              String(count),
              quotation.saleOrderSeq ?? '',
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
  const commentQuery = FetchCommentsPropsSchema.parse(props);

  const access = await ensureAccess({
    code: SUBAPP_CODES.quotations,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user, subapp} = access;
  const {client} = access.tenant;
  const config = await getQuotationsConfig(access.workspace.config.id, client);
  if (!config) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (
    !isCommentEnabled({
      subapp: SUBAPP_CODES.quotations,
      config,
    })
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.quotations];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const {role, isContactAdmin} = subapp;

  const quotationWhereClause = getWhereClauseForEntity({
    user,
    role,
    isContactAdmin,
    partnerKey: PartnerKey.CLIENT_PARTNER,
  });

  const quotation = await findQuotation({
    id: commentQuery.recordId,
    client,
    params: {where: quotationWhereClause},
    workspaceURL: access.workspace.url,
  });
  if (!quotation) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const data = await findComments({
      modelName,
      client,
      commentField: 'body',
      trackingField: 'body',
      ...commentQuery,
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
