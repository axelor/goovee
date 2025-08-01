import type {AOSPortalDirectoryEntry} from '@/goovee/.generated/models';
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
  title?: string;
  description?: string;
  address?: {
    id: string;
    version: number;
    formattedFullName?: string;
    latit?: BigDecimal;
    longit?: BigDecimal;
  };
  linkedIn?: string;
  twitter?: string;
  website?: string;
  isMap?: boolean;
  image?: {id: string; version: number};
  directoryContactSet?: {
    id: string;
    version: number;
    simpleFullName?: string;
    emailAddress?: {id: string; version: number; address?: string};
    fixedPhone?: string;
    picture?: {id: string; version: number};
    mobilePhone?: string;
    linkedinLink?: string;
  }[];
  instagram?: string;
  directoryEntryCategorySet?: {
    id: string;
    version: number;
    title?: string;
    color?: string;
  }[];
  attrs?: string;
} & Pagination;

export type ListEntry = {
  id: string;
  version: number;
  title?: string;
  description?: string;
  address?: {
    id: string;
    version: number;
    formattedFullName?: string;
    latit?: BigDecimal;
    longit?: BigDecimal;
  };
  isMap?: boolean;
  image?: {id: string; version: number};
  directoryEntryCategorySet?: {
    id: string;
    version: number;
    title?: string;
    color?: string;
  }[];
} & Pagination;

export type SearchEntry = {
  id: string;
  version: number;
  title?: string;
} & Pagination;

export type MapConfig = {
  map: number;
  apiKey?: string;
};

export type SearchParams = {page?: string; limit?: string; sort?: string};

export type SortOption = {
  value: string;
  label: string;
  orderBy: OrderByOptions<AOSPortalDirectoryEntry>;
};
