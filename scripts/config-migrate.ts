import fs from 'fs';
import path from 'path';
import readline from 'readline';

import {config as loadDotenv} from 'dotenv';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';

import {
  PUBLIC_ENV_KEYS,
  type GlobalConfigInput,
  type PublicEnv,
  type TenantConfigInput,
} from '@/tenant/types';

/* The id keying the one tenant this writes. It becomes the segment every
 * address of the deployment carries, and changing it is renaming this key —
 * nothing else reads the name. */
const TENANT_ID = 'd';

/* Load .env files with Next.js precedence for the chosen mode (more-specific
 * files win — loaded first, never overridden). This matches the set Next loads
 * at runtime, so the migration sees the same environment the app would — not
 * the subset @/load-swc-env reads. */
function loadEnv(dev: boolean) {
  const mode = dev ? 'development' : 'production';
  const files = [`.env.${mode}.local`, '.env.local', `.env.${mode}`, '.env'];
  for (const file of files) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      loadDotenv({path: fullPath, override: false, quiet: true});
    }
  }
}

/* A count setting carried over verbatim. Left out when absent or unusable rather
 * than corrected here — the provider validates it by name at load, so a typo is
 * reported against the document the operator is about to review. */
function count(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

function publicEnvFromEnv(): TenantConfigInput['publicEnv'] {
  const publicEnv: PublicEnv = {};
  for (const key of PUBLIC_ENV_KEYS) {
    const value = process.env[key];
    if (value) {
      publicEnv[key] = value;
    }
  }

  return {
    ...publicEnv,
    /* Required per tenant, so always emit it — a blank to fill in is reviewable,
     * whereas an omitted key just fails at boot with nothing to point at. */
    GOOVEE_PUBLIC_HOST: process.env.GOOVEE_PUBLIC_HOST ?? '',
  };
}

function paymentsFromEnv(): TenantConfigInput['payments'] {
  const payments: NonNullable<TenantConfigInput['payments']> = {};

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
      /* No environment variable ever carried this — the path was hardcoded
       * before the configuration document existed, so this is where the
       * certificates of the deployment being migrated already are. */
      certsDir: 'certs/hubpisp',
    };
  }

  return Object.keys(payments).length ? payments : undefined;
}

function mailFromEnv(): TenantConfigInput['mail'] {
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
    maxConnections: count(process.env.MAIL_MAX_CONNECTIONS),
  };
}

function mattermostFromEnv(): TenantConfigInput['mattermost'] {
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

function webPushFromEnv(): TenantConfigInput['webPush'] {
  if (!(process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT)) {
    return undefined;
  }

  return {
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT,
  };
}

function oauthFromEnv(): TenantConfigInput['oauth'] {
  const oauth: NonNullable<TenantConfigInput['oauth']> = {};

  if (
    process.env.SHOW_GOOGLE_OAUTH === 'true' &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  ) {
    oauth.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (
    process.env.SHOW_KEYCLOAK_OAUTH === 'true' &&
    process.env.KEYCLOAK_ID &&
    process.env.KEYCLOAK_SECRET &&
    process.env.KEYCLOAK_ISSUER
  ) {
    oauth.keycloak = {
      clientId: process.env.KEYCLOAK_ID,
      clientSecret: process.env.KEYCLOAK_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    };
  }

  return Object.keys(oauth).length ? oauth : undefined;
}

function buildGlobal(): GlobalConfigInput {
  return {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? '',
    betterAuthUrl: process.env.BETTER_AUTH_URL ?? '',
    /* So that "/" and the sign-in screens keep answering for a deployment that
     * has never named a tenant in an address. */
    defaultTenant: TENANT_ID,
    pushMaxConnections: count(process.env.PUSH_MAX_CONNECTIONS),
    imageCacheMaxBytes: count(process.env.IMAGE_CACHE_MAX_BYTES),
  };
}

function buildDefaultTenant(): TenantConfigInput {
  return {
    db: {url: process.env.DATABASE_URL ?? ''},
    aos: {
      url: process.env.AOS_URL ?? '',
      aosTenantId: process.env.AOS_TENANT_ID || undefined,
      storage: process.env.DATA_STORAGE || path.join(process.cwd(), 'storage'),
      auth: process.env.AOS_API_KEY
        ? {apiKey: process.env.AOS_API_KEY}
        : {
            username: process.env.BASIC_AUTH_USERNAME,
            password: process.env.BASIC_AUTH_PASSWORD,
          },
      webhookSecret: process.env.NOTIFICATION_WEBHOOK_SECRET || undefined,
    },
    payments: paymentsFromEnv(),
    mail: mailFromEnv(),
    mattermost: mattermostFromEnv(),
    webPush: webPushFromEnv(),
    oauth: oauthFromEnv(),
    includeLanguage: process.env.INCLUDE_LANGUAGE
      ? process.env.INCLUDE_LANGUAGE === 'true'
      : undefined,
    uploadRecordRetentionHours: process.env.UPLOAD_RECORD_RETENTION_HOURS
      ? Number(process.env.UPLOAD_RECORD_RETENTION_HOURS)
      : undefined,
    publicEnv: publicEnvFromEnv(),
  };
}

/* Ask before clobbering an existing config — never silently rewrite one. */
function confirmOverwrite(filePath: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  return new Promise(resolve => {
    rl.question(`${filePath} already exists. Overwrite it? [y/N] `, answer => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

type Values = {dev?: boolean};

runScript<Values, [string | null]>({
  command: 'pnpm config:migrate',
  title: 'Environment to tenant document',
  summary: `Writes a configuration document — a "$global" section plus one
"${TENANT_ID}" tenant — from the .env files the application would read, so a
deployment already configured through the environment can move to a document
without its settings being retyped. Rename the tenant key to serve the
deployment under another id, and "$global.defaultTenant" with it. Prompts
before overwriting an existing file.`,
  options: command =>
    command
      .option('--dev', 'Read the development-mode .env files')
      .argument('[path]', 'Where to write the document'),
  run: async ({values, args}) => {
    loadEnv(Boolean(values.dev));

    /* Built after loadEnv so the *FromEnv builders read the loaded values.
     * JSON.stringify drops `undefined` keys, so omitted sections disappear. */
    const document: Record<
      string,
      string | GlobalConfigInput | TenantConfigInput
    > = {
      $schema: './tenants.config.schema.json',
      $global: buildGlobal(),
      [TENANT_ID]: buildDefaultTenant(),
    };

    const outPath = path.resolve(
      process.cwd(),
      args[0] ?? 'tenants.config.json',
    );

    if (fs.existsSync(outPath) && !(await confirmOverwrite(outPath))) {
      out.fail('Aborted — existing file left unchanged.');
    }

    fs.writeFileSync(outPath, JSON.stringify(document, null, 2) + '\n');

    out.ok(
      `Wrote ${outPath} — review it, fill any blank required fields, then set ` +
        `TENANTS_CONFIG_FILE to its path.`,
    );
  },
});
