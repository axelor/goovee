import type {TenantConfig} from './types';

type AOS = TenantConfig['aos'];
type AOSAuth = TenantConfig['aos']['auth'];

export function getAOSAuthHeaders(auth: AOSAuth): Record<string, string> {
  if (auth.apiKey) {
    return {'API-KEY': auth.apiKey};
  }
  /* Encoded as UTF-8 rather than by `btoa`, which encodes Latin-1: a credential
   * holding a character outside Latin-1 makes `btoa` throw, and one holding a
   * character Latin-1 does cover is encoded to different bytes than AOS decodes,
   * so AOS refuses a password that is correct. */
  const credentials = Buffer.from(
    `${auth.username}:${auth.password}`,
    'utf8',
  ).toString('base64');

  return {
    Authorization: `Basic ${credentials}`,
  };
}

/**
 * Builds the full AOS request headers: authentication plus, when the tenant
 * shares an AOS instance (AOS multi-tenancy), the X-Tenant-ID selector — Goovee
 * holds no AOS session, so the AOS tenant is selected per request.
 */
export function getAOSHeaders(aos: AOS): Record<string, string> {
  const headers = getAOSAuthHeaders(aos.auth);
  if (aos.tenantId) {
    headers['X-Tenant-ID'] = aos.tenantId;
  }
  return headers;
}
