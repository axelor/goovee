import {GooveeClient} from '@/goovee/.generated/client';

/* The browser-exposed variables the app supports — the single source of
 * truth for what may appear in a tenant's publicEnv and what the root
 * layout delivers to the client. */
export const PUBLIC_ENV_KEYS = [
  'GOOVEE_PUBLIC_HOST',
  'GOOVEE_PUBLIC_PAYPAL_CLIENT_ID',
  'GOOVEE_PUBLIC_LINKEDIN_URL',
  'GOOVEE_PUBLIC_TWITTER_URL',
  'GOOVEE_PUBLIC_INSTAGRAM_URL',
  'GOOVEE_PUBLIC_WHATSAPP_URL',
  'GOOVEE_PUBLIC_MATTERMOST_HOST',
  'GOOVEE_PUBLIC_VAPID_PUBLIC_KEY',
  'GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_LABEL',
  'GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_IMAGE',
] as const;

export type PublicEnvKey = (typeof PUBLIC_ENV_KEYS)[number];

export type PublicEnv = Partial<Record<PublicEnvKey, string>>;

export type Tenant = {
  id: string;
  config: TenantConfig;
  client: TenantClient;
};

export type TenantConfig = {
  db: {
    url: string;
  };
  aos: {
    url: string;
    /* AOS-side tenant id, independent of the Goovee tenant id. Set ⇒ this
     * tenant lives on a shared AOS instance with AOS multi-tenancy, and every
     * AOS call must carry X-Tenant-ID with this value. Unset ⇒ the tenant has
     * its own dedicated AOS instance. */
    aosTenantId?: string;
    storage: string;
    auth: {
      username?: string;
      password?: string;
      apiKey?: string;
    };
    webhookSecret?: string;
  };
  /* Every section below is optional: a missing section falls back to the
   * process-level env vars, so partial configs and single-tenant
   * deployments keep working unchanged. */
  payments?: {
    paypal?: {
      clientId: string;
      clientSecret: string;
      live?: boolean;
    };
    stripe?: {
      clientSecret: string;
      webhookSecret?: string;
    };
    paybox?: {
      site: string;
      rang: string;
      identifiant: string;
      secret: string;
      paybox: string;
      backup1?: string;
      backup2?: string;
    };
    up2pay?: {
      site: string;
      rang: string;
      identifiant: string;
      secret: string;
      paybox: string;
      /* Where to forward Up2Pay IPNs this tenant cannot attribute to a Goovee
       * payment (legacy-ERP invoices, unknown context). Omit to not forward. */
      legacyForwardUrl?: string;
    };
    hubpisp?: {
      tokenUrl: string;
      apiUrl: string;
      clientId: string;
      clientSecret: string;
      certFingerprint: string;
      beneficiaryName: string;
      iban: string;
      bic?: string;
      /* Directory holding client.crt and private-key.pem for mTLS;
       * defaults to certs/hubpisp. */
      certsDir?: string;
    };
  };
  mail?: {
    host: string;
    port: number;
    secure?: boolean;
    user: string;
    password: string;
    email?: string;
  };
  /* The Mattermost host is browser-facing — override it per tenant via
   * publicEnv.GOOVEE_PUBLIC_MATTERMOST_HOST instead. */
  mattermost?: {
    token?: string;
    createUsers?: boolean;
  };
  oauth?: {
    google?: {
      clientId: string;
      clientSecret: string;
    };
    keycloak?: {
      clientId: string;
      clientSecret: string;
      issuer: string;
    };
  };
  /* Web-push signing identity. The browser-side public key lives in
   * publicEnv.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY so subscribe and send share one
   * source. A browser holds one push subscription per service-worker
   * registration, so per-tenant key pairs only take effect once tenants run
   * on their own domains; on a shared origin all tenants should share the
   * deployment key pair. */
  webPush?: {
    privateKey: string;
    subject: string;
  };
  /* Per-tenant operational toggles. Optional — each falls back to a built-in
   * code default when omitted. A fixed code default is not a cross-tenant
   * "fallback": no value is inherited from another tenant or from the env. */
  includeLanguage?: boolean;
  uploadRecordRetentionHours?: number;
  /* Browser-exposed variables for this tenant. Declared in full in the tenant's
   * document entry (no env fill) — consumers never read process.env. */
  publicEnv: PublicEnv;
};

export type TenantClient = GooveeClient;

/* Deployment-wide settings, bound to the single origin / process and therefore
 * shared by every tenant. They live in the document's reserved "$global"
 * section, never inside a tenant entry. */
export type GlobalConfig = {
  betterAuthSecret: string;
  betterAuthUrl?: string;
  /* Browser-exposed variables for tenant-less pages (bare `/`, `/auth` without
   * a tenant). Same key list as a tenant's publicEnv. */
  publicEnv: PublicEnv;
};
