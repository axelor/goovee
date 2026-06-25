'use server';

import {z} from 'zod';
import {after} from 'next/server';
import {headers} from 'next/headers';

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
import {TENANT_HEADER} from '@/proxy';
import {getWorkspaceConfig} from '@/orm/workspace';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {accessMessage} from '@/lib/core/access/denial';
import {ID, PaymentOption} from '@/types';
import {ActionResponse} from '@/types/action';
import type {Cloned} from '@/types/util';
import {clone, scale} from '@/utils';
import {markPaymentAsProcessed} from '@/payment/common/orm';
import type {PaymentContext} from '@/lib/core/payment/common/type';
import {getPaymentModeId} from '@/utils/payment';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {validateRegistration} from '@/subapps/events/common/actions/validation';
import {
  FetchContactsSchema,
  FetchEventSchema,
  GetAllEventsSchema,
  IsValidParticipantSchema,
  RegisterInput,
  RegisterSchema,
  type RegistrationValues,
} from './validators';
import {
  findEvent,
  findEventConfig,
  findEvents,
  type FullEvent,
} from '@/subapps/events/common/orm/event';
import type {PageInfo} from '@/types';
import type {ListEvent, Registration} from '@/subapps/events/common/types';

import {findContacts, type Contact} from '@/subapps/events/common/orm/partner';
import {registerParticipants} from '@/subapps/events/common/orm/registration';
import {
  error,
  isEventPrivate,
  isEventPublic,
} from '@/subapps/events/common/utils';
import {generateRegistrationMailAction} from '@/subapps/events/common/utils/mail';
import {getCalculatedTotalPrice} from '@/subapps/events/common/utils/payments';
import {
  canEmailBeRegistered,
  isAlreadyRegistered,
} from '@/subapps/events/common/utils/registration';
import {getPaymentInfo} from '@/subapps/events/common/utils/validate';
import {notifyUser} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import {createInvoice} from '@/subapps/events/common/service';

export async function getAllEvents(props: {
  limit?: number;
  page?: number;
  categories?: string[];
  search?: string;
  day?: string | number;
  month?: number;
  year?: number;
  dates?: Date[];
  workspaceURL: string;
  onlyRegisteredEvent?: boolean;
}): ActionResponse<{events: Cloned<ListEvent>[]; pageInfo: PageInfo}> {
  const parsed = GetAllEventsSchema.safeParse(props);
  if (!parsed.success)
    return {error: true, message: z.prettifyError(parsed.error)};
  const {
    limit,
    page,
    categories,
    search,
    day,
    month,
    year,
    dates,
    workspaceURL,
    onlyRegisteredEvent = false,
  } = parsed.data;
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('Tenant ID is missing!'));
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {user} = access;
  const {client} = access.tenant;

  try {
    const {events, pageInfo} = await findEvents({
      limit,
      page,
      categoryids: categories,
      day,
      search,
      month,
      year,
      selectedDates: dates,
      workspaceURL,
      client,
      user,
      onlyRegisteredEvent,
    }).then(clone);
    return {success: true as const, data: {events, pageInfo}};
  } catch (err) {
    console.error(err);
    return error(await t('Something went wrong'));
  }
}

export async function register(
  props: RegisterInput,
): ActionResponse<Cloned<Registration>> {
  const parsed = RegisterSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {eventId, workspaceURL} = parsed.data;
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('Tenant ID is missing!'));

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return error(await t('Invalid workspace'));
  const workspace = {...access.workspace, config: workspaceConfig};

  let paidAmount: number,
    values: RegistrationValues,
    context: PaymentContext | undefined,
    paymentMode: PaymentOption | undefined;
  if ('payment' in parsed.data) {
    paymentMode = parsed.data.payment.mode;
    const paymentInfo = await getPaymentInfo({
      mode: paymentMode,
      data: parsed.data.payment.data,
      client,
    });

    if (paymentInfo.error) return paymentInfo;

    values = paymentInfo.data.context.data;
    paidAmount = paymentInfo.data.amount;
    context = paymentInfo.data.context;
  } else {
    values = parsed.data.values;
    paidAmount = 0;
  }

  const validationResult = await validateRegistration({
    eventId,
    values,
    workspaceURL,
    workspace,
    user,
    client,
  });

  if (!validationResult.success) {
    return validationResult;
  }

  const {participants} = validationResult.data;

  const $event = await findEvent({
    id: eventId,
    workspaceURL,
    user,
    client,
    config,
  });

  if (!$event) return error(await t('Event not found!'));
  const {priceScale} = $event;
  const {total: expectedAmount} = getCalculatedTotalPrice(values, $event);
  const expected = Number(scale(expectedAmount, priceScale));

  if (paidAmount !== expected) {
    return error(
      await t(
        'Paid amount {0} is not equal to expected amount {1}',
        String(paidAmount),
        String(expected),
      ),
    );
  }

  let registration: Registration;
  try {
    registration = await access.tenant.client.$transaction(async txClient => {
      const reg = await registerParticipants({
        eventId,
        participants,
        workspaceURL,
        client: txClient,
      });

      if (context) {
        await markPaymentAsProcessed({
          contextId: context.id,
          version: context.version,
          client: txClient,
        });
      }

      return reg;
    });
  } catch (err) {
    return error(
      err instanceof Error ? err.message : await t('Registration failed'),
    );
  }

  /* createInvoice makes an HTTP call to AOS and must run after the transaction
     commits — AOS queries the registration by ID, so calling it inside the
     transaction would make the row invisible to AOS (read committed isolation).
     Errors are logged but do not fail the registration. */
  if (paidAmount > 0) {
    const paymentModeId = getPaymentModeId(
      workspace?.config?.paymentOptionSet,
      paymentMode!,
    );

    after(async () => {
      const res = await createInvoice({
        workspace,
        config,
        registrationId: registration.id,
        currencyCode: $event.currency?.code ?? '',
        paymentModeId,
      });

      if (res.error) {
        console.error('Invoice creation failed:', res.message);
      }
    });
  }

  let userParticipants = registration.participantList?.filter(
    p => p.contact?.isActivatedOnPortal,
  );

  if (user) {
    userParticipants = userParticipants?.filter(
      p => p.contact?.emailAddress?.address !== user.email,
    );
  }

  for (const participant of userParticipants ?? []) {
    const contact = participant.contact!;
    const tr = getTranslation.bind(null, {
      locale: contact.localization?.code || DEFAULT_LOCALE,
      tenant: tenantId,
    });
    after(async () => {
      await notifyUser({
        userId: contact.id,
        tenantId,
        workspaceURL,
        client,
        payload: {
          title: await tr('You have been registered for an event!'),
          body: `${registration.event!.eventTitle}`,
          url: `${workspaceURL}/${SUBAPP_CODES.events}/${registration.event!.slug}`,
          tag: NotificationTag.event(registration.event!.id),
        },
      });
    });
  }

  after(() =>
    generateRegistrationMailAction({
      eventId,
      participants,
      workspaceURL,
      client,
      config,
    }),
  );

  return {success: true, data: clone(registration)};
}

export async function fetchContacts(props: {
  search: string;
  workspaceURL: string;
}): ActionResponse<Contact[]> {
  const parsed = FetchContactsSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {search, workspaceURL} = parsed.data;
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('Bad request'));
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
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
  workspaceURL: string;
  eventId: ID;
  email: string;
}): ActionResponse<true> {
  const parsed = IsValidParticipantSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {workspaceURL, eventId, email} = parsed.data;
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('Bad request'));
  }
  if (!email) {
    return error(await t('Email is required'));
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {client} = access.tenant;

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) return error(await t('Invalid workspace'));
  const workspace = {...access.workspace, config: workspaceConfig};

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
      workspace.config?.nonPublicEmailNotFoundMessage?.trim()
    ) {
      return error(await tattr(workspace.config.nonPublicEmailNotFoundMessage));
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
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const parsed = CreateCommentPropsSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: await t('Invalid request')};
  }
  const {workspaceURL, workspaceURI, ...rest} = parsed.data;

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }
  const workspace = {...access.workspace, config: workspaceConfig};

  const {workspaceUser} = workspace;
  if (!workspaceUser) {
    return {error: true, message: await t('Workspace user is missing')};
  }

  if (
    !isCommentEnabled({subapp: SUBAPP_CODES.events, config: workspace.config})
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.events];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const event = await findEvent({
    id: rest.recordId,
    workspaceURL,
    client,
    config,
    user,
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
          ...rest,
        }),
    );

    if (parentComment?.partner?.id && parentComment.partner.id !== user.id) {
      const userName = user.simpleFullName || user.name || '';
      const eventUrl = withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.events}/${event.slug}`,
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
              userName,
              event.eventTitle ?? '',
            ),
            body: comment.note ?? '',
            url: `${eventUrl}#comment-${comment.id}`,
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
  const {workspaceURL, ...rest} = parsedComments.data;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }
  const {user} = access;
  const {client} = access.tenant;
  const {config} = access.tenant;

  const workspaceConfig = await getWorkspaceConfig(
    access.workspace.config.id,
    client,
  );
  if (!workspaceConfig) {
    return {error: true, message: await t('Invalid workspace')};
  }
  const workspace = {...access.workspace, config: workspaceConfig};

  if (
    !isCommentEnabled({subapp: SUBAPP_CODES.events, config: workspace.config})
  ) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.events];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const event = await findEvent({
    id: rest.recordId,
    workspaceURL,
    client,
    config,
    user,
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

export const fetchEvent = async (props: {
  slug: string;
  workspaceURL: string;
}): ActionResponse<Cloned<FullEvent>> => {
  const parsed = FetchEventSchema.safeParse(props);
  if (!parsed.success) return error(z.prettifyError(parsed.error));
  const {slug, workspaceURL} = parsed.data;

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('Tenant ID is missing!'));

  const access = await ensureAuth({
    code: SUBAPP_CODES.events,
    url: workspaceURL,
    tenantId,
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
    workspaceURL,
    client,
    config,
    user,
  });
  if (!event) return error(await t('Record not found'));

  return {success: true, data: clone(event)};
};
