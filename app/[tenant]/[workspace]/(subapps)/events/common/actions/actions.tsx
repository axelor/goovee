'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ----//
import {getSession} from '@/auth';
import {
  CreateComment,
  CreateCommentPropsSchema,
  FetchComments,
  FetchCommentsPropsSchema,
  isCommentEnabled,
} from '@/comments';
import {addComment, findComments} from '@/comments/orm';
import {ModelMap, SUBAPP_CODES} from '@/constants';
import {t, tattr} from '@/locale/server';
import {TENANT_HEADER} from '@/middleware';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {ID, PaymentOption, PortalWorkspace, User} from '@/types';
import {ActionResponse} from '@/types/action';
import {clone, scale} from '@/utils';
import {zodParseFormData} from '@/utils/formdata';
import {markPaymentAsProcessed} from '@/payment/common/orm';

// ---- LOCAL IMPORTS ---- //
import {
  validate,
  validateRegistration,
  withSubapp,
  withWorkspace,
} from '@/subapps/events/common/actions/validation';
import {
  findEvent,
  findEventConfig,
  findEvents,
} from '@/subapps/events/common/orm/event';
import {createInvoice} from '@/subapps/events/common/orm/invoice';
import {findContacts} from '@/subapps/events/common/orm/partner';
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

export async function getAllEvents({
  limit,
  page,
  categories,
  search,
  day,
  month,
  year,
  dates,
  workspace,
  tenantId,
  user,
  onlyRegisteredEvent = false,
}: {
  limit?: number;
  page?: number;
  categories?: any[];
  filter?: string;
  search?: string;
  day?: string | number;
  month?: number;
  year?: number;
  dates?: [Date | undefined];
  workspace?: any;
  tenantId?: any;
  user?: User;
  onlyRegisteredEvent?: boolean;
}) {
  tenantId = (await headers()).get(TENANT_HEADER) || tenantId;

  if (!(workspace && tenantId)) {
    return {events: [], pageInfo: null};
  }
  const workspaceURL = workspace.url;

  const result = await validate([
    withWorkspace(workspaceURL, tenantId, {checkAuth: false}),
    withSubapp(SUBAPP_CODES.events, workspaceURL, tenantId),
  ]);

  if (result.error) {
    return result;
  }
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
      workspace,
      tenantId,
      user,
      onlyRegisteredEvent,
    }).then(clone);
    return {events, pageInfo};
  } catch (err) {
    console.log(err);
  }
}

// TODO: How to know if the amount paid is for the appropriate event only
export async function register({
  eventId,
  values: _values,
  workspace: {url: workspaceURL},
  payment,
}: {
  eventId: any;
  workspace: {url: PortalWorkspace['url']};
  values?: any;
  payment?: {data: {id?: string; params?: any}; mode: PaymentOption};
}): ActionResponse<{id: ID; version: number}> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('Tenant ID is missing!'));

  const $event = await findEvent({
    id: eventId,
    workspace: {url: workspaceURL},
    tenantId: tenantId,
  });
  if (!$event) return error(await t('Event not found!'));

  let paidAmount, values, context;
  if (payment) {
    const paymentInfo = await getPaymentInfo({
      mode: payment.mode,
      data: payment.data,
      tenantId,
    });

    if (paymentInfo.error) return paymentInfo;

    values = paymentInfo.data.context.data;
    paidAmount = paymentInfo.data.amount;
    context = paymentInfo.data.context;
  } else {
    values = _values;
    paidAmount = 0;
  }

  const validationResult = await validateRegistration({
    tenantId,
    eventId,
    values,
    workspaceURL,
  });

  if (!validationResult.success) {
    return validationResult;
  }

  const {workspace, participants} = validationResult.data;

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

  const registration = await registerParticipants({
    eventId,
    participants,
    workspaceURL,
    tenantId,
  });

  if (context) {
    await markPaymentAsProcessed({
      contextId: context.id,
      version: context.version,
      tenantId,
    });
  }
  if (paidAmount > 0) {
    createInvoice({
      workspace,
      tenantId,
      registrationId: registration.id,
      currencyCode: $event.currency?.code,
    }).then(res => {
      if (res.error) {
        console.error('Invoice creation failed:', res.message);
      }
    });
  }
  generateRegistrationMailAction({
    eventId,
    participants,
    workspaceURL,
    tenantId,
  });

  return {success: true, data: clone(registration)};
}

export async function fetchContacts({
  search,
  workspaceURL,
}: {
  search: string;
  workspaceURL: string;
}) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('Bad request'));
  }

  const result = await validate([
    withWorkspace(workspaceURL, tenantId, {checkAuth: false}),
    withSubapp(SUBAPP_CODES.events, workspaceURL, tenantId),
  ]);

  if (result.error) {
    return result;
  }

  try {
    const result = await findContacts({search, workspaceURL, tenantId}).then(
      clone,
    );
    return result;
  } catch (err) {
    console.log(err);
    return error(await t('Something went wrong'));
  }
}

export async function isValidParticipant(props: {
  workspaceURL: string;
  eventId: ID;
  email: string;
}): ActionResponse<true> {
  const {workspaceURL, eventId, email} = props;
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return error(await t('Bad request'));
  }
  if (!email) {
    return error(await t('Email is required'));
  }

  const session = await getSession();
  const user = session?.user;

  const workspace = await findWorkspace({user, url: workspaceURL, tenantId});
  if (!workspace) return error(await t('Invalid workspace'));

  const result = await validate([
    withSubapp(SUBAPP_CODES.events, workspaceURL, tenantId),
  ]);

  if (result.error) {
    return result;
  }

  const event = await findEventConfig({
    id: eventId,
    tenantId,
    workspaceURL,
  });

  if (!event) {
    return error(await t('Event not found'));
  }

  if (!(await canEmailBeRegistered({event, email, tenantId}))) {
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

  if (!isCommentEnabled({subapp: SUBAPP_CODES.events, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.events];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.events,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  const event = await findEvent({
    id: rest.recordId,
    workspace,
    tenantId,
    user,
  });
  if (!event) {
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

  if (!isCommentEnabled({subapp: SUBAPP_CODES.events, workspace})) {
    return {error: true, message: await t('Comments are not enabled')};
  }

  const modelName = ModelMap[SUBAPP_CODES.events];
  if (!modelName) {
    return {error: true, message: await t('Invalid model type')};
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.events,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!app?.isInstalled) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  const event = await findEvent({
    id: rest.recordId,
    workspace,
    tenantId,
    user,
  });
  if (!event) {
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

export const fetchEvent = async ({
  slug,
  workspaceURL,
}: {
  slug: string;
  workspaceURL: string;
}) => {
  if (!slug) return error(await t('Missing event slug'));
  if (!workspaceURL) return error(await t('Workspace URL is missing'));

  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) return error(await t('Tenant ID is missing!'));

  const session = await getSession();
  const user = session?.user;

  const workspace = await findWorkspace({user, url: workspaceURL, tenantId});
  if (!workspace) return error(await t('Invalid workspace'));

  const subappValidation = await validate([
    withSubapp(SUBAPP_CODES.events, workspaceURL, tenantId),
  ]);
  if (subappValidation.error) return subappValidation;

  const event = await findEvent({
    slug,
    workspace,
    tenantId,
    user,
  });
  if (!event) return error(await t('Record not found'));

  return {success: true, data: clone(event)};
};
