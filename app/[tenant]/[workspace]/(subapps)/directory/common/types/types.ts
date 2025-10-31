import type {AOSPartner} from '@/goovee/.generated/models';
import type {BigDecimal, OrderByOptions} from '@goovee/orm';

type Pagination = {
  _count?: string;
  _cursor?: string;
  _hasNext?: boolean;
  _hasPrev?: boolean;
};

export type ListCategory = {
  id: string;
  version: number;
  title?: string;
  color?: string;
  icon?: string;
} & Pagination;

export type Category = {
  id: string;
  version: number;
  title?: string;
  directoryCategorySet?: {
    id: string;
    version: number;
    title?: string;
    color?: string;
    icon?: string;
  }[];
} & Pagination;

export type Entry = {
  id: string;
  version: number;
  simpleFullName?: string;
  emailAddress?: {id: string; version: number; address?: string};
  fixedPhone?: string;
  mobilePhone?: string;
  linkedinLink?: string;
  mainAddress?: {
    id: string;
    version: number;
    formattedFullName?: string;
    latit?: BigDecimal;
    longit?: BigDecimal;
  };
  picture?: {id: string; version: number};
  mainPartnerContacts?: {
    id: string;
    version: number;
    simpleFullName?: string;
    emailAddress?: {id: string; version: number; address?: string};
    fixedPhone?: string;
    mobilePhone?: string;
    linkedinLink?: string;
    functionBusinessCard?: string;
    picture?: {id: string; version: number};
  }[];
  isEmailInDirectory?: boolean;
  isPhoneInDirectory?: boolean;
  isWebsiteInDirectory?: boolean;
  isAddressInDirectory?: boolean;
  directoryCompanyDescription?: string;
  webSite?: string;
} & Pagination;

export type ListEntry = {
  id: string;
  version: number;
  simpleFullName?: string;
  mainAddress?: {
    id: string;
    version: number;
    formattedFullName?: string;
    longit?: BigDecimal;
    latit?: BigDecimal;
  };
  picture?: {id: string; version: number};
  isAddressInDirectory?: boolean;
  directoryCompanyDescription?: string;
  _count?: string;
  _cursor?: string;
  _hasNext?: boolean;
  _hasPrev?: boolean;
} & Pagination;

export type SearchEntry = {
  id: string;
  version: number;
  simpleFullName?: string;
} & Pagination;

export type MapConfig = {
  map: number;
  apiKey?: string;
};

export type SearchParams = {page?: string; limit?: string; sort?: string};

export type SortOption = {
  value: string;
  label: string;
  orderBy: OrderByOptions<AOSPartner>;
};
