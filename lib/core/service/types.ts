import type {TenantConfig} from '@/tenant';

/* The per-instance AOS connection settings the client binds to: base URL and
 * auth credentials. */
export type AOSConfig = TenantConfig['aos'];

/* What AOP puts in `data` on failure (status !== 0): the records are replaced
 * by this error report. message/title are always present; causeClass,
 * causeStack and causeString are only emitted when the AOS API user is an admin
 * or technical staff; entityId/entityName accompany an optimistic-lock
 * (concurrent update) failure and are not gated by the user's role. */
export type AOSErrorReport = {
  message?: string;
  title?: string;
  causeClass?: string;
  causeStack?: string;
  causeString?: string;
  entityId?: number | string;
  entityName?: string;
};

/* The standard envelope every ws/rest and ws/action endpoint returns. status is
 * 0 on success and negative on failure. There is no top-level message: on
 * success data holds the records, and on failure AOP replaces data with an
 * AOSErrorReport. errors is the field-level validation map, keyed by field. */
export type AOSResponse<DataType = unknown> = {
  status: number;
  total?: number;
  offset?: number;
  data?: DataType;
  errors?: Record<string, string>;
};

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/* Next.js caching policy. Server-side AOS calls read live data by default, so
 * cache and next stay unset unless a caller opts a specific read in. */
export type NextRequestConfig = {
  revalidate?: number | false;
  tags?: string[];
};

export type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cache?: RequestCache;
  next?: NextRequestConfig;
};

/* Search criteria for ws/rest/<model>/search. data carries the AOS query
 * (filter, _domain, _domainContext); the rest map onto the paging and field
 * selection the endpoint accepts. */
export type SearchOptions = {
  data?: Record<string, unknown>;
  fields?: string[];
  sortBy?: string[];
  offset?: number;
  limit?: number;
  translate?: boolean;
};
