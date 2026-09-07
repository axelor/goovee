import {randomUUID} from 'node:crypto';
import {DeliverySlots} from '@/lib/core/concurrency/delivery-slots';
import type {TenantConfig} from '@/tenant';
import nodemailer, {type Transporter} from 'nodemailer';
import type SMTPPool from 'nodemailer/lib/smtp-pool';
import type Mail from 'nodemailer/lib/mailer';

import {NotificationService, type MailNotificationData} from '.';
import {
  getMaxConnections,
  mailAccountKey,
  type MailSettings,
} from './mail-account';

/* `maxRequeues` is a real pooled-transport option that is missing from
 * `@types/nodemailer`. Required rather than optional, so it cannot be dropped. */
type PoolOptions = SMTPPool.Options & {maxRequeues: number};

/* Tenants already told they have no mail settings. Keyed by the config object,
 * which the provider reads once per process, so each tenant is reported once
 * rather than once per recipient. */
const reportedUnconfigured = new WeakSet<TenantConfig>();

/* Nodemailer's own default, stated because a shared pool actually reaches it. */
const MAX_MESSAGES = 100;

/* Absent, nodemailer reads this as unlimited: a connection dying with a message in
 * flight requeues it forever and `sendMail` never settles. One covers the race it
 * exists for — a message assigned to a connection the server was already closing —
 * and exhausting it raises REQUEUE_EXHAUSTED_MESSAGE below. */
const MAX_REQUEUES = 1;

/* Nodemailer defaults to 120s to connect and 30s for the greeting, either of which
 * alone outlasts the whole retry schedule against a host that drops packets
 * silently. Nothing has been sent at that point, so giving up early costs only a
 * reconnection. */
const CONNECTION_TIMEOUT_MS = 10_000;
const GREETING_TIMEOUT_MS = 10_000;

/* Nodemailer never retries a message; the policy is the caller's. Sized against how
 * long a one-time code stays valid — ten minutes from issue
 * (`lib/core/otp/constants`) — since a code delivered long after that is dead. No
 * message survives a restart; that needs a durable queue. */
const RETRY_DELAYS_MS = [
  1_000, 5_000, 30_000, 60_000, 120_000, 120_000, 120_000,
];

const MAX_SEND_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

/* Spreads each delay either way, so a fan-out that failed together does not
 * retry together. */
const RETRY_JITTER = 0.2;

/* Raised bare, with no code, once nodemailer's own requeue is spent — reachable
 * because a pooled message can be assigned to a closing connection, requeue, and
 * meet a second one. Matched on the text because there is nothing else to match on,
 * so a reworded release would silently stop retrying it. */
const REQUEUE_EXHAUSTED_MESSAGE =
  'Reached maximum number of retries after connection was closed';

/* Codes nodemailer raises for a failure that may succeed later: a connection
 * that could not be made, was lost, or whose TLS upgrade was interrupted. */
const TEMPORARY_ERROR_CODES = new Set([
  'ECONNECTION',
  'ETIMEDOUT',
  'EDNS',
  'ESOCKET',
  'ETLS',
  'EPROTOCOL',
]);

/* A 4xx reply means "try again later" and a 5xx is settled, so a reply in that range
 * is the verdict and the code is not: nodemailer attaches `ECONNECTION` or
 * `EPROTOCOL` to a rejection the server followed with a close.
 *
 * Outside it, `responseCode` is not a verdict at all — it is parsed from whatever
 * digits the last response began with, which is a truncated fragment on a cut
 * mid-reply and the preceding `250` on a mid-transaction close. */
function isTemporary(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const {code, responseCode, message} = error as {
    code?: unknown;
    responseCode?: unknown;
    message?: unknown;
  };

  if (typeof responseCode === 'number' && responseCode >= 400) {
    if (responseCode < 500) {
      return true;
    }

    if (responseCode < 600) {
      return false;
    }
  }

  if (typeof code === 'string' && TEMPORARY_ERROR_CODES.has(code)) {
    return true;
  }

  return message === REQUEUE_EXHAUSTED_MESSAGE;
}

function getRetryDelay(attempt: number): number {
  const base = RETRY_DELAYS_MS[attempt - 1];
  const spread = base * RETRY_JITTER;

  return Math.round(base - spread + Math.random() * spread * 2);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const LOG_VALUE_MAX_LENGTH = 200;

/* Everything these logs interpolate comes from user input — a forum title, a
 * webhook payload, an address typed into the ERP — and nothing upstream strips
 * newlines, so a crafted one could forge a whole log line. Bounded as well as
 * scrubbed, since none of those fields has a length limit upstream. */
function forLog(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').slice(0, LOG_VALUE_MAX_LENGTH);
}

/* Called once per message, before the retry loop, so every attempt carries the
 * same id. Nodemailer compiles a fresh message per `sendMail` and would otherwise
 * mint a new one each time, and a retry of a message the server had in fact
 * accepted would arrive as two unrelated mails rather than recognisable
 * duplicates.
 *
 * The domain is taken from the last `@` onwards rather than by splitting, because
 * `from` is an address field and may carry a display name and angle brackets —
 * `Goovee Portal <portal@example.com>` — which a split would turn into a
 * malformed `example.com>`. Falls back when there is no address at all, as with a
 * relay whose user is a literal like `apikey`. */
function createMessageId(from: string | undefined): string {
  const domain = from?.match(/@([^@\s>]+)>?\s*$/)?.[1] || 'localhost';

  return `<${randomUUID()}@${domain}>`;
}

/* Names the account, because a deployment with several cannot otherwise tell
 * whose mail server is falling behind. */
function describeMailBacklog(mail: MailSettings, queued: number): string {
  return `[MAIL] ${queued} messages are waiting to send for ${forLog(mail.user)}@${forLog(mail.host)} — the mail server is not keeping up`;
}

/**
 * A pool and its slots, keyed by the mail account they belong to.
 *
 * Keyed on the SMTP identity rather than the tenant: a mail server limits
 * concurrency per sender, so two tenants configured onto one mailbox must share
 * one pool or between them open twice what that account allows. Separate
 * accounts get separate pools, so one tenant's fan-out cannot occupy another's
 * connections or queue.
 *
 * Held in a global because an orphaned pooled transport leaks its open sockets,
 * and this module is evaluated once per bundler layer and again on every
 * Turbopack recompile. In development that outlives the settings it was built
 * from, so an edited mail account leaves its previous pool behind until restart.
 *
 * A plain map rather than a bounded cache: the accounts cannot outnumber the
 * document's tenants, and closing one to evict it drops the messages it still
 * holds without ever calling back, hanging a delivery on a slot it never
 * releases. An idle pool holds no sockets — nodemailer closes them on its own
 * idle timeout.
 */
type MailPool = {transporter: Transporter; slots: DeliverySlots};

declare global {
  var __mailPools: Map<string, MailPool> | undefined;
}

function getPools(): Map<string, MailPool> {
  if (!global.__mailPools) {
    global.__mailPools = new Map<string, MailPool>();
  }

  return global.__mailPools;
}

/**
 * The pool serving a tenant's mail account, built on first use.
 *
 * Not built at module load: construction is cheap and opens no socket, but the
 * account it describes is only known once a tenant's configuration has been
 * read.
 */
function getPool(mail: MailSettings): MailPool {
  const key = mailAccountKey(mail);
  const pools = getPools();

  const existing = pools.get(key);
  if (existing) return existing;

  const maxConnections = getMaxConnections(mail);

  const options = {
    pool: true,
    host: mail.host,
    port: mail.port,
    secure: Boolean(mail.secure),
    maxConnections,
    maxMessages: MAX_MESSAGES,
    maxRequeues: MAX_REQUEUES,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: GREETING_TIMEOUT_MS,
    auth: {
      user: mail.user,
      pass: mail.password,
    },
  } satisfies PoolOptions;

  const pool: MailPool = {
    transporter: nodemailer.createTransport(options),
    /* Sized to the pool. The pooled transport queues anything beyond
     * `maxConnections` itself, so a larger count would not send more — it would
     * only build more messages up front and hold them there. */
    slots: new DeliverySlots(maxConnections, queued =>
      describeMailBacklog(mail, queued),
    ),
  };

  pools.set(key, pool);

  return pool;
}

export class MailNotificationService implements NotificationService {
  private transporter: Transporter;
  private slots: DeliverySlots;
  private from?: string;

  private constructor(pool: MailPool, from?: string) {
    this.transporter = pool.transporter;
    this.slots = pool.slots;
    this.from = from;
  }

  /**
   * The service for one tenant's mail account, or null when that tenant declares
   * none.
   *
   * Reported per account rather than once for the deployment: a tenant with no
   * mail settings must not make a configured tenant look unconfigured, and the
   * pool it would have shared is not the same pool.
   */
  static create(
    tenantConfig?: TenantConfig | null,
  ): MailNotificationService | null {
    const mail = tenantConfig?.mail;

    if (!mail?.host || !mail?.port || !mail?.user || !mail?.password) {
      if (tenantConfig && !reportedUnconfigured.has(tenantConfig)) {
        reportedUnconfigured.add(tenantConfig);
        console.log(
          '[MAIL] Email not configured for this tenant — set mail.host, mail.port, mail.user and mail.password in its configuration to send mail',
        );
      }
      return null;
    }

    return new MailNotificationService(getPool(mail), mail.email || mail.user);
  }

  /* Opens its own connection and authenticates, then quits it, so it does not
   * consume one of the pool's. */
  async verify(): Promise<void> {
    await this.transporter.verify();
  }

  async notify(data: MailNotificationData): Promise<SMTPPool.SentMessageInfo> {
    if (!data.to) {
      throw new Error('Recipient is required');
    }

    return this.deliver(async () => data);
  }

  async notifyAll<T>(
    items: T[],
    toMessage: (item: T) => Promise<MailNotificationData>,
  ): Promise<Array<{item: T; error?: unknown}>> {
    const results = await Promise.all(
      items.map(async item => {
        try {
          await this.deliver(() => toMessage(item));
          return {item};
        } catch (error) {
          return {item, error};
        }
      }),
    );

    const failed = results.filter(result => 'error' in result).length;

    /* The per-message errors name each recipient; this is the only line that says
     * how much of one fan-out arrived. Silent when everything did. */
    if (failed > 0) {
      console.error(
        `[MAIL] fan-out: ${results.length - failed} of ${results.length} delivered, ${failed} failed`,
      );
    }

    return results;
  }

  private async deliver(
    buildMessage: () => Promise<MailNotificationData>,
  ): Promise<SMTPPool.SentMessageInfo> {
    /* Both come from this tenant's own account, so the sender and the Message-ID
     * domain name the tenant that is sending rather than whichever one happens to
     * be configured process-wide. */
    const from = this.from;
    const messageId = createMessageId(from);
    const slots = this.slots;

    let recipients = 'an unknown recipient';
    let subject = 'no subject';

    for (let attempt = 1; ; attempt++) {
      /* Only a failure out of `sendMail` is the mail server's, and only those
       * belong on this schedule. Building the message reads the database and the
       * translations, which raise `ETIMEDOUT` of their own — retrying that here
       * would re-run the render eight times against something already struggling,
       * and report it as a mail fault. */
      let sending = false;

      await slots.acquire();

      try {
        const data = await buildMessage();

        subject = forLog(data.subject);

        if (!data.to) {
          throw new Error('Recipient is required');
        }

        recipients = forLog(
          Array.isArray(data.to) ? data.to.join(', ') : data.to,
        );

        const mailOptions: Mail.Options = {
          to: data.to,
          subject: data.subject,
          text: data.text,
          html: data.html,
          from,
          attachments: data.attachments,
          icalEvent: data.icalEvent,
          messageId,
        };

        sending = true;

        const sent = await this.transporter.sendMail(mailOptions);
        slots.release();

        return sent;
      } catch (error) {
        // Released before waiting, so a backoff never occupies a slot.
        slots.release();

        if (!sending || attempt >= MAX_SEND_ATTEMPTS || !isTemporary(error)) {
          console.error(
            `[MAIL] could not send "${subject}" to ${recipients} after ` +
              `${attempt} ${attempt === 1 ? 'attempt' : 'attempts'}`,
            error,
          );
          throw error;
        }

        /* Announced once rather than per attempt, and without the recipient:
         * greylisting makes a first failure routine, so naming addresses here
         * would list every recipient of a fan-out that went on to deliver in
         * full. The give-up above names them, where it is the point. */
        if (attempt === 1) {
          console.warn(`[MAIL] delivery of "${subject}" failed, retrying`);
        }

        await sleep(getRetryDelay(attempt));
      }
    }
  }
}

export default MailNotificationService;
