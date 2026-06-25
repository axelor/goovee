import {t, tattr} from '@/locale/server';
import type {Cloned} from '@/types/util';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {
  error,
  isEventPrivate,
  isEventPublic,
  isLoginNeededForRegistration,
} from '@/subapps/events/common/utils';
import {User} from '@/types';
import {type Participant} from './validators';
import {PortalWorkspace} from '@/orm/workspace';
import {ActionResponse} from '@/types/action';
import {findEventConfig} from '../orm/event';
import {
  getParticipantsFromValues,
  getTotalRegisteredParticipants,
  canEmailBeRegistered,
  isAlreadyRegistered,
} from '../utils/registration';
import {hasRegistrationEnded} from '../utils';
import {type RegistrationValues} from './validators';

/**
 * Validates the registration request against the event's rules. Access is
 * gated by the calling action via ensureAuth; this only enforces registration
 * policy, so the caller passes the resolved workspace and user in.
 */
export async function validateRegistration({
  eventId,
  values,
  workspaceURL,
  workspace,
  user,
  client,
}: {
  eventId: string;
  values: RegistrationValues;
  workspaceURL: string;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  user?: User;
  client: Client;
}): ActionResponse<{participants: Participant[]}> {
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

  const event = await findEventConfig({id: eventId, client, workspaceURL});
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
          client,
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
      data: {participants},
    };
  } catch (err) {
    console.error(err);
    return error(await t('Something went wrong during validation!'));
  }
}
