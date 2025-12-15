export type Event = {
  id: string;
  version: number;
  eventTitle: string;
  eventStartDateTime: string;
  eventAllDay: boolean;
  eventEndDateTime: string | null;
  eventPlace: string | null;
  eventLink: string | null;
  eventAllowRegistration: boolean;
  eventAllowMultipleRegistrations: boolean;
  eventDescription: string;
  isPrivate: boolean;
  defaultPrice: string;
  slug: string;
  isPublic: boolean;
  isLoginNotNeeded: boolean;
  isHidden: boolean;
  maxParticipantPerRegistration: number;
  eventImage: {
    id: string;
    version: number;
  } | null;
  eventProduct: {
    id: string;
    version: number;
    name: string;
    code: string;
    salePrice: string;
    saleCurrency: {
      id: string;
      version: number;
      code: string;
      symbol: string;
      numberOfDecimals: number;
    };
  } | null;
  eventCategorySet: Array<{
    id: string;
    version: number;
    name: string;
    color: string;
  }>;
  registrationList: Array<{
    id: string;
    version: number;
    participantList: Array<{
      id: string;
      version: number;
      emailAddress: string;
    }>;
  }>;
  facilityList: Array<{
    id: string;
    version: number;
    createdOn: string;
    updatedOn: string | null;
    facility: string;
    price: string;
    displayWt: string;
    displayAti: string;
    formattedPrice: string;
    formattedPriceWt: string;
    formattedPriceAti: string;
    additionalFieldSet: any[];
  }>;
  isRegistered: boolean;
  displayWt: string;
  displayAti: string;
  formattedDefaultPrice: string;
  formattedDefaultPriceAti: string;
  registrationDeadlineDateTime?: string | Date;
  currency: {
    id: string;
    code: string;
  };
  additionalFieldSet: any[];
};

export type EventPayments = {
  id: string;
  displayAti: string | number;
  facilityList: Array<{
    id: string | number;
    facility: string;
    price: string;
    formattedPrice: string;
    displayAti?: string | number;
  }>;
  priceScale: number;
};

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
