import {z} from 'zod';

import {isFileSource} from '@/config/document';
import {readEnvironmentDocument} from '@/config/env';
import {CONFIG_FILE_STEM, configMode, readConfigFiles} from '@/config/files';
import {legacyNamesIn} from '@/config/legacy';
import {envNameFor} from '@/config/names';
import {configSchema} from '@/config/schema';
import {schemaAt, shapeOf} from '@/config/walk';
import {taintSecret} from '@/lib/core/security/taint';

import {buildRoutingIndex, type RoutingIndex} from './routing';
import type {DeploymentConfig, TenantConfig} from './types';

function taintTenantConfig(config: TenantConfig) {
  const secrets: Array<[string, string | undefined]> = [
    ['Database URL', config.db.url],
    ['AOS API key', config.aos.auth.apiKey],
    ['AOS password', config.aos.auth.password],
    ['Webhook secret', config.aos.webhookSecret],
    ['PayPal secret key', config.payments?.paypal?.clientSecret],
    ['Stripe secret key', config.payments?.stripe?.clientSecret],
    ['Stripe webhook secret', config.payments?.stripe?.webhookSecret],
    ['Session secret', config.sessionSecret],
    ['Paybox secret key', config.payments?.paybox?.secret],
    ['Up2Pay secret key', config.payments?.up2pay?.secret],
    ['Hub PISP client secret', config.payments?.hubpisp?.clientSecret],
    ['Mail password', config.mail?.password],
    ['Mattermost token', config.mattermost?.token],
    ['VAPID private key', config.webPush?.privateKey],
    ['Google client secret', config.oauth?.google?.clientSecret],
    ['Keycloak client secret', config.oauth?.keycloak?.clientSecret],
  ];

  /* Marking happens here, once, as the configuration is read — before any
   * secret can be handed out. `taintSecret` skips a value it has already marked,
   * so this is the single point that needs to run and a stray call anywhere
   * else is a no-op rather than a leak of retained registrations. */
  for (const [name, value] of secrets) {
    taintSecret(
      `${name} is a server secret. Do not pass to Client Components.`,
      value,
    );
  }
}

type ParsedConfig = {
  deployment: DeploymentConfig;
  tenants: Record<string, TenantConfig>;
  /**
   * The variable or file each setting was read from, keyed by the setting's
   * path.
   */
  sources: ReadonlyMap<string, string>;
};

type LoadedConfig = ParsedConfig & {routing: RoutingIndex};

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

/* Sources all configuration from two places that describe one document:
 *
 *   { origin, defaultTenant, push, imageCache, tenants: { <tenantId>: … } }
 *
 * The process environment first — every variable starting with PORTAL_,
 * assembled by @/config/env — and then the portal.config*.json files in the
 * working directory, read by @/config/files, which fill only what no variable
 * set. Both spell the same settings; there is no third mechanism. Single-tenant
 * is one tenant's settings. No value is inherited between tenants — every value
 * a tenant uses is declared under its own id, and the deployment-wide values
 * under none.
 *
 * What a valid configuration holds is declared in @/config/schema, and from that
 * same declaration `pnpm config:generate` writes the env.example, the JSON
 * example and the JSON Schema an operator writes their configuration from.
 *
 * Loading is synchronous so configuration is also available to module-init
 * consumers — the auth module reads the deployment origin as it is evaluated,
 * where there is nowhere to await. The exported readers below are the whole
 * public surface; the parsed configuration itself stays private to this module,
 * which is where another source — a registry database, say — would slot in
 * without a caller noticing. */
let loaded: LoadedConfig | undefined;

function load(): LoadedConfig {
  if (!loaded) {
    const parsed = read();

    /* Derived here rather than per request: every value it is read from is
     * fixed for the life of the process, and the environment is read once. */
    loaded = {
      ...parsed,
      routing: buildRoutingIndex(
        parsed.deployment.origin,
        Object.entries(parsed.tenants),
      ),
    };
  }
  return loaded;
}

/* A refused configuration, every fault at once, each against the variable or
 * the file entry it belongs to: an operator filling in a new tenant has several
 * and one at a time means one restart each. A setting the parse never saw a
 * value for reads as required rather than as "expected string, received
 * undefined", and is named as the variable, since that is the spelling a file
 * has no entry for either. */
function describeIssues(
  issues: z.core.$ZodIssue[],
  sources: ReadonlyMap<string, string>,
): string {
  return issues
    .map(issue => {
      const variable = envNameFor(issue.path);
      const setting = issue.path.map(String).join('.');
      const source = sources.get(setting);

      /* A value a file supplied is reported where it was written, since the
       * variable's name is not a spelling that file holds. */
      const label =
        source && isFileSource(source) ? `${source}: ${setting}` : variable;

      /* Missing, as opposed to present and wrong: no source supplied the
       * setting. Decided from the sources rather than from the issue, which
       * carries no input unless zod is configured to report it, and whose
       * message says "received undefined" only in one wording. */
      if (issue.code === 'invalid_type' && !sources.has(setting)) {
        /* A whole group left out is reported against a name no variable
         * carries — PORTAL_TENANT_D_AOS_AUTH is nothing an operator can set —
         * so the variables that would fill it are named instead. */
        const group = schemaAt(configSchema, issue.path);
        const shape = group ? shapeOf(group) : null;

        if (shape) {
          /* A child that is itself a group is shown with the ellipsis, so the
           * operator is not sent looking for a variable of that name. */
          const settings = Object.entries(shape)
            .map(
              ([key, child]) =>
                `${envNameFor([...issue.path, key])}${shapeOf(child) ? '_…' : ''}`,
            )
            .join(', ');

          return `  ${variable}_…: is required; set its settings: ${settings}`;
        }

        return `  ${variable}: is required`;
      }

      return `  ${label}: ${issue.message}`;
    })
    .join('\n');
}

function read(): ParsedConfig {
  const environment = readEnvironmentDocument(process.env);

  /* The files fill what the environment left unset, so a variable wins over
   * the same setting in any file, as it does over a .env file. */
  const files = readConfigFiles(process.cwd(), configMode(), environment);

  const {document, sources} = environment;
  const issues = [...environment.issues, ...files.issues];

  if (environment.count === 0 && files.files.length === 0) {
    /* `next build` evaluates module-init code (the auth module's origin read)
     * with no runtime configuration present — the environment is absent during
     * an image build. Return a minimal placeholder so the build can analyse
     * routes; real configuration is required at runtime and for CLI scripts,
     * where NEXT_PHASE is unset and this throws instead. */
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return {
        deployment: {
          /* An origin, because the auth instance parses this one as it is
           * constructed. `.invalid` is reserved and resolves nowhere, so a
           * build that reached the network with it would fail rather than
           * talk to a host somebody owns. */
          origin: 'http://build-time-placeholder.invalid',
        },
        tenants: tenantMap(),
        sources: new Map(),
      };
    }

    /* A deployment upgraded without migrating still carries the variables the
     * previous release read. Naming them is what tells the operator this is a
     * migration rather than a missing file. */
    const legacy = legacyNamesIn(process.env);

    throw new Error(
      `No configuration found: no ${envNameFor([])} variable is set and ` +
        `there is no ${CONFIG_FILE_STEM}.json in ${process.cwd()}. See ` +
        `env.example and ${CONFIG_FILE_STEM}.example.json.` +
        (legacy.length
          ? `\nThe environment carries variables an earlier release read ` +
            `(${legacy.slice(0, 5).join(', ')}${legacy.length > 5 ? ', …' : ''}); ` +
            `run \`pnpm config:migrate\` to write their replacements.`
          : ''),
    );
  }

  /* A variable or a file entry that named no setting is refused before the
   * parse: the setting it was meant for is unset, and the parse would report
   * that one as missing while saying nothing about the misspelling that caused
   * it. */
  if (issues.length) {
    throw new Error(
      `Configuration is invalid:\n` +
        issues.map(issue => `  ${issue.name} ${issue.message}`).join('\n'),
    );
  }

  const result = configSchema.safeParse(document);

  if (!result.success) {
    throw new Error(
      `Configuration is invalid:\n${describeIssues(result.error.issues, sources)}`,
    );
  }

  const {tenants: entries, ...parsed} = result.data;

  const ids = Object.keys(entries);

  /* One tenant is the only tenant the addresses naming none can mean, so it is
   * filled in rather than asked for: a deployment that declared it would be
   * repeating what it already said. Written into the configuration rather than
   * answered by `getDefaultTenantId` alone, so that everything reading the
   * deployment's settings — `/deployment/info`, `pnpm config:check` — reports
   * the tenant `/` actually leads to.
   *
   * Filled after the parse, so the checks that ran against what was written
   * see the same document an operator sees. Nothing is lost by that: only an
   * absent value is filled, and the value filled is the one configured tenant
   * — which is also the only tenant either check could accept here, so neither
   * would have refused it. It carries no entry in `sources`, which is right:
   * no variable and no file supplied it. */
  const deployment =
    !parsed.defaultTenant && ids.length === 1
      ? {...parsed, defaultTenant: ids[0]}
      : parsed;

  const tenants = tenantMap(entries);

  for (const config of Object.values(tenants)) {
    taintTenantConfig(config);
  }

  return {deployment, tenants, sources};
}

/* The configuration is read once and kept, so every reader here answers without
 * waiting. Module setup depends on that: the auth module reads the deployment
 * origin while it is being evaluated, where there is nowhere to await. */

/**
 * Null for an id the configuration does not declare. This is what refuses a
 * tenant segment taken from a URL; nothing else validates it.
 */
export function getTenantConfig(id: string): TenantConfig | null {
  return load().tenants[id] ?? null;
}

/** The settings bound to the single process rather than to a tenant. */
export function getDeploymentConfig(): DeploymentConfig {
  return load().deployment;
}

/* Every tenant the configuration declares is served. The configuration alone
 * decides how many tenants a deployment has. */
export function listTenantConfigs(): Array<[string, TenantConfig]> {
  return Object.entries(load().tenants);
}

export function listTenantIds(): string[] {
  return listTenantConfigs().map(([id]) => id);
}

/**
 * The variable or file each setting was read from, for a report of what a
 * deployment is running on. Names only — the values are the secrets.
 */
export function listConfigSources(): Array<[string, string]> {
  return [...load().sources.entries()];
}

/**
 * How the configured tenants are addressed, in the form the request path
 * reads: host lookups rather than a scan over the tenants.
 */
export function getRoutingIndex(): RoutingIndex {
  return load().routing;
}

/**
 * The tenant used by addresses that name none: `/`, and a script run without
 * `--tenant`.
 *
 * Always answered for a deployment configuring one tenant, which the load fills
 * in. Beyond one it is declared, and required as soon as any tenant is reached
 * under a path segment — so this is null only where every tenant is reached by
 * host and none was named, and then those addresses have to be told which
 * tenant they are for. Null during a `next build` that carries no
 * configuration as well, which stands in a placeholder naming no tenant.
 *
 * The configuration is checked at load, so any name returned here names a
 * configured tenant.
 */
export function getDefaultTenantId(): string | null {
  return load().deployment.defaultTenant ?? null;
}
