import {getTranslation, t, tattr} from '@/locale/server';
import {getSession} from '@/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import type {Tenant} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import {
  error,
  isEventPrivate,
  isEventPublic,
  isLoginNeededForRegistration,
} from '@/subapps/events/common/utils';
import {SUBAPP_CODES} from '@/constants';
import {PortalWorkspace, Participant, User, Subapp} from '@/types';
import {ActionResponse} from '@/types/action';
import {REQUIRED_FIELDS} from '../constants';
import {EventConfig, findEventConfig} from '../orm/event';
import {
  validateRequiredFormFields,
  getParticipantsFromValues,
  getTotalRegisteredParticipants,
  canEmailBeRegistered,
  isAlreadyRegistered,
} from '../utils/registration';
import {hasRegistrationEnded} from '../utils';

type ValidationResult = {
  error: null | boolean;
  message?: string;
};

export async function validate(validators: Function[]) {
  for (const validator of validators) {
    if (typeof validator !== 'function') {
      throw new Error('Validator is not a function');
    }

    const result = await validator();
    if (result?.error) {
      return result;
    }
  }
  return {error: null};
}

export async function withAuth(
  {
    tenantId,
  }: {
    tenantId: Tenant['id'];
  } = {tenantId: ''},
): Promise<ValidationResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return {
      error: true,
      message: await getTranslation({tenant: tenantId}, 'Unauthorized'),
    };
  }
  return {error: null};
}

export function withSubapp(code: string, url: string, tenantId: Tenant['id']) {
  return async function () {
    const session = await getSession();
    const user = session?.user;

    const subapp = await findSubappAccess({code, user, url, tenantId});

    if (!subapp) {
      return error(await t('Unauthorized'));
    }

    return {error: null};
  };
}

export function withWorkspace(
  url: string,
  tenantId: Tenant['id'],
  config?: {checkAuth?: boolean},
) {
  return async function (): Promise<ValidationResult> {
    if (config?.checkAuth) {
      const result = await withAuth({tenantId});
      if (result?.error) return result;
      return {error: null};
    }

    const session = await getSession();
    const user = session?.user;

    const workspace = await findWorkspace({user, url, tenantId});

    if (!workspace) {
      return {
        error: true,
        message: await getTranslation({tenant: tenantId}, 'Invalid workspace'),
      };
    }

    return {error: null};
  };
}

export async function validateRegistration({
  tenantId,
  eventId,
  values,
  workspaceURL,
}: {
  eventId: string;
  values: any;
  workspaceURL: string;
  tenantId: Tenant['id'];
}): ActionResponse<{
  workspace: PortalWorkspace;
  event: EventConfig;
  participants: Participant[];
  user?: User;
  subapp: Subapp;
}> {
  if (!eventId) return error(await t('Event ID is missing!'));
  if (!values) return error(await t('Values are missing!'));
  // TODO: Handle the form validation here
  if (!Object.keys(values)?.length) {
    return error(await t('Form values are missing'));
  }
  const validationResult = await validateRequiredFormFields(
    values,
    REQUIRED_FIELDS,
    t,
  );
  if (validationResult) {
    return error(validationResult.error);
  }
  if (!workspaceURL) return error(await t('Workspace is missing!'));

  const session = await getSession();
  const user = session?.user;

  const workspace = await findWorkspace({user, url: workspaceURL, tenantId});
  if (!workspace) return error(await t('Invalid workspace'));

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.events,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!subapp) {
    return {error: true, message: await t('Unauthorized Access')};
  }

  if (!workspace.config?.allowGuestEventRegistration && !user) {
    return error(
      await t(
        'Guest registration is not allowed for this workspace, Please login',
      ),
    );
  }

  const isCompanyOrAddressRequired =
    workspace?.config?.isCompanyOrAddressRequired;
  if (isCompanyOrAddressRequired && !values.company?.trim()) {
    return error(
      await t('Company/Address is required. Please enter a valid value.'),
    );
  }

  const event = await findEventConfig({id: eventId, tenantId, workspaceURL});
  if (!event) return error(await t('Event not found'));

  if (!event.eventAllowRegistration) {
    return error(await t('Registration not started for this event'));
  }

  if (hasRegistrationEnded(event)) {
    return error(await t('Registration has already ended'));
  }

  if (isLoginNeededForRegistration(event) && !user) {
    return error(
      await t('Guest registration is not allowed for this event, Please login'),
    );
  }

  try {
    const {otherPeople = []} = values;

    if (!event.eventAllowMultipleRegistrations && otherPeople?.length) {
      return error(await t('Multiple registrations not allowed'));
    }

    const participants = getParticipantsFromValues(values);

    const totalRegisteredParticipants = getTotalRegisteredParticipants(event);
    const maxParticipantPerEvent = event.maxParticipantPerEvent || 0;
    if (totalRegisteredParticipants >= maxParticipantPerEvent) {
      return error(
        await t('Max participants reached. No more registrations allowed'),
      );
    }
    if (
      totalRegisteredParticipants + participants.length >
      maxParticipantPerEvent
    ) {
      const slotsLeft = maxParticipantPerEvent - totalRegisteredParticipants;
      return error(
        slotsLeft === 1
          ? await t('Only one slot left')
          : await t('Only {0} slots left', String(slotsLeft)),
      );
    }

    const maxParticipantPerRegistration =
      event.maxParticipantPerRegistration || 1;
    if (participants.length > maxParticipantPerRegistration) {
      return error(
        await t(
          'You can only register up to {0} people',
          String(maxParticipantPerRegistration),
        ),
      );
    }

    if (!participants.every(participant => participant.emailAddress)) {
      return error(await t('Email is required'));
    }

    if (
      !isEventPublic(event) &&
      new Set(participants.map(p => p.emailAddress)).size !==
        participants.length
    ) {
      return error(await t('Individual email address must be unique'));
    }

    const canRegisterList = await Promise.all(
      participants.map(participant =>
        canEmailBeRegistered({
          event,
          email: participant.emailAddress,
          tenantId,
        }),
      ),
    );

    const canAllEmailBeRegistered = canRegisterList.every(Boolean);
    if (!canAllEmailBeRegistered) {
      if (
        !isEventPrivate(event) &&
        !isEventPublic(event) &&
        workspace.config?.nonPublicEmailNotFoundMessage?.trim()
      ) {
        return error(
          await tattr(workspace.config.nonPublicEmailNotFoundMessage),
        );
      }
      return error(
        await t('one or more email can not be registered to this event'),
      );
    }

    const isAnyEmailAlreadyRegistered = participants.some(participant =>
      isAlreadyRegistered({event, email: participant.emailAddress}),
    );
    if (isAnyEmailAlreadyRegistered) {
      return error(await t('Some email is already registered to this event'));
    }

    return {
      success: true,
      data: {
        workspace,
        event,
        participants,
        user,
        subapp,
      },
    };
  } catch (err) {
    console.error(err);
    return error(await t('Something went wrong during validation!'));
  }
}
