import fs from 'fs';

import {z} from 'zod';

import {taintSecret} from '@/lib/core/security/taint';
import {tenantsConfigFile, tenantsConfigInline} from './env';
import {configDocumentSchema} from './schema';
import type {GlobalConfig, TenantConfig} from './types';

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

/*
 * Prototype-less, because a tenant id is a URL path segment and the segments
 * naming a member of Object.prototype — "toString", "constructor", "valueOf" —
 * hold letters only, so they reach a lookup here like any other id. On an
 * ordinary object each resolves to an inherited function, which passes for a
 * tenant's configuration until something reads a database url that is not
 * there: a request for a tenant that does not exist is then answered with a
 * server error rather than not-found.
 */
function tenantMap(
  entries?: Record<string, TenantConfig>,
): Record<string, TenantConfig> {
  return Object.assign(
    Object.create(null) as Record<string, TenantConfig>,
    entries,
  );
}

/* Sources all configuration from a single JSON document — TENANTS_CONFIG_FILE
 * (path) or TENANTS_CONFIG (inline). Shape:
 *
 *   { "$global": GlobalConfig, "<tenantId>": TenantConfig, ... }
 *
 * It is the one and only configuration mechanism: single-tenant is just a
 * one-entry document. Nothing is read from the process env for tenant- or
 * deployment-scoped settings, and no value is inherited between sections
 * (no fallback) — every value a tenant uses lives in its own entry, and the
 * deployment-wide values live in "$global".
 *
 * What a valid document holds is declared in ./schema, and from that same
 * declaration `pnpm config:schema` generates the JSON Schema an operator's
 * editor checks the document against.
 *
 * Loading is synchronous (readFileSync at first access) so config is also
 * available to module-init consumers — the better-auth instance needs the
 * "$global" secret and the per-tenant OAuth entries before any request. */
class DocumentTenantConfigProvider {
  private loaded: LoadedConfig | undefined;

  private load(): LoadedConfig {
    if (!this.loaded) {
      this.loaded = this.read();
    }
    return this.loaded;
  }

  private read(): LoadedConfig {
    const source = tenantsConfigFile
      ? fs.readFileSync(tenantsConfigFile, 'utf8')
      : tenantsConfigInline;

    if (!source) {
      /* `next build` evaluates module-init code (the better-auth instance, the
       * OAuth provider list) with no runtime config present — env is absent
       * during an image build, and so is the document. Return a minimal
       * placeholder so the build can analyse routes; real configuration is
       * required at runtime and for CLI scripts, where NEXT_PHASE is unset and
       * this throws instead. */
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return {
          global: {
            betterAuthSecret: 'build-time-placeholder',
            /* An origin, because the auth instance parses this one as it is
             * constructed. `.invalid` is reserved and resolves nowhere, so a
             * build that reached the network with it would fail rather than
             * talk to a host somebody owns. */
            betterAuthUrl: 'http://build-time-placeholder.invalid',
          },
          tenants: tenantMap(),
        };
      }
      throw new Error(
        'No tenant configuration found: set TENANTS_CONFIG_FILE (path, ' +
          'preferred) or TENANTS_CONFIG (inline JSON). See ' +
          'tenants.config.example.json.',
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(source);
    } catch (err) {
      throw new Error('Tenant configuration is not valid JSON', {cause: err});
    }

    const result = configDocumentSchema.safeParse(parsed);

    if (!result.success) {
      /* Every fault at once, each against the tenant and field it belongs to,
       * because an operator filling in a new entry has several and one at a time
       * means one restart each. The invariants spanning tenants are among them: a
       * value a field rejected still reaches those checks, so a document that
       * both mis-spells a value and lets two tenants collide reports both. A
       * fault the parse stops at costs the checks spanning tenants instead, and
       * only those: a field of the wrong type, a missing one, or a setting name
       * no section declares. */
      throw new Error(
        `Tenant configuration is invalid (${tenantsConfigFile || 'TENANTS_CONFIG'}):\n` +
          z.prettifyError(result.error),
      );
    }

    const {$schema: _schema, $global: global, ...entries} = result.data;

    const tenants = tenantMap(entries);

    taintGlobalConfig(global);
    for (const config of Object.values(tenants)) {
      taintTenantConfig(config);
    }

    return {global, tenants};
  }

  /**
   * Null for an id the document does not name. This is what refuses a tenant
   * segment taken from a URL; nothing else validates it.
   */
  get(id: string): TenantConfig | null {
    return this.load().tenants[id] ?? null;
  }

  /* Every entry the document names is served. The document alone decides how
   * many tenants a deployment has. */
  listConfigs(): Array<[string, TenantConfig]> {
    return Object.entries(this.load().tenants);
  }

  list(): string[] {
    return this.listConfigs().map(([id]) => id);
  }

  getGlobal(): GlobalConfig {
    return this.load().global;
  }
}

const provider = new DocumentTenantConfigProvider();

export const tenantConfigProvider = provider;

/* The document is read from disk once and kept, so every accessor here answers
 * without waiting. Module setup depends on that: the better-auth instance reads
 * the "$global" secret and the per-tenant OAuth entries while it is being
 * constructed, where there is nowhere to await. */
export function listTenantConfigs(): Array<[string, TenantConfig]> {
  return provider.listConfigs();
}

export function getTenantConfig(id: string): TenantConfig | null {
  return provider.get(id);
}

export function getGlobalConfig(): GlobalConfig {
  return provider.getGlobal();
}
