import icalgen, {
  ICalCalendarMethod,
  ICalEvent,
  ICalEventData,
} from 'ical-generator';

// ---- CORE IMPORTS ---- //
import {Participant} from '@/types';
import type {ErrorResponse} from '@/types/action';
import {extractCustomData} from '@/ui/form';
import {isSameDay} from '@/utils/date';

// ---- LOCAL IMPORTS ---- //
import {
  EVENT_TAB_ITEMS,
  MY_REGISTRATION_TAB_ITEMS,
} from '@/subapps/events/common/constants';
import type {ListEvent} from '@/subapps/events/common/ui/components';
import {endOfDay} from 'date-fns';

export const datesBetweenTwoDates = (data: ListEvent[]): Date[] => {
  const Dates: Date[] = [];

  data.forEach(event => {
    const startDate = new Date(event.eventStartDateTime);

    if (event.eventAllDay) {
      Dates.push(
        new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
        ),
      );
      return;
    }

    const endDate = new Date(event.eventEndDateTime);
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      Dates.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    Dates.push(
      new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()),
    );
  });

  const uniqueDates = Dates.filter(
    (date, index, self) => index === self.findIndex(d => isSameDay(d, date)),
  );

  return uniqueDates;
};

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

export const generateIcs = (
  event: any,
  participants: Pick<Participant, 'emailAddress' | 'name' | 'surname'>[],
  method?: ICalCalendarMethod,
) => {
  const attendees: any = participants.map(participant => ({
    email: participant.emailAddress,
    name: `${participant.name} ${participant.surname}`,
    rsvp: true,
    role: 'REQ-PARTICIPANT',
    status: 'NEEDS-ACTION',
  }));

  return ical(
    {
      start: event.eventStartDateTime,
      end: getEventEndDate(event),
      summary: event.eventTitle,
      location: event.eventPlace,
      description: event.eventDescription,
      attendees,
    },
    {method},
  );
};

export function mapParticipants(
  formValues: any,
  metaFields: any,
  metaFieldsFacilities: any,
  additionalFieldSet: any,
) {
  const data = extractCustomData(formValues, 'contactAttrs', [
    ...metaFields,
    ...metaFieldsFacilities,
    ...additionalFieldSet,
  ]);
  data.sequence = 0;

  data.otherPeople =
    data.otherPeople?.map((person: any, index: number) => ({
      ...extractCustomData(person, 'contactAttrs', [
        ...metaFields,
        ...metaFieldsFacilities,
        ...additionalFieldSet,
      ]),
      sequence: index + 1,
    })) ?? [];

  return data;
}

export function getPartnerAddress(user: any): string {
  if (!user) return '';

  const partnerAddresses =
    (user.isContact
      ? user.mainPartner?.partnerAddressList
      : user.partnerAddressList) ?? [];

  if (partnerAddresses.length === 0) return '';

  const address =
    partnerAddresses.find(
      (addr: any) => addr.isInvoicingAddr && addr.isDefaultAddr,
    )?.address ||
    partnerAddresses.find((addr: any) => addr.isInvoicingAddr)?.address ||
    partnerAddresses[0]?.address;

  const fullName = user?.mainPartner?.simpleFullName || '';

  return `${fullName}${fullName ? '\n' : ''}${address?.formattedFullName || ''}`;
}

export function getEventEndDate(event: {
  eventStartDateTime?: Date | string;
  eventEndDateTime?: Date | string;
  eventAllDay?: boolean;
}): string | Date | undefined {
  const {eventStartDateTime, eventEndDateTime, eventAllDay} = event;

  if (eventAllDay) {
    if (!eventStartDateTime) return;
    return endOfDay(eventStartDateTime);
  }
  return eventEndDateTime;
}

export function isLoginNeededForRegistration(event: {
  isPrivate?: boolean;
  isLoginNotNeeded?: boolean;
}): boolean {
  return event.isPrivate || !event.isLoginNotNeeded;
}

export function isEventPublic(event: {
  isPrivate?: boolean;
  isPublic?: boolean;
  isLoginNotNeeded?: boolean;
}): boolean {
  return !!(!event.isPrivate && event.isLoginNotNeeded && event.isPublic);
}

export function isEventPrivate(event: {
  isPrivate?: boolean;
  isPublic?: boolean;
  isLoginNotNeeded?: boolean;
}): boolean {
  return !!event.isPrivate;
}
export const getTabItems = (
  tabs: {
    id: string;
    title: string;
    label: string;
  }[],
  isLarge: boolean,
) => {
  return isLarge
    ? tabs
    : tabs.map(item => ({...item, title: item.title.split(' ')[0]}));
};

export function hasRegistrationEnded(event: {
  registrationDeadlineDateTime?: Date | string | null;
}): boolean {
  if (event.registrationDeadlineDateTime) {
    const endDate = new Date(event.registrationDeadlineDateTime);
    const now = Date.now();
    return now > endDate.getTime();
  }
  return false;
}
