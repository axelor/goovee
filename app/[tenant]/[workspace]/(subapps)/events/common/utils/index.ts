import icalgen, {
  ICalCalendarMethod,
  ICalEvent,
  ICalEventData,
  ICalAttendeeRole,
  ICalAttendeeStatus,
  type ICalAttendeeData,
} from 'ical-generator';

// ---- CORE IMPORTS ---- //
import type {Participant} from '@/subapps/events/common/actions/validators';
import type {ErrorResponse} from '@/types/action';
import {extractCustomData} from '@/ui/form';

// ---- LOCAL IMPORTS ---- //
import type {FullEvent} from '@/subapps/events/common/orm/event';
import type {
  PartnerAddress,
  UserWithAddress,
} from '@/subapps/events/common/types';
import type {RegistrationValues} from '@/subapps/events/common/actions/validators';

type IcsEvent = Pick<
  FullEvent,
  | 'eventTitle'
  | 'eventPlace'
  | 'eventDescription'
  | 'eventAllDay'
  | 'eventStartDateTime'
  | 'eventEndDateTime'
>;
import {endOfDay} from 'date-fns';

export function error(message: string): ErrorResponse {
  return {
    error: true,
    message,
  };
}

export function ical(
  details: ICalEvent | ICalEventData,
  options: {
    name?: string;
    method?: ICalCalendarMethod;
    timezone?: string;
  } = {},
): string {
  const {name, method, timezone} = options;
  const calendar = icalgen({name: name || 'Calendar'});

  calendar.method(method || ICalCalendarMethod.REQUEST);

  if (timezone) {
    calendar.timezone(timezone);
  }

  calendar.createEvent(details);
  return calendar.toString();
}

export const generateIcs = (event: IcsEvent, participants: Participant[]) => {
  const attendees: ICalAttendeeData[] = participants
    .filter(p => p.emailAddress)
    .map(p => ({
      email: p.emailAddress!,
      name: `${p.name} ${p.surname}`,
      rsvp: true,
      role: ICalAttendeeRole.REQ,
      status: ICalAttendeeStatus.NEEDSACTION,
    }));

  return ical({
    start: event.eventStartDateTime ?? new Date(),
    end: getEventEndDate(event) ?? undefined,
    summary: event.eventTitle ?? undefined,
    location: event.eventPlace ?? undefined,
    description: event.eventDescription ?? undefined,
    attendees,
  });
};

export type MetaField = {name: string};

export function mapParticipants(
  formValues: RegistrationValues & Record<string, unknown>,
  metaFields: MetaField[],
  metaFieldsFacilities: MetaField[],
  additionalFieldSet: MetaField[],
): RegistrationValues {
  const customFields = [
    ...metaFields,
    ...metaFieldsFacilities,
    ...additionalFieldSet,
  ];
  const data = {
    ...extractCustomData(formValues, 'contactAttrs', customFields),
    sequence: 0,
    otherPeople: (formValues.otherPeople ?? []).map((person, index) => ({
      ...extractCustomData(person, 'contactAttrs', customFields),
      sequence: index + 1,
    })),
  };

  return data as unknown as RegistrationValues;
}

export function getPartnerAddress(
  user: UserWithAddress | null | undefined,
): string {
  if (!user) return '';

  const partnerAddresses =
    (user.isContact
      ? user.mainPartner?.partnerAddressList
      : user.partnerAddressList) ?? [];

  if (partnerAddresses.length === 0) return '';

  const address =
    partnerAddresses.find(
      (addr: PartnerAddress) => addr.isInvoicingAddr && addr.isDefaultAddr,
    )?.address ||
    partnerAddresses.find((addr: PartnerAddress) => addr.isInvoicingAddr)
      ?.address ||
    partnerAddresses[0]?.address;

  const fullName = user?.mainPartner?.simpleFullName || '';

  return `${fullName}${fullName ? '\n' : ''}${address?.formattedFullName || ''}`;
}

export function getEventEndDate(event: {
  eventStartDateTime: Date | string | null;
  eventEndDateTime: Date | string | null;
  eventAllDay: boolean | null;
}): string | Date | null {
  const {eventStartDateTime, eventEndDateTime, eventAllDay} = event;

  if (eventAllDay) {
    if (!eventStartDateTime) return null;
    const startDate =
      typeof eventStartDateTime === 'string'
        ? new Date(eventStartDateTime)
        : eventStartDateTime;
    return endOfDay(startDate);
  }
  return eventEndDateTime;
}

export function isLoginNeededForRegistration(event: {
  isPrivate: boolean | null;
  isLoginNotNeeded: boolean | null;
}): boolean {
  return event.isPrivate || !event.isLoginNotNeeded;
}

export function isEventPublic(event: {
  isPrivate: boolean | null;
  isPublic: boolean | null;
  isLoginNotNeeded: boolean | null;
}): boolean {
  return !!(!event.isPrivate && event.isLoginNotNeeded && event.isPublic);
}

export function isEventPrivate(event: {
  isPrivate: boolean | null;
  isPublic: boolean | null;
  isLoginNotNeeded: boolean | null;
}): boolean {
  return !!event.isPrivate;
}
export function hasRegistrationEnded(event: {
  registrationDeadlineDateTime: Date | string | null;
  eventStartDateTime: Date | string | null;
  eventEndDateTime: Date | string | null;
}): boolean {
  const {registrationDeadlineDateTime, eventStartDateTime, eventEndDateTime} =
    event;

  if (registrationDeadlineDateTime) {
    return Date.now() > new Date(registrationDeadlineDateTime).getTime();
  }

  /* Without a deadline, registration runs until the event is over: until the end
   * date, or the whole starting day when there is no end date. The day boundary
   * is taken in UTC so the browser and the server agree on it. An event with no
   * dates at all never closes. */
  const eventEnd = Math.max(
    eventEndDateTime ? new Date(eventEndDateTime).getTime() : 0,
    eventStartDateTime
      ? new Date(eventStartDateTime).setUTCHours(23, 59, 59, 999)
      : 0,
  );

  return eventEnd > 0 && Date.now() > eventEnd;
}
