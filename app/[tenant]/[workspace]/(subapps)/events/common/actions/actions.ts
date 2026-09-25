'use server';

import {z} from 'zod';
import {after} from 'next/server';

// ---- CORE IMPORTS ----//
import {
  CreateComment,
  CreateCommentPropsSchema,
  FetchComments,
  FetchCommentsPropsSchema,
  isCommentEnabled,
} from '@/comments';
import {addComment, findComments} from '@/comments/orm';
import {ModelMap, SUBAPP_CODES} from '@/constants';
import {t, tattr, getTranslation} from '@/locale/server';
import {DEFAULT_LOCALE} from '@/locale/contants';
import type {WorkspaceSubPath} from '@/url';
import {getEventsConfig} from '@/subapps/events/common/orm/config';
import {ensureAccess} from '@/access/ensure-access';
import {accessMessage} from '@/access/denial';
import {ID} from '@/types';
import {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';
import {clone, scale} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {validateRegistration} from '@/subapps/events/common/actions/validation';
import {
  FetchContactsSchema,
  FetchEventSchema,
  IsValidParticipantSchema,
  RegisterInput,
  RegisterSchema,
} from './validators';
import {
  findEvent,
  findEventConfig,
  type FullEvent,
} from '@/subapps/events/common/orm/event';
import type {Registration} from '@/subapps/events/common/types';

import {findContacts, type Contact} from '@/subapps/events/common/orm/partner';
import {registerParticipants} from '@/subapps/events/common/orm/registration';
import {
  error,
  isEventPrivate,
  isEventPublic,
} from '@/subapps/events/common/utils';
import {announceRegistration} from '@/subapps/events/common/utils/notify';
import {getCalculatedTotalPrice} from '@/subapps/events/common/utils/payments';
import {
  canEmailBeRegistered,
  isAlreadyRegistered,
} from '@/subapps/events/common/utils/registration';
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';

export async function register(
  props: RegisterInput,
): ActionResponse<Cloned<Registration>> {
  const parsed = RegisterSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {eventId} = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const workspaceURL = access.workspace.url;
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getEventsConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return error(await t('Invalid workspace'));

  const {values} = parsed.data;

  const validationResult = await validateRegistration({
    eventId,
    values,
    workspaceURL,
    config: workspaceConfig,
    user,
    client,
  });

  if (!validationResult.success) {
    return validationResult;
  }

  const {participants} = validationResult.data;

  const $event = await findEvent({
    id: eventId,
    user,
    client,
    config,
    workspace: access.workspace,
  });

  if (!$event) return error(await t('Event not found!'));

  /* A priced registration is paid through the payment flow, which registers
   * the participants when the capture lands; this action only takes the free
   * ones. */
  const {total} = getCalculatedTotalPrice(values, $event);
  if (Number(scale(total, $event.priceScale)) > 0) {
    return error(await t('This event requires a payment'));
  }

  let registration: Registration;
  try {
    registration = await registerParticipants({
      eventId,
      participants,
      workspaceURL,
      client,
    });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : await t('Registration failed'),
    );
  }

  after(() =>
    announceRegistration({
      registrationId: registration.id,
      registrant: user ? {email: user.email} : null,
      tenant: access.tenant,
      workspaceURL,
    }),
  );

  return {success: true, data: clone(registration)};
}

export async function fetchContacts(props: {
  search: string;
}): ActionResponse<Contact[]> {
  const parsed = FetchContactsSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {search} = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const workspaceURL = access.workspace.url;
  const {client} = access.tenant;

  try {
    const data = await findContacts({search, workspaceURL, client}).then(clone);
    return {success: true as const, data};
  } catch (err) {
    console.error(err);
    return error(await t('Something went wrong'));
  }
}

export async function isValidParticipant(props: {
  eventId: ID;
  email: string;
}): ActionResponse<true> {
  const parsed = IsValidParticipantSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {eventId, email} = parsed.data;

  if (!email) {
    return error(await t('Email is required'));
  }

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const workspaceURL = access.workspace.url;
  const {client} = access.tenant;

  const workspaceConfig = await getEventsConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return error(await t('Invalid workspace'));

  const event = await findEventConfig({
    id: eventId,
    client,
    workspaceURL,
  });

  if (!event) {
    return error(await t('Event not found'));
  }

  if (!(await canEmailBeRegistered({event, email, client}))) {
    if (
      !isEventPrivate(event) &&
      !isEventPublic(event) &&
      workspaceConfig?.nonPublicEmailNotFoundMessage?.trim()
    ) {
      return error(await tattr(workspaceConfig.nonPublicEmailNotFoundMessage));
    }
    return error(await t('This email can not be registered to this event'));
  }

  if (isAlreadyRegistered({event, email})) {
    return error(await t('This email is already registered to this event'));
  }

  return {
    success: true,
    data: true,
  };
}

export const createComment: CreateComment = async props => {
  const parsed = CreateCommentPropsSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: await t('Invalid request')};
  }
  const commentProps = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const tenantId = access.tenant.id;
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getEventsConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  const {workspaceUser} = access.workspace;
  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (
    !isCommentEnabled({subapp: SUBAPP_CODES.events, config: workspaceConfig})
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.events];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const event = await findEvent({
    id: commentProps.recordId,
    client,
    config,
    user,
    workspace: access.workspace,
  });
  if (!event) {
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
          commentField: 'note',
          trackingField: 'publicBody',
          subject: `${user.simpleFullName || user.name} added a comment`,
          ...commentProps,
        }),
    );

    if (parentComment?.partner?.id && parentComment.partner.id !== user.id) {
      const userName = user.simpleFullName || user.name || '';
      const eventSubPath: WorkspaceSubPath = `/${SUBAPP_CODES.events}/${event.slug}`;
      const tr = getTranslation.bind(null, {
        locale: parentComment.partner.localization?.code || DEFAULT_LOCALE,
        tenant: tenantId,
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
              userName,
              event.eventTitle ?? '',
            ),
            body: comment.note ?? '',
            link: `${eventSubPath}#comment-${comment.id}`,
            tag: NotificationTag.eventReply(parentComment.id),
          },
          getReplacementTitle: count =>
            tr(
              'You have {0} new replies to your comment on "{1}"',
              String(count),
              event.eventTitle ?? '',
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
  const parsedComments = FetchCommentsPropsSchema.safeParse(props);
  if (!parsedComments.success)
    return {error: true, message: z.prettifyError(parsedComments.error)};
  const commentQuery = parsedComments.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getEventsConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }

  if (
    !isCommentEnabled({subapp: SUBAPP_CODES.events, config: workspaceConfig})
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.events];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const event = await findEvent({
    id: commentQuery.recordId,
    client,
    config,
    user,
    workspace: access.workspace,
  });
  if (!event) {
    return {error: true, message: await t('Record not found')};
  }

  try {
    const data = await findComments({
      modelName,
      client,
      commentField: 'note',
      trackingField: 'publicBody',
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

export const fetchEvent = async (props: {
  slug: string;
}): ActionResponse<Cloned<FullEvent>> => {
  const parsed = FetchEventSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {slug} = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const event = await findEvent({
    slug,
    client,
    config,
    user,
    workspace: access.workspace,
  });
  if (!event) return error(await t('Record not found'));

  return {success: true, data: clone(event)};
};
