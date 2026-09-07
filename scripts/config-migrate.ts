import fs from 'fs';
import path from 'path';
import readline from 'readline';

import {loadEnvConfig} from '@next/env';
import {Option} from 'commander';

import * as out from '@/scripts/lib/output';
import {runScript} from '@/scripts/lib/script';

import {flattenToEnvironment} from '@/config/env';
import {CONFIG_FILE_STEM, CONFIG_SCHEMA_FILE} from '@/config/files';
import type {
  ConfigInput,
  DeploymentConfigInput,
  TenantConfigInput,
} from '@/config/schema';

/* What the written configuration is spelled as: the JSON document the loader
 * reads from portal.config.json, or the PORTAL_* variables of a .env file. */
const FORMATS = {
  json: {file: `${CONFIG_FILE_STEM}.json`},
  env: {file: 'portal.env'},
} as const;

/* Held to these by the option's `.choices()`, which is what lets the values be
 * typed as the key. */
type Format = keyof typeof FORMATS;

/* The id of the one tenant this writes. It becomes the segment every address of
 * the deployment carries and the segment of every variable that configures it,
 * and changing it is renaming both — nothing else reads the name. */
const TENANT_ID = 'd';

/* Loads the `.env` files the way the server does: the production ones where
 * NODE_ENV=production is set, the test ones where it is `test`, the development
 * ones otherwise. Called at run time rather than on import, so nothing is read
 * before the overwrite prompt has been answered. */
function loadEnv() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
}

/* A count setting carried over verbatim. Left out when absent or unusable
 * rather than written through — a required setting is then reported missing
 * against its own name and an optional one falls back to its default, instead
 * of the file carrying a value the parse cannot word. */
function count(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

function publicFromEnv(): TenantConfigInput['public'] {
  const env = process.env;

  return {
    /* Required per tenant, so always emitted — a blank to fill in is
     * reviewable, whereas an omitted variable just fails at boot. */
    host: env.GOOVEE_PUBLIC_HOST ?? '',
    paypal: env.GOOVEE_PUBLIC_PAYPAL_CLIENT_ID
      ? {clientId: env.GOOVEE_PUBLIC_PAYPAL_CLIENT_ID}
      : undefined,
    webPush: env.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY
      ? {publicKey: env.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY}
      : undefined,
    mattermost: env.GOOVEE_PUBLIC_MATTERMOST_HOST
      ? {host: env.GOOVEE_PUBLIC_MATTERMOST_HOST}
      : undefined,
    keycloak:
      env.GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_LABEL ||
      env.GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_IMAGE
        ? {
            buttonLabel:
              env.GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_LABEL || undefined,
            buttonImage:
              env.GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_IMAGE || undefined,
          }
        : undefined,
    links:
      env.GOOVEE_PUBLIC_LINKEDIN_URL ||
      env.GOOVEE_PUBLIC_TWITTER_URL ||
      env.GOOVEE_PUBLIC_INSTAGRAM_URL ||
      env.GOOVEE_PUBLIC_WHATSAPP_URL
        ? {
            linkedin: env.GOOVEE_PUBLIC_LINKEDIN_URL || undefined,
            twitter: env.GOOVEE_PUBLIC_TWITTER_URL || undefined,
            instagram: env.GOOVEE_PUBLIC_INSTAGRAM_URL || undefined,
            whatsapp: env.GOOVEE_PUBLIC_WHATSAPP_URL || undefined,
          }
        : undefined,
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
      /* No variable carried this. The release being migrated from read the
       * certificates from `certs/hubpisp` under the working directory, so that
       * is where a migrating deployment's already are. */
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
    /* Left out where it is not a number, so the load reports it missing
     * against its own name rather than the file writing a null. */
    port: count(process.env.MAIL_PORT) as number,
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

function buildDeployment(): DeploymentConfigInput {
  const pushMaxConnections = count(process.env.PUSH_MAX_CONNECTIONS);
  const imageCacheMaxBytes = count(process.env.IMAGE_CACHE_MAX_BYTES);

  return {
    origin: process.env.BETTER_AUTH_URL ?? '',
    /* So that "/" keeps answering for a deployment that has never named a
     * tenant in an address. */
    defaultTenant: TENANT_ID,
    push: pushMaxConnections ? {maxConnections: pushMaxConnections} : undefined,
    imageCache: imageCacheMaxBytes ? {maxBytes: imageCacheMaxBytes} : undefined,
  };
}

function buildTenant(): TenantConfigInput {
  const retentionHours = count(process.env.UPLOAD_RECORD_RETENTION_HOURS);

  return {
    /* Per tenant, so a deployment that grows a second one does not sign both
     * tenants' sessions with the same key. The value the previous release used
     * is carried across, so an upgrade in place keeps one key rather than
     * inventing another. Sessions do not survive it: a cookie name carries the
     * tenant, so no cookie already issued is read back. */
    sessionSecret: process.env.BETTER_AUTH_SECRET ?? '',
    db: {url: process.env.DATABASE_URL ?? ''},
    aos: {
      url: process.env.AOS_URL ?? '',
      tenantId: process.env.AOS_TENANT_ID || undefined,
      storage: process.env.DATA_STORAGE || path.join(process.cwd(), 'storage'),
      /* Blanks rather than nothing where neither credential was set: a blank
       * to fill in is reviewable, and the load then refuses the pair as
       * incomplete rather than reporting a whole group missing. */
      auth: process.env.AOS_API_KEY
        ? {apiKey: process.env.AOS_API_KEY}
        : {
            username: process.env.BASIC_AUTH_USERNAME ?? '',
            password: process.env.BASIC_AUTH_PASSWORD ?? '',
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
    upload: retentionHours ? {recordRetentionHours: retentionHours} : undefined,
    public: publicFromEnv(),
  };
}

/*
 * A value as a `.env` line carries it, so that what is written is what the
 * loader reads back.
 *
 * `$` is escaped because the loader expands `${VAR}` references in every value;
 * a value holding whitespace, a `#` or a quote is wrapped in the quote character
 * it does not itself contain, because an unquoted `#` starts a comment and
 * unquoted whitespace is trimmed.
 */
function quoteEnvValue(value: string): string | null {
  const escaped = value.replace(/\$/g, '\\$');

  if (!/[\s#'"`]/.test(escaped)) return escaped;

  /* Single quotes and backticks are read back as written; double quotes turn a
   * literal `\n` or `\r` into a line break, so they are the last resort and
   * only for a value holding neither. A value holding all three quote
   * characters has no spelling on a `.env` line at all. */
  const quote = !escaped.includes("'")
    ? "'"
    : !escaped.includes('`')
      ? '`'
      : !escaped.includes('"') && !/\\[nr]/.test(escaped)
        ? '"'
        : null;

  return quote ? `${quote}${escaped}${quote}` : null;
}

/* One `.env` line, or a comment naming the variable whose value has no spelling
 * on such a line, so the operator sets it by another route. */
function envLine(variable: string, value: string): string {
  const quoted = quoteEnvValue(value);

  if (quoted === null) {
    out.warn(
      `${variable}: the value cannot be written on a .env line; set it by hand.`,
    );

    return `# ${variable}: set by hand — the value cannot be written on a .env line`;
  }

  return `${variable}=${quoted}`;
}

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

/* The document as `.env` lines, with the one build-time variable carried along
 * since a `.env` file is where it lives too. */
function renderEnv(document: ConfigInput): string {
  const lines = flattenToEnvironment(document).map(([variable, value]) =>
    envLine(variable, value),
  );

  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    lines.push(
      '',
      envLine('NEXT_PUBLIC_BASE_PATH', process.env.NEXT_PUBLIC_BASE_PATH),
    );
  }

  const header = [
    '# Written by pnpm config:migrate from the variables of the previous',
    '# release. Review it, fill in any blank value, then use it as the',
    "# deployment's .env (or pass it with docker run --env-file) in place",
    '# of the old variables, which are no longer read. See env.example for',
    '# every setting.',
    '',
  ];

  return [...header, ...lines, ''].join('\n');
}

/* The document as the loader reads it from portal.config.json. A section left
 * undefined is dropped by the serialisation. NEXT_PUBLIC_BASE_PATH is not in
 * it — it is inlined at build time, so no portal.config file can carry it. */
function renderJson(document: ConfigInput): string {
  return `${JSON.stringify({$schema: `./${CONFIG_SCHEMA_FILE}`, ...document}, null, 2)}\n`;
}

runScript<{format: Format}, [string | null]>({
  command: 'pnpm config:migrate',
  title: 'Environment migration',
  summary: `Writes the configuration — the deployment's settings plus one
tenant, "${TENANT_ID}" — from the variables a release before it read, taken
from the process environment and the .env files the server loads, so a
deployment already configured through the environment moves to the new settings
without them being retyped. Written as ${FORMATS.json.file} unless --format env
asks for the PORTAL_* variables of a .env file. Rename the tenant id to serve
the deployment under another one, and defaultTenant with it. Set
NODE_ENV=production to read the production .env files. Prompts before
overwriting an existing file.`,
  options: command =>
    command
      .addOption(
        new Option(
          '--format <format>',
          `What to write: json (${FORMATS.json.file}) or env (${FORMATS.env.file})`,
        )
          .choices(Object.keys(FORMATS))
          .default('json'),
      )
      .argument(
        '[path]',
        'Where to write the configuration; defaults to the name the format gives',
      ),
  run: async ({values, args}) => {
    const {format} = values;

    const outPath = path.resolve(
      process.cwd(),
      args[0] ?? FORMATS[format].file,
    );

    if (fs.existsSync(outPath) && !(await confirmOverwrite(outPath))) {
      out.fail('Aborted — existing file left unchanged.');
    }

    loadEnv();

    /* Built after loadEnv so the *FromEnv builders read the loaded values. */
    const document: ConfigInput = {
      ...buildDeployment(),
      tenants: {[TENANT_ID]: buildTenant()},
    };

    fs.writeFileSync(
      outPath,
      format === 'json' ? renderJson(document) : renderEnv(document),
    );

    if (format === 'json' && process.env.NEXT_PUBLIC_BASE_PATH) {
      out.note(
        `NEXT_PUBLIC_BASE_PATH stays a variable: it is inlined when the portal ` +
          `is built, and no ${CONFIG_FILE_STEM} file can carry it.`,
      );
    }

    /* Where the file has to be before anything reads it: the loader looks for
     * `portal.config*.json` in the working directory, and `portal.env` is a
     * name nothing looks for at all. Saying "run config:check" without that
     * step would send an operator who wrote the file anywhere else to a check
     * reporting no configuration. */
    out.ok(
      `Wrote ${outPath} — review it and fill any blank value. ` +
        (format === 'json'
          ? `Then put it in the server's working directory as ` +
            `${CONFIG_FILE_STEM}.json and run \`pnpm config:check\` there; ` +
            `the old variables are no longer read and can go.`
          : `Then put it in place as the deployment's \`.env\` (or pass it ` +
            `with \`docker run --env-file\`) and run \`pnpm config:check\` ` +
            `there; the old variables are no longer read and can go.`),
    );
  },
});
