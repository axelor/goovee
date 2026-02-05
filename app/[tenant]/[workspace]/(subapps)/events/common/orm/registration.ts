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
import type {Client} from '@/goovee/.generated/client';

export async function registerParticipants({
  eventId,
  participants,
  client,
}: {
  eventId: ID;
  workspaceURL: string;
  participants: Participant[];
  client: Client;
}): Promise<{id: ID; version: number}> {
  const contacts = await getEventContacts({
    participants,
    client,
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

  const registration = await client.aOSRegistration.create({
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
  client,
}: {
  participants: Participant[];
  client: Client;
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
        const partners = await client.aOSPartner.find({
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

        const eventContact = await client.aOSPartner.create({
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

export async function removeRegistration({
  registration,
  tenantId,
}: {
  registration: {id: string; version: number};
  tenantId: Tenant['id'];
}) {
  const client = await manager.getClient(tenantId);
  await client.aOSPortalParticipant.deleteAll({
    where: {
      registration: {id: registration.id},
    },
  });
  await client.aOSRegistration.delete({
    id: registration.id,
    version: registration.version,
  });
}

export async function removeParticipantFromRegistration({
  tenantId,
  registration,
  participant,
}: {
  tenantId: Tenant['id'];
  registration: {id: string; version: number};
  participant: {id: string; version: number};
}) {
  const client = await manager.getClient(tenantId);
  await client.$transaction(async client => {
    await client.aOSRegistration.update({
      data: {
        id: registration.id,
        version: registration.version,
        participantList: {
          remove: [participant.id],
        },
      },
      select: {id: true, participantList: {select: {id: true}}},
    });
    await client.aOSPortalParticipant.delete({
      id: participant.id,
      version: participant.version + 1, // incrementing version since remove operation increments version
    });
  });
}
