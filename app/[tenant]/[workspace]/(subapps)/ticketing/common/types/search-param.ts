import {Expand} from '@/types/util';

export type SortParams = {
  sort?: string | undefined;
};

export type PageParams = {
  page?: string | undefined;
  limit?: string | undefined;
};

export type FilterParams = {
  filter?: string | undefined;
  title?: string | undefined;
};

export type SearchParams = Expand<SortParams & PageParams & FilterParams>;
