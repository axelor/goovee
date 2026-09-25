// ---- CORE IMPORTS ---- //
import type {ID} from '@/types';
import type {Participant} from '../actions/validators';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {USER_CREATED_FROM} from '@/constants';
import {AOSPortalParticipant} from '@/goovee/.generated/models';
import {UserType} from '@/auth/types';
import {PartnerTypeMap} from '@/orm/partner';
import {CreateArgs} from '@goovee/orm';
import {Maybe} from '@/types/util';
import type {Registration} from '@/subapps/events/common/types';

export async function registerParticipants({
  eventId,
  participants,
  client,
}: {
  eventId: ID;
  workspaceURL: string;
  participants: Participant[];
  client: Client;
}): Promise<Registration> {
  const contacts = await getEventContacts({participants, client});

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
        eventTitle: true,
      },
      participantList: {
        select: {
          contact: {
            isActivatedOnPortal: true,
            emailAddress: {address: true},
            localization: {code: true},
          },
        },
      },
    },
  });

  return registration;
}

/* What the registration's push and mail are made of, read the same way
 * whether the registration was just written or is read back later. */
const REGISTRATION_NOTICE_SELECT = {
  event: {
    slug: true,
    eventTitle: true,
    eventPlace: true,
    eventAllDay: true,
    eventStartDateTime: true,
    eventEndDateTime: true,
    eventDescription: true,
  },
  participantList: {
    select: {
      name: true,
      surname: true,
      emailAddress: true,
      subscriptionSet: {select: {facility: true}},
      contact: {
        isActivatedOnPortal: true,
        emailAddress: {address: true},
        localization: {code: true},
      },
    },
  },
} as const;

/** A registration as its push and mail read it, for sending them after it was written. */
export async function findRegistrationNotice({
  id,
  client,
}: {
  id: string;
  client: Client;
}) {
  return client.aOSRegistration.findOne({
    where: {id},
    select: REGISTRATION_NOTICE_SELECT,
  });
}

export type RegistrationNotice = NonNullable<
  Awaited<ReturnType<typeof findRegistrationNotice>>
>;

type EventContact = {
  id: string;
  version: number;
  emailAddress: {id: string; version: number; address: string | null} | null;
  isActivatedOnPortal?: boolean | null;
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
  client,
  id,
  eventId,
}: {
  workspaceURL: string;
  client: Client;
  id: ID;
  eventId: ID;
}) {
  if (![workspaceURL, client, id, eventId].every(Boolean)) {
    return null;
  }

  const result = await client.aOSRegistration.findOne({
    where: {
      id,
      event: {id: eventId},
    },
    select: {id: true},
  });

  return result;
}
