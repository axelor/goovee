export interface Event {
  key: string | undefined;
  id: string;
  eventTitle: string;
  eventStartDateTime: string;
  eventImage: {
    id: string | number;
  };
  eventEndDateTime: string;
  eventDescription: string;
  eventCategorySet: [Category];
  eventAllowRegistration: boolean;
  eventAllowMultipleRegistrations: boolean;
  eventAllDay: boolean;
  isRegistered?: boolean;
  _count: number | undefined;
  _hasNext: boolean;
  eventProduct: {
    salePrice: string;
    saleCurrency: {
      numberOfDecimals: number;
      symbol: string;
    };
  } | null;
  defaultPrice: string;
  formattedDefaultPrice: string;
  formattedDefaultPriceAti: string;
  displayAtiPrice: string;
  displayAti: string;
  facilityList: {
    id: number;
    price: string;
    formattedPrice: string;
    facility: string;
    additionalFieldSet: any[];
  }[];
  slug: string;
  isPrivate: boolean;
  isHidden: boolean;
  isPublic: boolean;
  isLoginNotNeeded: boolean;
  maxParticipantPerEvent: number;
  maxParticipantPerRegistration: number;
  additionalFieldSet: any[];
  priceScale: number;
}
export interface EventsProps {
  events: Event[];
}
export interface perPageProps {
  perpage: number;
}
export interface Category {
  id: string;
  name?: string;
  color?: string;
  version: number;
  thumbnailImage?: {
    id: string;
    version: number;
  } | null;
  image?: {
    id: string;
    version: number;
  } | null;
}
export interface CategoriesProps {
  eventsCategories: Category[];
}
export interface EventCardProps {
  event: ListEvent;
}

export interface ListEvent {
  isRegistered: boolean;
  id: string;
  version: number;
  eventTitle?: string;
  eventCategorySet?: {
    id: string;
    version: number;
    name?: string;
    image: {
      id: string;
      version: number;
    } | null;
    thumbnailImage: {
      id: string;
      version: number;
    } | null;
    color?: string;
  }[];
  eventStartDateTime: Date;
  eventAllDay?: boolean;
  eventEndDateTime?: Date;
  registrationDeadlineDateTime?: Date;
  eventImage?: {id: string; version: number};
  eventDescription?: string;
  registrationList?: {
    id: string;
    version: number;
    participantList?: {id: string; version: number; emailAddress?: string}[];
  }[];
  slug?: string;
}
