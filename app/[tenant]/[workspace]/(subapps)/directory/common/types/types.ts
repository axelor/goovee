import type {AOSPartner} from '@/goovee/.generated/models';
import type {OrderByOptions} from '@goovee/orm';
export type {Entry, ListEntry} from '../orm/directory-entry';

export type MapConfig = {
  map: number;
  apiKey?: string;
};

export type SearchParams = {
  page?: string;
  limit?: string;
  sort?: string;
  city?: string;
  zip?: string;
};

export type SortOption = {
  value: string;
  label: string;
  orderBy: OrderByOptions<AOSPartner>;
};
