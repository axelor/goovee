// ---- CORE IMPORTS ---- //
import {manager, type Tenant} from '@/tenant';
import type {ID, Participant} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {USER_CREATED_FROM} from '@/constants';
import {AOSPortalParticipant} from '@/goovee/.generated/models';
import {UserType} from '@/lib/core/auth/types';
import {PartnerTypeMap} from '@/orm/partner';
import {CreateArgs} from '@goovee/orm';
import {Maybe} from '@/types/util';

export async function registerParticipants({
  eventId,
  participants,
  tenantId,
}: {
  eventId: ID;
  workspaceURL: string;
  participants: Participant[];
  tenantId: Tenant['id'];
}): Promise<{id: ID; version: number}> {
  const c = await manager.getClient(tenantId);

  const contacts = await getEventContacts({
    participants,
    tenantId,
  });

  const timeStamp = new Date();

  const participantList = participants.map(
    (participant): CreateArgs<AOSPortalParticipant> => {
      const {
        phone,
        sequence,
        surname,
        name,
        emailAddress,
        subscriptionSet,
        company,
        contactAttrs,
      } = participant;

      const contact = contacts.find(
        c =>
          emailAddress &&
          c.emailAddress?.address?.toLowerCase() === emailAddress.toLowerCase(),
      );

      function parse(value: Maybe<string>) {
        if (value) {
          try {
            return JSON.parse(value);
          } catch (e) {
            console.error(e);
          }
        }
      }

      return {
        company,
        name,
        surname,
        emailAddress: emailAddress.toLowerCase(),
        phone,
        contactAttrs: parse(contactAttrs),
        sequence,
        createdOn: timeStamp,
        updatedOn: timeStamp,
        ...(contact && {contact: {select: {id: contact.id}}}),
        ...(!!subscriptionSet?.length && {
          subscriptionSet: {select: subscriptionSet.map(s => ({id: s.id}))},
        }),
      };
    },
  );

  const registration = await c.aOSRegistration.create({
    data: {
      event: {select: {id: eventId}},
      participantList: {create: participantList},
      createdOn: timeStamp,
      updatedOn: timeStamp,
    },
    select: {
      event: {
        slug: true,
      },
    },
  });

  return registration;
}

type EventContact = {
  id: string;
  emailAddress?: {address?: string};
};

export async function getEventContacts({
  participants,
  tenantId,
}: {
  participants: Participant[];
  tenantId: Tenant['id'];
}): Promise<EventContact[]> {
  const partners = await Promise.all(
    participants
      .toSorted((a, b) => a.sequence - b.sequence)
      .filter(
        (p, i, self) =>
          p.emailAddress &&
          self.findIndex(
            s => s.emailAddress.toLowerCase() === p.emailAddress.toLowerCase(),
          ) === i,
      ) // Filter out duplicate emails
      .map(async participant => {
        const {emailAddress, name, surname, company, phone} = participant;
        const c = await manager.getClient(tenantId);
        const partners = await c.aOSPartner.find({
          where: {
            emailAddress: {
              OR: [
                {address: emailAddress},
                {address: emailAddress.toLowerCase()},
              ],
            },
            OR: [{archived: false}, {archived: null}],
          },
          select: {emailAddress: {address: true}, isActivatedOnPortal: true},
        });
        if (partners.length) {
          if (partners.length === 1) return partners[0];
          return partners.find(p => p.isActivatedOnPortal) ?? partners[0];
        }

        const eventContact = await c.aOSPartner.create({
          data: {
            partnerTypeSelect: PartnerTypeMap[UserType.individual],
            emailAddress: {
              create: {
                address: emailAddress.toLowerCase(),
                name: emailAddress.toLowerCase(),
              },
            },
            name: surname,
            firstName: name,
            fullName: `${surname} ${name || ''}`.trim(),
            simpleFullName: `${surname} ${name || ''}`.trim(),
            isContact: false,
            isCustomer: false,
            isProspect: false,
            createdFromSelect: USER_CREATED_FROM,
            isActivatedOnPortal: false,
            isPublicPartner: true,
            portalCompanyName: company,
            mobilePhone: phone,
            createdOn: new Date(),
            updatedOn: new Date(),
          },
          select: {emailAddress: {address: true}},
        });
        return eventContact;
      }),
  );
  return partners;
}

export async function findEventRegistration({
  workspaceURL,
  tenantId,
  id,
  eventId,
}: {
  workspaceURL: string;
  tenantId: Tenant['id'];
  id: ID;
  eventId: ID;
}) {
  if (![workspaceURL, tenantId, id, eventId].every(Boolean)) {
    return null;
  }

  const client = await manager.getClient(tenantId);
  if (!client) return null;

  const result = await client.aOSRegistration.findOne({
    where: {
      id,
      event: {id: eventId},
    },
    select: {id: true},
  });

  return result;
}
