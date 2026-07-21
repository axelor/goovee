export type Subscription = {
  id: string;
  price: string;
  displayAti: string;
};

export type Participant = {
  name: string;
  surname: string;
  subscriptionSet: Subscription[];
};

export type FormData = {
  name: string;
  surname: string;
  subscriptionSet: Subscription[];
  otherPeople: Participant[];
};

export type Category = {
  id: string;
  version: number;
  name: string | null;
  color: string | null;
  description: string | null;
  image: {id: string; version: number} | null;
  thumbnailImage: {id: string; version: number} | null;
};

export type ListEvent = {
  isRegistered: boolean;
  id: string;
  version: number;
  eventEndDateTime: Date | string | null;
  eventStartDateTime: Date | string | null;
  eventAllDay: boolean | null;
  eventTitle: string | null;
  eventCategorySet:
    | {
        id: string;
        version: number;
        name: string | null;
        color: string | null;
        image: {
          id: string;
          version: number;
        } | null;
        thumbnailImage: {
          id: string;
          version: number;
        } | null;
      }[]
    | null;
  registrationDeadlineDateTime: Date | string | null;
  eventImage: {
    id: string;
    version: number;
  } | null;
  eventDescription: string | null;
  registrationList:
    | {
        id: string;
        version: number;
        participantList:
          | {
              id: string;
              version: number;
              emailAddress: string | null;
            }[]
          | null;
      }[]
    | null;
  slug: string | null;
  eventPlace?: string | null;
  defaultPrice?: number | string | null;
  eventProduct?: {
    salePrice?: number | string | null;
    saleCurrency?: {symbol?: string | null} | null;
  } | null;
  _count?: string | undefined;
  _cursor?: string | undefined;
  _hasNext?: boolean | undefined;
  _hasPrev?: boolean | undefined;
};

export type EventConfigPartner = {
  id: string;
  version: number;
  isContact: boolean | null;
  isProspect: boolean | null;
  isCustomer: boolean | null;
  emailAddress: {
    id: string;
    version: number;
    address: string | null;
  } | null;
  contactPartnerSet:
    | {
        id: string;
        version: number;
        emailAddress: {
          id: string;
          version: number;
          address: string | null;
        } | null;
        isActivatedOnPortal: boolean | null;
      }[]
    | null;
  isActivatedOnPortal: boolean | null;
  canSubscribeNoPublicEvent: boolean | null;
};

export type EventConfig = {
  id: string;
  version: number;
  eventEndDateTime: Date | string | null;
  eventStartDateTime: Date | string | null;
  eventAllDay: boolean | null;
  registrationDeadlineDateTime: Date | string | null;
  eventAllowRegistration: boolean | null;
  eventAllowMultipleRegistrations: boolean | null;
  isPrivate: boolean | null;
  isPublic: boolean | null;
  isLoginNotNeeded: boolean | null;
  isHidden: boolean | null;
  maxParticipantPerEvent: number | null;
  maxParticipantPerRegistration: number | null;
  partnerCategorySet:
    | {
        id: string;
        version: number;
        partners: EventConfigPartner[] | null;
      }[]
    | null;
  partnerSet: EventConfigPartner[] | null;
  registrationList:
    | {
        id: string;
        version: number;
        participantList:
          | {
              id: string;
              version: number;
              emailAddress: string | null;
            }[]
          | null;
      }[]
    | null;
};

export type PartnerForEvent = {
  id: string;
  version: number;
  emailAddress: {id: string; version: number; address: string | null} | null;
  isActivatedOnPortal: boolean | null;
  canSubscribeNoPublicEvent: boolean | null;
};

export type Registration = {
  id: string;
  version: number;
  participantList:
    | {
        id: string;
        version: number;
        contact: {
          id: string;
          version: number;
          emailAddress: {
            id: string;
            version: number;
            address: string | null;
          } | null;
          localization: {
            id: string;
            version: number;
            code: string | null;
          } | null;
          isActivatedOnPortal: boolean | null;
        } | null;
      }[]
    | null;
  event: {
    id: string;
    version: number;
    eventTitle: string | null;
    slug: string | null;
  } | null;
};

export type PartnerAddress = {
  isInvoicingAddr: boolean | null;
  isDefaultAddr: boolean | null;
  address: {formattedFullName: string | null} | null;
};

export type UserWithAddress = {
  isContact: boolean | null;
  mainPartner?: {
    partnerAddressList?: PartnerAddress[] | null;
    simpleFullName?: string | null;
  } | null;
  partnerAddressList?: PartnerAddress[] | null;
};
