import type {TenantConfig} from './types';

type AOSAuth = TenantConfig['aos']['auth'];

export function getAOSAuthHeaders(auth: AOSAuth): Record<string, string> {
  if (auth.apiKey) {
    return {'API-KEY': auth.apiKey};
  }
  return {
    Authorization: 'Basic ' + btoa(`${auth.username}:${auth.password}`),
  };
}
