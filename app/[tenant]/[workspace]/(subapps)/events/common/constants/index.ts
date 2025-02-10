export const LIMIT = 7;

export const PORTAL_PARTICIPANT_MODEL =
  'com.axelor.apps.portal.db.PortalParticipant';

export const CONTACT_ATTRS = 'contactAttrs';
export const SUCCESS_REGISTER_MESSAGE =
  'You have been successfully registered to this event.';
export const CATEGORIES = 'Categories';

export const REGISTER_TO_EVENT = 'Register to the event';
export const REGISTER_TAG = '#Registered';

export const EVENTS_NAVBAR_LINKS = [
  {
    id: 1,
    title: 'Events',
    redirectTo: '/',
    validate: false,
  },
  {
    id: 2,
    title: 'My registrations',
    redirectTo: '/my-registrations/upcoming',
    validate: true,
  },
];

export const MY_REGISTRATIONS = 'My registrations';
export const NO_EVENT = 'No event';
export const NO_RESULT_FOUND = 'No events found';
export const SOME_WENT_WRONG = 'Something went wrong';
export const EVENTS = {
  MY_REGISTRATIONS: 'my-registrations',
};

export const EVENT_TYPE = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  PAST: 'past',
  ACTIVE: 'active', // either ongoing or upcoming
};

export const EVENT_TAB_ITEMS = [
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
