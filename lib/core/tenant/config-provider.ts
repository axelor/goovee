import fs from 'fs';
import path from 'path';

import {DEFAULT_TENANT} from '@/constants';
import {
  getMaxConnections,
  mailAccountKey,
} from '@/lib/core/notification/mail-account';
import {taintSecret} from '@/lib/core/security/taint';
import {
  PUBLIC_ENV_KEYS,
  type GlobalConfig,
  type PublicEnv,
  type PublicEnvKey,
  type TenantConfig,
} from './types';

/* Which entries of the document are servable is decided here, since the tenant
 * manager is built from what this module reads. */
export const isMultiTenancy = process.env.MULTI_TENANCY === 'true';

export interface TenantConfigProvider {
  get(id: string): Promise<TenantConfig | null>;
  list(): Promise<string[]>;
}

/* Document shapes. A tenant entry is a full TenantConfig; publicEnv is optional
 * on the way in only so a missing one is reported as a validation error rather
 * than a type error. Nothing is filled in — there is no env fallback, so every
 * value a tenant uses must be present in its entry. */
type TenantConfigInput = Omit<TenantConfig, 'publicEnv'> & {
  publicEnv?: PublicEnv;
};

type GlobalConfigInput = {
  betterAuthSecret?: string;
  betterAuthUrl?: string;
  pushMaxConnections?: number;
  imageCacheMaxBytes?: number;
};

/**
 * A positive whole number, or nothing.
 *
 * Reported by name at load rather than corrected at the point of use: a setting
 * silently replaced by a default is how a deployment ends up believing it set
 * three and running at ten, and reporting it here names every offender once
 * instead of only whichever one is exercised first.
 */
function validateCount(context: string, value: number | undefined) {
  if (value === undefined) return;

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      `${context} must be a whole number of at least 1, got ${JSON.stringify(value)}`,
    );
  }
}

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

  /* A HUB PISP tenant loads its mTLS client certificate (client.crt + private-key.pem) from certsDir — that certificate is the tenant's enrolled bank identity, so there is no sensible shared default. Require it explicitly rather than falling back to a directory another tenant might also use. */
  if (input.payments?.hubpisp && !input.payments.hubpisp.certsDir) {
    throw new Error(
      `Tenant "${id}": payments.hubpisp.certsDir is required (path to this ` +
        `tenant's mTLS client.crt and private-key.pem)`,
    );
  }

  validatePublicEnvKeys(`Tenant "${id}"`, input.publicEnv);

  /* The host is what workspace URLs are stored against and what every absolute
   * link is built from, so a tenant without one resolves no workspace at all.
   * Guaranteeing it for a configured tenant lets the pages that resolve one
   * rely on it, rather than discovering an undefined host at request time. A
   * tenant-less context (the auth pages) still has to handle its absence. */
  if (!input.publicEnv?.GOOVEE_PUBLIC_HOST) {
    throw new Error(`Tenant "${id}": publicEnv.GOOVEE_PUBLIC_HOST is required`);
  }

  validateCount(
    `Tenant "${id}": mail.maxConnections`,
    input.mail?.maxConnections,
  );

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
   * root derived above). The publicEnv default only satisfies the return type;
   * the validation above has already rejected an entry without one. */
  return {
    ...input,
    aos: {...input.aos, storage},
    publicEnv: input.publicEnv ?? {},
  };
}

/* Cross-tenant invariant. A HUB PISP tenant authenticates to BPCE with an mTLS
 * client certificate loaded from its certsDir (client.crt + private-key.pem) —
 * that certificate IS the tenant's enrolled bank identity, so two tenants must
 * never resolve to the same certsDir or they would transact as the same bank
 * client. certsDir is required per tenant (see normalizeTenantConfig), so this
 * only has to reject two tenants that point at the same directory. Paths are
 * resolved to absolute so equivalent specs (relative vs absolute, trailing
 * slash) compare equal. Runs across the whole tenant set, so it lives here
 * rather than in the per-tenant normalizeTenantConfig. */
function validateHubPispCertIsolation(tenants: Record<string, TenantConfig>) {
  const byCertsDir = new Map<string, string>(); // resolved certsDir -> tenant id
  for (const [id, config] of Object.entries(tenants)) {
    const configured = config.payments?.hubpisp?.certsDir;
    if (!configured) continue;
    const certsDir = path.resolve(configured);
    const owner = byCertsDir.get(certsDir);
    if (owner) {
      throw new Error(
        `Tenants "${owner}" and "${id}" share the same HUB PISP certsDir ` +
          `("${certsDir}"). Each HUB PISP tenant needs its own mTLS client ` +
          `certificate — set a distinct payments.hubpisp.certsDir per tenant.`,
      );
    }
    byCertsDir.set(certsDir, id);
  }
}

/* Cross-tenant invariant. Uploads are recorded as a path relative to the tenant's
 * storage root, so two tenants resolving to the same root share one namespace:
 * each would resolve the other's recorded paths, and the retention sweep would
 * delete from a directory holding another tenant's blobs. The roots compared here
 * are the resolved ones — a tenant on a shared AOS already has its aosTenantId
 * subdirectory baked in — so tenants sharing one AOS legitimately pass. */
function validateStorageIsolation(tenants: Record<string, TenantConfig>) {
  const roots: Array<[string, string]> = []; // [tenant id, resolved storage root]

  for (const [id, config] of Object.entries(tenants)) {
    const storage = path.resolve(config.aos.storage);

    for (const [owner, existing] of roots) {
      /* Containment, not just equality: a tenant that keeps the base path (no
       * aosTenantId) while another sits in a subdirectory of it would otherwise
       * pass, and the outer tenant's root then contains the inner one's — its
       * recorded paths resolve into the inner tenant's files and its retention
       * sweep deletes from them. */
      const nested =
        storage === existing ||
        storage.startsWith(existing + path.sep) ||
        existing.startsWith(storage + path.sep);

      if (nested) {
        throw new Error(
          `Tenants "${owner}" ("${existing}") and "${id}" ("${storage}") share ` +
            `a storage root — one contains the other. Give each tenant a ` +
            `directory of its own, or set aos.aosTenantId on every tenant that ` +
            `shares one AOS instance.`,
        );
      }
    }

    roots.push([id, storage]);
  }
}

/* Cross-tenant invariant. Tenants sharing one mail account share one connection
 * pool, so they must agree on how many connections that account allows: the pool
 * is built by whichever tenant sends first, and a disagreement would make the
 * ceiling depend on send order — intermittently exceeding the limit the lower
 * value was set to respect. */
function validateMailCeilings(tenants: Record<string, TenantConfig>) {
  const byAccount = new Map<string, {id: string; maxConnections: number}>();

  for (const [id, config] of Object.entries(tenants)) {
    const mail = config.mail;
    if (!mail?.host) continue;

    const account = mailAccountKey(mail);
    const existing = byAccount.get(account);

    /* Compared as they are applied, not as they are written: leaving the setting
     * out means the default, so a tenant that omits it agrees with one that
     * spells that same number out. Refusing those would make an operator edit a
     * file to state what the two configurations already mean. */
    const maxConnections = getMaxConnections(mail);

    if (existing && existing.maxConnections !== maxConnections) {
      throw new Error(
        `Tenants "${existing.id}" and "${id}" share the mail account ` +
          `"${mail.user}" on ${mail.host} but allow it a different number of ` +
          `connections (${existing.maxConnections} and ${maxConnections}). ` +
          `They share one connection pool, so the ceiling must match — set ` +
          `mail.maxConnections to the same value for both.`,
      );
    }

    if (!existing) {
      byAccount.set(account, {id, maxConnections});
    }
  }
}

function normalizeGlobalConfig(input: GlobalConfigInput): GlobalConfig {
  if (!input?.betterAuthSecret) {
    throw new Error('"$global".betterAuthSecret is required');
  }

  validateCount('"$global".pushMaxConnections', input.pushMaxConnections);
  validateCount('"$global".imageCacheMaxBytes', input.imageCacheMaxBytes);

  return {
    betterAuthSecret: input.betterAuthSecret,
    betterAuthUrl: input.betterAuthUrl,
    pushMaxConnections: input.pushMaxConnections,
    imageCacheMaxBytes: input.imageCacheMaxBytes,
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

  /* Marking happens here, once, as the document is read — before any secret can
   * be handed out. `taintSecret` skips a value it has already marked, so this is
   * the single point that needs to run and a stray call anywhere else is a no-op
   * rather than a leak of retained registrations. */
  for (const [name, value] of secrets) {
    taintSecret(
      `${name} is a server secret. Do not pass to Client Components.`,
      value,
    );
  }
}

function taintGlobalConfig(global: GlobalConfig) {
  taintSecret(
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

    /* With multi-tenancy off only the default entry is ever served, whatever
     * else the document holds. Said at load because the alternative is silence:
     * the server would start, report no mail and no push because there is
     * nothing it considers servable, and only then fail every request. */
    if (!isMultiTenancy && !tenants[DEFAULT_TENANT]) {
      throw new Error(
        `Tenant configuration has no "${DEFAULT_TENANT}" entry, which is the only one served ` +
          `while multi-tenancy is off. Rename the entry to serve, or set MULTI_TENANCY=true ` +
          `to serve every entry in the document.`,
      );
    }

    validateHubPispCertIsolation(tenants);
    validateStorageIsolation(tenants);
    validateMailCeilings(tenants);

    return {global, tenants};
  }

  /**
   * Null for an id that is not served, which with multi-tenancy off is every id
   * but the default: the manager hands back the default tenant's client for any
   * of them, so resolving one here would pair another tenant's configuration —
   * its signing keys, its browser variables — with the default tenant's data.
   *
   * Every other accessor is built on this one so that all of them refuse alike.
   */
  getSync(id: string): TenantConfig | null {
    if (!isMultiTenancy && id !== DEFAULT_TENANT) {
      return null;
    }

    return this.load().tenants[id] ?? null;
  }

  /* What is listed is what can be served. A document holding entries that are
   * not would otherwise have sign-in providers registered under names no login
   * can reach, and the startup reports describing mail and push for them. */
  listConfigsSync(): Array<[string, TenantConfig]> {
    if (isMultiTenancy) {
      return Object.entries(this.load().tenants);
    }

    const config = this.getSync(DEFAULT_TENANT);

    return config ? [[DEFAULT_TENANT, config]] : [];
  }

  getGlobalSync(): GlobalConfig {
    return this.load().global;
  }

  async get(id: string): Promise<TenantConfig | null> {
    return this.getSync(id);
  }

  async list(): Promise<string[]> {
    return this.listConfigsSync().map(([id]) => id);
  }
}

const provider = new DocumentTenantConfigProvider();

export const tenantConfigProvider: TenantConfigProvider = provider;

/**
 * Synchronous access for module-init consumers (the better-auth instance reads
 * the "$global" secret and the per-tenant OAuth entries at construction). A
 * future async registry provider would need init-time prefetching instead.
 */
export function listTenantConfigsSync(): Array<[string, TenantConfig]> {
  return provider.listConfigsSync();
}

export function getTenantConfigSync(id: string): TenantConfig | null {
  return provider.getSync(id);
}

export function getGlobalConfigSync(): GlobalConfig {
  return provider.getGlobalSync();
}
