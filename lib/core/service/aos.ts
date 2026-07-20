import {getAOSHeaders} from '@/tenant/auth';

import type {
  AOSConfig,
  AOSErrorReport,
  AOSResponse,
  NextRequestConfig,
  RequestOptions,
  SearchOptions,
} from './types';

/* Raised when AOS returns a non-zero status on a ws/rest or ws/action call.
 * On failure AOP carries the error inside the response's data field (an
 * AOSErrorReport), not at the top level, so this lifts message/causeClass/
 * entityName from there. causeClass lets callers branch on a known failure
 * (e.g. an optimistic-lock mismatch on save), but is only set for an admin or
 * technical-staff AOS user — see AOSErrorReport. */
export class AOSError extends Error {
  readonly status: number;
  readonly causeClass?: string;
  readonly entityName?: string;
  readonly errors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    options: {
      causeClass?: string;
      entityName?: string;
      errors?: Record<string, string>;
    } = {},
  ) {
    super(message);
    this.name = 'AOSError';
    this.status = status;
    this.causeClass = options.causeClass;
    this.entityName = options.entityName;
    this.errors = options.errors;
  }

  /* True when AOS rejected the write because the record was changed by another
   * transaction (an optimistic-lock / concurrent-update failure). Detected
   * without depending on the AOP version or the API user's role: AOP sets
   * entityName only on this failure and does so for every user, while
   * causeClass — present only for an admin or technical-staff user — confirms
   * it by its unqualified name across the javax (AOS 8) and jakarta (AOS 9)
   * namespaces. Callers branch on this instead of matching a fully qualified
   * class string. */
  get isConcurrentUpdate(): boolean {
    return (
      this.entityName != null ||
      (this.causeClass?.endsWith('OptimisticLockException') ?? false)
    );
  }
}

function assertOk<ResponseType extends AOSResponse>(
  response: ResponseType,
  context: string,
): ResponseType {
  if (response.status !== 0) {
    const report = (response.data ?? {}) as unknown as AOSErrorReport;
    throw new AOSError(
      report.message || `AOS request failed: ${context}`,
      response.status,
      {
        causeClass: report.causeClass,
        entityName: report.entityName,
        errors: response.errors,
      },
    );
  }
  return response;
}

/* A per-instance AOS REST client. Bind it once to the instance's aos config and
 * every call carries its auth headers. The verb methods cover the uniform
 * ws/rest and ws/action surface and interpret the standard envelope; request()
 * is the escape hatch for any other endpoint (ws/portal, ws/aos, ws/user, ...),
 * returning the parsed body untouched so the caller reads its own shape. */
export function aosClient(aos: AOSConfig) {
  const base = aos.url.replace(/\/+$/, '');

  async function request<ResponseType = unknown>(
    path: string,
    {
      method = 'POST',
      body,
      headers,
      signal,
      cache = 'no-store',
      next,
    }: RequestOptions = {},
  ): Promise<ResponseType> {
    const url = `${base}/${path.replace(/^\/+/, '')}`;

    const requestHeaders: Record<string, string> = {
      ...getAOSHeaders(aos),
      Accept: 'application/json',
      ...headers,
    };
    if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const init: RequestInit & {next?: NextRequestConfig} = {
      method,
      headers: requestHeaders,
    };

    if (body !== undefined) init.body = JSON.stringify(body);
    if (signal) init.signal = signal;

    /* next and cache are mutually exclusive in Next.js: an explicit caching
     * policy takes precedence, otherwise the call reads live. */
    if (next) init.next = next;
    else init.cache = cache;

    const response = await fetch(url, init);

    if (!response.ok) {
      throw new Error(
        `AOS request failed: ${method} ${url} responded ${response.status}`,
      );
    }

    return response.json() as Promise<ResponseType>;
  }

  async function search<RecordType = unknown>(
    model: string,
    {data, fields, sortBy, offset, limit, translate}: SearchOptions = {},
  ): Promise<{records: RecordType[]; total: number}> {
    const response = await request<AOSResponse<RecordType[]>>(
      `ws/rest/${model}/search`,
      {
        body: {
          ...(data && {data}),
          ...(fields && {fields}),
          ...(sortBy && {sortBy}),
          ...(offset != null && {offset}),
          ...(limit != null && {limit}),
          ...(translate != null && {translate}),
        },
      },
    );
    assertOk(response, `search ${model}`);
    return {records: response.data ?? [], total: response.total ?? 0};
  }

  async function read<RecordType = unknown>(
    model: string,
    id: string | number,
    options?: {fields?: string[]},
  ): Promise<RecordType | null> {
    const response = await request<AOSResponse<RecordType[]>>(
      `ws/rest/${model}/${id}/fetch`,
      {body: options?.fields ? {fields: options.fields} : {}},
    );
    assertOk(response, `read ${model}#${id}`);
    return response.data?.[0] ?? null;
  }

  async function save<RecordType = unknown>(
    model: string,
    data: Record<string, unknown>,
    options?: {fields?: string[]},
  ): Promise<RecordType> {
    const response = await request<AOSResponse<RecordType[]>>(
      `ws/rest/${model}`,
      {body: {data, ...(options?.fields && {fields: options.fields})}},
    );
    assertOk(response, `save ${model}`);
    const record = response.data?.[0];
    if (!record) {
      throw new AOSError(
        `AOS save returned no record: ${model}`,
        response.status,
      );
    }
    return record;
  }

  /* AOP's DELETE ws/rest/<model>/<id> takes the current version as a query
   * param and rejects the delete on a mismatch, so version is required: a
   * missing one would default to 0 on the server and fail for any record whose
   * version is already past 0. */
  async function remove(
    model: string,
    id: string | number,
    version: number,
  ): Promise<void> {
    const response = await request<AOSResponse>(
      `ws/rest/${model}/${id}?version=${version}`,
      {method: 'DELETE'},
    );
    assertOk(response, `remove ${model}#${id}`);
  }

  async function action<ResultType = unknown>(
    name: string,
    {model, context}: {model: string; context?: Record<string, unknown>},
  ): Promise<ResultType[]> {
    const response = await request<AOSResponse<ResultType[]>>(
      `ws/action/${name}`,
      {body: {model, action: name, data: {context: context ?? {}}}},
    );
    assertOk(response, `action ${name}`);
    return response.data ?? [];
  }

  return {request, search, read, save, remove, action};
}

export type AOSClient = ReturnType<typeof aosClient>;
