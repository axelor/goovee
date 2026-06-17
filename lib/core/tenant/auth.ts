import type {TenantConfig} from './types';

type AOS = TenantConfig['aos'];

export function getAOSHeaders(aos: AOS): Record<string, string> {
  const headers: Record<string, string> = aos.auth.apiKey
    ? {'API-KEY': aos.auth.apiKey}
    : {
        Authorization:
          'Basic ' + btoa(`${aos.auth.username}:${aos.auth.password}`),
      };

  /* Goovee authenticates to AOS without a session, so on a shared AOS
   * instance (AOS multi-tenancy) the AOS tenant must be selected on every
   * request via X-Tenant-ID. */
  if (aos.aosTenantId) {
    headers['X-Tenant-ID'] = aos.aosTenantId;
  }

  return headers;
}
