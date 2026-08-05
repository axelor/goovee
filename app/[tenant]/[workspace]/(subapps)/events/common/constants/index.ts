export const LIMIT = 7;

export const PORTAL_PARTICIPANT_MODEL =
  'com.axelor.apps.portal.db.PortalParticipant';

export const CONTACT_ATTRS = 'contactAttrs';
export const SUCCESS_REGISTER_MESSAGE =
  'You have been successfully registered to this event.';
export const MY_REGISTRATIONS = 'My registrations';
export const EVENTS = {
  MY_REGISTRATIONS: 'my-registrations',
};

export const EVENT_TYPE = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  PAST: 'past',
  ACTIVE: 'active', // either ongoing or upcoming
};

export const MY_REGISTRATION_TAB_ITEMS = [
  {
    id: '0',
    title: 'Upcoming events',
    label: EVENT_TYPE.UPCOMING,
  },

  {
    id: '1',
    title: 'Ongoing events',
    label: EVENT_TYPE.ONGOING,
  },
  {
    id: '2',
    title: 'Past events',
    label: EVENT_TYPE.PAST,
  },
];

export enum EVENT_STATUS {
  DRAFT = 0,
  PUBLISHED = 1,
}

export const URL_PARAMS = {
  isPaid: 'isPaid',
  type: 'type',
  category: 'category',
  page: 'page',
};
