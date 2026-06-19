'server only';

import fs from 'fs';
import path from 'path';
import {experimental_taintUniqueValue} from 'react';

import {
  PUBLIC_ENV_KEYS,
  type GlobalConfig,
  type PublicEnv,
  type PublicEnvKey,
  type TenantConfig,
} from './types';

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

/* Document shapes. A tenant entry is a full TenantConfig with publicEnv
 * optional (defaults to {}); nothing else is filled in — there is no env
 * fallback, so every value a tenant uses must be present in its entry. */
type TenantConfigInput = Omit<TenantConfig, 'publicEnv'> & {
  publicEnv?: PublicEnv;
};

type GlobalConfigInput = {
  betterAuthSecret?: string;
  betterAuthUrl?: string;
};

function validatePublicEnvKeys(
  context: string,
  publicEnv: PublicEnv | undefined,
) {
  for (const key of Object.keys(publicEnv ?? {})) {
    if (!PUBLIC_ENV_KEYS.includes(key as PublicEnvKey)) {
      throw new Error(
        `${context}: unsupported publicEnv key "${key}" — supported keys: ${PUBLIC_ENV_KEYS.join(', ')}`,
      );
    }
  }
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
  if (!input?.aos?.storage) {
    throw new Error(`Tenant "${id}": aos.storage is required`);
  }

  const auth = input.aos.auth;
  if (!auth?.apiKey && !(auth?.username && auth?.password)) {
    throw new Error(
      `Tenant "${id}": aos.auth requires apiKey or username/password`,
    );
  }

  validatePublicEnvKeys(`Tenant "${id}"`, input.publicEnv);

  /* Bake the per-tenant storage root once, mirroring AOP's
   * FileSystemStore.getRootPath(): a tenant on a shared multi-tenant AOS keeps
   * its files under <data.upload.dir>/<aosTenantId>, while a dedicated instance
   * (or the AOP "default" tenant) uses <data.upload.dir> as-is. aos.storage in
   * the document is therefore the AOS data.upload.dir base; goovee reads and
   * writes the AOS filesystem directly, so every storage consumer can use
   * config.aos.storage verbatim without re-deriving the tenant subdirectory. */
  const {aosTenantId} = input.aos;
  const storage =
    aosTenantId && aosTenantId !== 'default'
      ? path.join(input.aos.storage, aosTenantId)
      : input.aos.storage;

  /* No env merge — the entry is the config, verbatim (aside from the storage
   * root derived above). publicEnv is the only field allowed to be omitted (an
   * empty browser-variable set). */
  return {
    ...input,
    aos: {...input.aos, storage},
    publicEnv: input.publicEnv ?? {},
  };
}

function normalizeGlobalConfig(input: GlobalConfigInput): GlobalConfig {
  if (!input?.betterAuthSecret) {
    throw new Error('"$global".betterAuthSecret is required');
  }

  return {
    betterAuthSecret: input.betterAuthSecret,
    betterAuthUrl: input.betterAuthUrl,
  };
}

function taintTenantConfig(config: TenantConfig) {
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

function taintGlobalConfig(global: GlobalConfig) {
  taint(
    'Better Auth secret is a server secret. Do not pass to Client Components.',
    global.betterAuthSecret,
  );
}

type LoadedConfig = {
  global: GlobalConfig;
  tenants: Record<string, TenantConfig>;
};

/* Sources all configuration from a single JSON document — TENANTS_CONFIG_FILE
 * (path) or TENANTS_CONFIG (inline). Shape:
 *
 *   { "$global": GlobalConfig, "<tenantId>": TenantConfig, ... }
 *
 * It is the one and only configuration mechanism: single-tenant is just a
 * one-entry document. Nothing is read from the process env for tenant- or
 * deployment-scoped settings, and no value is inherited between sections
 * (no fallback) — every value a tenant uses lives in its own entry, and the
 * deployment-wide values live in "$global". A registry-DB provider can replace
 * this behind the same interface later.
 *
 * Loading is synchronous (readFileSync at first access) so config is also
 * available to module-init consumers — the better-auth instance needs the
 * "$global" secret and the per-tenant OAuth entries before any request. */
class DocumentTenantConfigProvider implements TenantConfigProvider {
  private loaded: LoadedConfig | undefined;

  private load(): LoadedConfig {
    if (!this.loaded) {
      this.loaded = this.read();
    }
    return this.loaded;
  }

  private read(): LoadedConfig {
    const file = process.env.TENANTS_CONFIG_FILE;
    const source = file
      ? fs.readFileSync(file, 'utf8')
      : process.env.TENANTS_CONFIG;

    if (!source) {
      /* `next build` evaluates module-init code (the better-auth instance, the
       * OAuth provider list) with no runtime config present — env is absent
       * during an image build, and so is the document. Return a minimal
       * placeholder so the build can analyse routes; real configuration is
       * required at runtime and for CLI scripts, where NEXT_PHASE is unset and
       * this throws instead. */
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return {
          global: {betterAuthSecret: 'build-time-placeholder'},
          tenants: {},
        };
      }
      throw new Error(
        'No tenant configuration found: set TENANTS_CONFIG_FILE (path, ' +
          'preferred) or TENANTS_CONFIG (inline JSON). See ' +
          'tenants.config.example.json.',
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(source);
    } catch (err) {
      throw new Error('Tenant configuration is not valid JSON', {cause: err});
    }

    const globalInput = parsed['$global'] as GlobalConfigInput | undefined;
    if (!globalInput) {
      throw new Error(
        'Tenant configuration is missing the required "$global" section',
      );
    }
    const global = normalizeGlobalConfig(globalInput);
    taintGlobalConfig(global);

    const tenants: Record<string, TenantConfig> = {};
    for (const [id, input] of Object.entries(parsed)) {
      // Reserved keys: $schema (editor hint) and $global (handled above).
      if (id === '$schema' || id === '$global') continue;
      const config = normalizeTenantConfig(id, input as TenantConfigInput);
      taintTenantConfig(config);
      tenants[id] = config;
    }

    if (Object.keys(tenants).length === 0) {
      throw new Error('Tenant configuration has no tenant entries');
    }

    return {global, tenants};
  }

  getSync(id: string): TenantConfig | null {
    return this.load().tenants[id] ?? null;
  }

  listConfigsSync(): Array<[string, TenantConfig]> {
    return Object.entries(this.load().tenants);
  }

  getGlobalSync(): GlobalConfig {
    return this.load().global;
  }

  async get(id: string): Promise<TenantConfig | null> {
    return this.getSync(id);
  }

  async list(): Promise<string[]> {
    return Object.keys(this.load().tenants);
  }
}

const provider = new DocumentTenantConfigProvider();

export const tenantConfigProvider: TenantConfigProvider = provider;

/* Synchronous access for module-init consumers (the better-auth instance reads
 * the "$global" secret and the per-tenant OAuth entries at construction). A
 * future async registry provider would need init-time prefetching instead. */
export function listTenantConfigsSync(): Array<[string, TenantConfig]> {
  return provider.listConfigsSync();
}

export function getTenantConfigSync(id: string): TenantConfig | null {
  return provider.getSync(id);
}

export function getGlobalConfigSync(): GlobalConfig {
  return provider.getGlobalSync();
}
