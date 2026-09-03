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
  certsDir?: string;
};

export function getHubPispSettings(config: TenantConfig): HubPispSettings {
  const hubpisp = config.payments?.hubpisp;

  return {
    tokenUrl: hubpisp?.tokenUrl,
    apiUrl: hubpisp?.apiUrl,
    clientId: hubpisp?.clientId,
    clientSecret: hubpisp?.clientSecret,
    certFingerprint: hubpisp?.certFingerprint,
    beneficiaryName: hubpisp?.beneficiaryName,
    iban: hubpisp?.iban,
    bic: hubpisp?.bic,
    certsDir: hubpisp?.certsDir,
  };
}
