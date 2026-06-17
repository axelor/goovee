import path from 'path';

import {DEFAULT_TENANT} from '@/constants';
import {tenantConfigProvider} from '@/tenant/config-provider';
import type {TenantConfig} from '@/tenant';

export type HubPispSettings = {
  tokenUrl?: string;
  apiUrl?: string;
  clientId?: string;
  clientSecret?: string;
  certFingerprint?: string;
  beneficiaryName?: string;
  iban?: string;
  bic?: string;
  certsDir: string;
};

export function getHubPispSettings(
  config?: TenantConfig | null,
): HubPispSettings {
  const hubpisp = config?.payments?.hubpisp;

  return {
    tokenUrl: hubpisp?.tokenUrl,
    apiUrl: hubpisp?.apiUrl,
    clientId: hubpisp?.clientId,
    clientSecret: hubpisp?.clientSecret,
    certFingerprint: hubpisp?.certFingerprint,
    beneficiaryName: hubpisp?.beneficiaryName,
    iban: hubpisp?.iban,
    bic: hubpisp?.bic,
    certsDir: hubpisp?.certsDir ?? path.join(process.cwd(), 'certs', 'hubpisp'),
  };
}

/* Settings need the tenant config only — resolve through the provider so no
 * DB connection is forced. Without a tenant id (a webhook for a link created
 * before the ?tenant= convention) the default tenant's account is used; an
 * unknown id degrades the same way as an unconfigured account. */
export async function resolveHubPispSettings(
  tenantId?: string,
): Promise<HubPispSettings> {
  const config = await tenantConfigProvider.get(tenantId ?? DEFAULT_TENANT);
  return getHubPispSettings(config);
}
