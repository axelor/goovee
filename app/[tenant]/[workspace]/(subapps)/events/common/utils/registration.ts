import type {Tenant} from '@/lib/core/tenant';
import type {Participant} from '@/types';
import {
  type EventConfig,
  type EventConfigPartner,
  findPartnerByEmailForEvent,
} from '../orm/event';
import {isEventPrivate, isEventPublic} from './index';

export function isAlreadyRegistered({
  event,
  email,
}: {
  event: EventConfig;
  email: string;
}) {
  return event.registrationList?.some(registration => {
    return registration?.participantList?.some(
      participant =>
        participant?.emailAddress?.toLowerCase() === email.toLowerCase(),
    );
  });
}

export async function canEmailBeRegistered({
  event,
  email,
  tenantId,
}: {
  tenantId: Tenant['id'];
  event: EventConfig;
  email: string;
}): Promise<boolean> {
  if (isEventPrivate(event)) {
    return canRegisterToPrivateEvent({privateEvent: event, email});
  }
  if (isEventPublic(event)) {
    return true;
  }
  return await canRegisterToNonPublicEvent({email, tenantId});
}

export async function canRegisterToNonPublicEvent({
  email,
  tenantId,
}: {
  tenantId: Tenant['id'];
  email: string;
}): Promise<boolean> {
  const partner = await findPartnerByEmailForEvent(email, tenantId);
  if (!partner?.id || !partner.canSubscribeNoPublicEvent) {
    return false;
  }
  return true;
}

export function canRegisterToPrivateEvent({
  privateEvent,
  email,
}: {
  privateEvent: EventConfig;
  email: string;
}): boolean {
  return !!(
    email &&
    getAllowedEmailsForPrivateEvent(privateEvent).has(email.toLowerCase())
  );
}

export function getAllowedEmailsForPrivateEvent(
  privateEvent: EventConfig,
): Set<string> {
  const allowedEmails =
    privateEvent.partnerCategorySet?.flatMap(category => {
      return category.partners?.flatMap(partner =>
        getPortalUserEmails(partner),
      );
    }) || []; // add emails from partnerCategorySet
  allowedEmails.push(
    ...(privateEvent.partnerSet?.flatMap(partner =>
      getPortalUserEmails(partner),
    ) ?? []),
  ); // add emails from partnerSet
  return new Set(allowedEmails.filter(Boolean) as string[]);
}

export function getPortalUserEmails(partner: EventConfigPartner): string[] {
  const emails = isPortalUser(partner)
    ? [partner.emailAddress?.address?.toLowerCase()]
    : []; // add the partner email
  const isCustomer =
    !partner.isContact && (partner.isProspect || partner.isCustomer);
  if (isCustomer) {
    // if partner is a customer, then add emails of its contactPartners
    emails.push(
      ...(partner.contactPartnerSet
        ?.filter(isPortalUser)
        .map(contactPartner => contactPartner.emailAddress?.address) ?? []),
    );
  }
  return emails.filter(Boolean) as string[];
}

export function isPortalUser(partner: {
  isActivatedOnPortal?: boolean;
}): boolean {
  return !!partner.isActivatedOnPortal;
}

export function getTotalRegisteredParticipants(event: EventConfig): number {
  if (!event.registrationList) return 0;
  return event.registrationList.reduce((acc, registration) => {
    return acc + (registration.participantList?.length || 0);
  }, 0);
}

//TODO: create a zod schema instead of manual validation
//This requires refctoring the registration form entirely
export const validateRequiredFormFields = async (
  values: Record<string, any>,
  requiredFields: {field: string; message: string}[],
  t: (key: string, ...args: any[]) => Promise<string>,
) => {
  const errors: string[] = [];

  for (const {field, message} of requiredFields) {
    const value = values[field];
    if (!value || (typeof value === 'string' && !value.trim())) {
      errors.push(await t('Participant {0}: {1}', 1, message));
    }
  }

  const otherPeople = values.otherPeople || [];
  for (const [index, person] of otherPeople.entries()) {
    for (const {field, message} of requiredFields) {
      const value = person[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors.push(await t('Person {0}: {1}', `${index + 2}`, message));
      }
    }
  }

  return errors.length ? {error: errors.join(', ')} : null;
};

export function getParticipantsFromValues(values: any): Participant[] {
  const {otherPeople = [], ...rest} = values;

  const participants: Participant[] = otherPeople.map(
    (participant: Participant) => ({
      ...participant,
      emailAddress: participant.emailAddress?.toLowerCase(),
    }),
  );
  participants.unshift(rest);
  participants.sort((a, b) => a.sequence - b.sequence);
  return participants;
}
