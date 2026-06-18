'server only';

import fs from 'fs';
import {experimental_taintUniqueValue} from 'react';

import {DEFAULT_TENANT} from '@/constants';
import {getStoragePath} from '@/storage/index';
import {PUBLIC_ENV_KEYS, type PublicEnv, type TenantConfig} from './types';

/* The taint API only exists in React's `react-server` build that Next.js
 * loads in Server Components / Route Handlers. CLI scripts (seeders,
 * one-shot tasks) resolve the regular `react` build where it's `undefined`,
 * so calling it would crash. There's no Client Component leak surface in
 * a script anyway — skip when the function isn't there. */
function taint(message: string, value: string) {
  if (typeof experimental_taintUniqueValue === 'function') {
    experimental_taintUniqueValue(message, process, value);
  }
}

export interface TenantConfigProvider {
  get(id: string): Promise<TenantConfig | null>;
  list(): Promise<string[]>;
}

/* Config entries may omit aos.storage, publicEnv and the settings sections;
 * the provider fills them from the process env at load time so consumers
 * only ever read TenantConfig. */
type TenantConfigInput = Omit<TenantConfig, 'aos' | 'publicEnv'> & {
  aos: Omit<TenantConfig['aos'], 'storage'> & {storage?: string};
  publicEnv?: PublicEnv;
};

function getAOSAuth() {
  const apiKey = process.env.AOS_API_KEY;
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!apiKey && (!username || !password)) {
    throw new Error(
      'AOS auth not configured: set AOS_API_KEY or BASIC_AUTH_USERNAME/BASIC_AUTH_PASSWORD',
    );
  }

  return {username, password, apiKey};
}

function buildEnvPublicEnv(): PublicEnv {
  const publicEnv: PublicEnv = {};
  for (const key of PUBLIC_ENV_KEYS) {
    const value = process.env[key];
    if (value) {
      publicEnv[key] = value;
    }
  }
  return publicEnv;
}

function buildEnvPayments(): NonNullable<TenantConfig['payments']> {
  const payments: NonNullable<TenantConfig['payments']> = {};

  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    payments.paypal = {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      live: process.env.PAYPAL_LIVE === 'true',
    };
  }

  if (process.env.STRIPE_CLIENT_SECRET) {
    payments.stripe = {
      clientSecret: process.env.STRIPE_CLIENT_SECRET,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || undefined,
    };
  }

  if (
    process.env.PBX_SITE &&
    process.env.PBX_RANG &&
    process.env.PBX_IDENTIFIANT &&
    process.env.PBX_SECRET &&
    process.env.PBX_PAYBOX
  ) {
    payments.paybox = {
      site: process.env.PBX_SITE,
      rang: process.env.PBX_RANG,
      identifiant: process.env.PBX_IDENTIFIANT,
      secret: process.env.PBX_SECRET,
      paybox: process.env.PBX_PAYBOX,
      backup1: process.env.PBX_BACKUP1 || undefined,
      backup2: process.env.PBX_BACKUP2 || undefined,
    };
  }

  if (
    process.env.UP2PAY_SITE &&
    process.env.UP2PAY_RANG &&
    process.env.UP2PAY_IDENTIFIANT &&
    process.env.UP2PAY_SECRET &&
    process.env.UP2PAY_PAYBOX
  ) {
    payments.up2pay = {
      site: process.env.UP2PAY_SITE,
      rang: process.env.UP2PAY_RANG,
      identifiant: process.env.UP2PAY_IDENTIFIANT,
      secret: process.env.UP2PAY_SECRET,
      paybox: process.env.UP2PAY_PAYBOX,
      legacyForwardUrl: process.env.UP2PAY_LEGACY_FORWARD_URL || undefined,
    };
  }

  if (
    process.env.HUBPISP_TOKEN_URL &&
    process.env.HUBPISP_API_URL &&
    process.env.HUBPISP_CLIENT_ID &&
    process.env.HUBPISP_CLIENT_SECRET &&
    process.env.HUBPISP_CERT_FINGERPRINT &&
    process.env.HUBPISP_BENEFICIARY_NAME &&
    process.env.HUBPISP_IBAN
  ) {
    payments.hubpisp = {
      tokenUrl: process.env.HUBPISP_TOKEN_URL,
      apiUrl: process.env.HUBPISP_API_URL,
      clientId: process.env.HUBPISP_CLIENT_ID,
      clientSecret: process.env.HUBPISP_CLIENT_SECRET,
      certFingerprint: process.env.HUBPISP_CERT_FINGERPRINT,
      beneficiaryName: process.env.HUBPISP_BENEFICIARY_NAME,
      iban: process.env.HUBPISP_IBAN,
      bic: process.env.HUBPISP_BIC || undefined,
    };
  }

  return payments;
}

function buildEnvMail(): TenantConfig['mail'] {
  if (
    !(
      process.env.MAIL_HOST &&
      process.env.MAIL_PORT &&
      process.env.MAIL_USER &&
      process.env.MAIL_PASSWORD
    )
  ) {
    return undefined;
  }

  return {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    email: process.env.MAIL_EMAIL || undefined,
  };
}

function buildEnvWebPush(): TenantConfig['webPush'] {
  if (!(process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT)) {
    return undefined;
  }

  return {
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT,
  };
}

function buildEnvMattermost(): TenantConfig['mattermost'] {
  if (
    !process.env.MATTERMOST_TOKEN &&
    process.env.CREATE_MATTERMOST_USERS !== 'true'
  ) {
    return undefined;
  }

  return {
    token: process.env.MATTERMOST_TOKEN || undefined,
    createUsers: process.env.CREATE_MATTERMOST_USERS === 'true',
  };
}

type EnvSections = {
  payments: NonNullable<TenantConfig['payments']>;
  mail: TenantConfig['mail'];
  mattermost: TenantConfig['mattermost'];
  webPush: TenantConfig['webPush'];
  publicEnv: PublicEnv;
};

let envSectionsCache: EnvSections | undefined;

function getEnvSections(): EnvSections {
  if (!envSectionsCache) {
    envSectionsCache = {
      payments: buildEnvPayments(),
      mail: buildEnvMail(),
      mattermost: buildEnvMattermost(),
      webPush: buildEnvWebPush(),
      publicEnv: buildEnvPublicEnv(),
    };
  }
  return envSectionsCache;
}

function buildDefaultTenantConfig(): TenantConfig {
  const env = getEnvSections();

  return {
    db: {
      url: process.env.DATABASE_URL!,
    },
    aos: {
      url: process.env.AOS_URL!,
      aosTenantId: process.env.AOS_TENANT_ID || undefined,
      storage: getStoragePath(),
      auth: getAOSAuth(),
      webhookSecret: process.env.NOTIFICATION_WEBHOOK_SECRET,
    },
    payments: env.payments,
    mail: env.mail,
    mattermost: env.mattermost,
    webPush: env.webPush,
    publicEnv: env.publicEnv,
  };
}

function normalizeTenantConfig(
  id: string,
  input: TenantConfigInput,
): TenantConfig {
  if (!input?.db?.url) {
    throw new Error(`Tenant "${id}": db.url is required`);
  }
  if (!input?.aos?.url) {
    throw new Error(`Tenant "${id}": aos.url is required`);
  }

  const auth = input.aos.auth;
  if (!auth?.apiKey && !(auth?.username && auth?.password)) {
    throw new Error(
      `Tenant "${id}": aos.auth requires apiKey or username/password`,
    );
  }

  for (const key of Object.keys(input.publicEnv ?? {})) {
    if (!PUBLIC_ENV_KEYS.includes(key as (typeof PUBLIC_ENV_KEYS)[number])) {
      throw new Error(
        `Tenant "${id}": unsupported publicEnv key "${key}" — supported keys: ${PUBLIC_ENV_KEYS.join(', ')}`,
      );
    }
  }

  /* Sections a tenant omits are filled from the process env, so consumers
   * read TenantConfig only and partial documents keep working. */
  const env = getEnvSections();

  return {
    ...input,
    aos: {
      ...input.aos,
      storage: input.aos.storage ?? getStoragePath(),
    },
    payments: {...env.payments, ...input.payments},
    mail: input.mail ?? env.mail,
    mattermost: input.mattermost
      ? {...env.mattermost, ...input.mattermost}
      : env.mattermost,
    webPush: input.webPush ?? env.webPush,
    publicEnv: {...env.publicEnv, ...input.publicEnv},
  };
}

function taintConfig(config: TenantConfig) {
  const secrets: Array<[string, string | undefined]> = [
    ['Database URL', config.db.url],
    ['AOS API key', config.aos.auth.apiKey],
    ['AOS password', config.aos.auth.password],
    ['Webhook secret', config.aos.webhookSecret],
    ['PayPal secret key', config.payments?.paypal?.clientSecret],
    ['Stripe secret key', config.payments?.stripe?.clientSecret],
    ['Stripe webhook secret', config.payments?.stripe?.webhookSecret],
    ['Paybox secret key', config.payments?.paybox?.secret],
    ['Up2Pay secret key', config.payments?.up2pay?.secret],
    ['Hub PISP client secret', config.payments?.hubpisp?.clientSecret],
    ['Mail password', config.mail?.password],
    ['Mattermost token', config.mattermost?.token],
    ['VAPID private key', config.webPush?.privateKey],
    ['Google client secret', config.oauth?.google?.clientSecret],
    ['Keycloak client secret', config.oauth?.keycloak?.clientSecret],
  ];

  for (const [name, value] of secrets) {
    if (value) {
      taint(
        `${name} is a server secret. Do not pass to Client Components.`,
        value,
      );
    }
  }
}

/* Sources tenant config from a JSON document — TENANTS_CONFIG_FILE (path) or
 * TENANTS_CONFIG (inline), shape {"<tenantId>": TenantConfig, ...} — when
 * multi-tenancy is enabled. Without a document (or in single-tenant mode) it
 * synthesizes the single DEFAULT_TENANT entry from the classic env vars, so
 * existing deployments keep working unchanged. A registry-DB provider can
 * replace this behind the same interface later.
 *
 * Loading is synchronous (readFileSync at first access) so config is also
 * available to module-init consumers — the better-auth instance needs the
 * per-tenant OAuth entries before any request is served. */
class EnvTenantConfigProvider implements TenantConfigProvider {
  private tenants: Record<string, TenantConfig> | undefined;

  private load(): Record<string, TenantConfig> {
    if (!this.tenants) {
      this.tenants = this.read();
    }
    return this.tenants;
  }

  private read(): Record<string, TenantConfig> {
    if (process.env.MULTI_TENANCY === 'true') {
      const file = process.env.TENANTS_CONFIG_FILE;
      const source = file
        ? fs.readFileSync(file, 'utf8')
        : process.env.TENANTS_CONFIG;

      if (source) {
        const parsed: Record<string, TenantConfigInput> = JSON.parse(source);
        const tenants: Record<string, TenantConfig> = {};
        for (const [id, input] of Object.entries(parsed)) {
          // The document may reference tenants.config.schema.json.
          if (id === '$schema') continue;
          const config = normalizeTenantConfig(id, input);
          taintConfig(config);
          tenants[id] = config;
        }
        return tenants;
      }
    }

    const config = buildDefaultTenantConfig();
    taintConfig(config);
    return {[DEFAULT_TENANT]: config};
  }

  getSync(id: string): TenantConfig | null {
    return this.load()[id] ?? null;
  }

  listConfigsSync(): Array<[string, TenantConfig]> {
    return Object.entries(this.load());
  }

  async get(id: string): Promise<TenantConfig | null> {
    return this.getSync(id);
  }

  async list(): Promise<string[]> {
    return Object.keys(this.load());
  }
}

const provider = new EnvTenantConfigProvider();

export const tenantConfigProvider: TenantConfigProvider = provider;

/* Synchronous access for module-init consumers (better-auth OAuth entries).
 * Only the env/file provider can serve these; a future async registry
 * provider would need init-time prefetching instead. */
export function listTenantConfigsSync(): Array<[string, TenantConfig]> {
  return provider.listConfigsSync();
}

export function getTenantConfigSync(id: string): TenantConfig | null {
  return provider.getSync(id);
}

/* Browser-exposed variables for contexts with no tenant (the root page,
 * auth pages without a tenant param). Built from the same static key list
 * as tenant publicEnv. */
export function getGlobalPublicEnv(): PublicEnv {
  return getEnvSections().publicEnv;
}
