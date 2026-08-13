import {randomUUID} from 'node:crypto';
import {experimental_taintUniqueValue} from 'react';
import nodemailer, {type Transporter} from 'nodemailer';
import type SMTPPool from 'nodemailer/lib/smtp-pool';
import type Mail from 'nodemailer/lib/mailer';

import {NotificationService, type MailNotificationData} from '.';

/* `experimental_taintUniqueValue` ships only in the React runtime Next.js loads for
 * Server Components — not the route-handler layer, not the plain `react` a CLI
 * script resolves — and those are the layers with no Client Component to leak into.
 * The whole mechanism rests on `experimental.taint` in `next.config.mjs`: clearing
 * that flag makes this a silent no-op everywhere. */
function taint(message: string, value: string) {
  if (typeof experimental_taintUniqueValue === 'function') {
    experimental_taintUniqueValue(message, process, value);
  }
}

/* `maxRequeues` is a real pooled-transport option that is missing from
 * `@types/nodemailer`. Required rather than optional, so it cannot be dropped. */
type PoolOptions = SMTPPool.Options & {maxRequeues: number};

/* Servers differ by an order of magnitude — a Microsoft 365 mailbox allows three
 * and refuses the rest with `432 4.3.2 Concurrent connections limit exceeded`. */
const DEFAULT_MAX_CONNECTIONS = 10;

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

/* A backlog is normal and drains on its own, so this is not a limit — it is the
 * point at which one is worth saying out loud. Nothing else observes the queue, and
 * a mail server that cannot keep up shows up as memory rather than as an error. */
const BACKLOG_WARNING_THRESHOLD = 1_000;

// Stands in for a waiter already handed its slot; never called.
const NOOP = () => {};

/* Bounds how many messages are built and in flight at once, so memory follows the
 * slot count rather than the recipient count. Sized to the pool — more only queues
 * inside nodemailer. */
class DeliverySlots {
  private available: number;
  private waiting: Array<() => void> = [];
  /* A fan-out parks one waiter per recipient, so this queue is as long as the
   * recipient list — an index keeps release O(1) at that length. */
  private next = 0;
  private reportedBacklog = false;

  constructor(limit: number) {
    this.available = limit;
  }

  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }

    const queued = this.waiting.length - this.next + 1;

    if (!this.reportedBacklog && queued >= BACKLOG_WARNING_THRESHOLD) {
      this.reportedBacklog = true;
      console.warn(
        `[MAIL] ${queued} messages are waiting to send — the mail server is not keeping up`,
      );
    }

    await new Promise<void>(resolve => this.waiting.push(resolve));
  }

  /* Hands the slot to the next waiter rather than returning it, so a queued
   * message cannot be passed over. */
  release(): void {
    if (this.next < this.waiting.length) {
      const waiter = this.waiting[this.next];
      this.waiting[this.next] = NOOP;
      this.next++;

      if (this.next === this.waiting.length) {
        this.waiting = [];
        this.next = 0;
        this.reportedBacklog = false;
      }

      waiter();
      return;
    }

    this.available++;
  }
}

/* React registers a finalization cell per taint call, keyed on `process`, which is
 * never collected — so taint the password once per module instance, no more. Each
 * bundler layer has its own React, and so its own registry. */
let passwordTainted = false;

let reportedBadConnectionSetting = false;

/* Reports a value it cannot use, once. Falling back silently is how a deployment
 * ends up believing it set three and running at ten. */
export function getMaxConnections(): number {
  const setting = process.env.MAIL_MAX_CONNECTIONS;

  if (!setting) {
    return DEFAULT_MAX_CONNECTIONS;
  }

  const configured = Number(setting);

  if (!Number.isInteger(configured) || configured < 1) {
    if (!reportedBadConnectionSetting) {
      reportedBadConnectionSetting = true;
      console.warn(
        `[MAIL] MAIL_MAX_CONNECTIONS is "${setting}", which is not a whole number of connections — using ${DEFAULT_MAX_CONNECTIONS}`,
      );
    }

    return DEFAULT_MAX_CONNECTIONS;
  }

  return configured;
}

function getDeliverySlots(): DeliverySlots {
  if (!global.__mailDeliverySlots) {
    global.__mailDeliverySlots = new DeliverySlots(getMaxConnections());
  }

  return global.__mailDeliverySlots;
}

/* One pool for the process, and one set of slots sized to it. An orphaned pooled
 * transport leaks — its open sockets keep it reachable — and this module is
 * evaluated once per bundler layer, plus again on every Turbopack recompile, so
 * the global is what keeps them sharing.
 *
 *   undefined — not decided yet
 *   null      — mail is not configured
 *   transport — mail is configured */
declare global {
  var __mailTransporter: Transporter | null | undefined;
  var __mailDeliverySlots: DeliverySlots | undefined;
}

function createTransporter(): Transporter | null {
  if (
    !process.env.MAIL_HOST ||
    !process.env.MAIL_PORT ||
    !process.env.MAIL_USER ||
    !process.env.MAIL_PASSWORD
  ) {
    console.log(
      '[MAIL] Email not configured — set MAIL_HOST, MAIL_PORT, MAIL_USER and MAIL_PASSWORD to send mail',
    );
    return null;
  }

  const options = {
    pool: true,
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === 'true',
    maxConnections: getMaxConnections(),
    maxMessages: MAX_MESSAGES,
    maxRequeues: MAX_REQUEUES,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: GREETING_TIMEOUT_MS,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  } satisfies PoolOptions;

  return nodemailer.createTransport(options);
}

/**
 * The process-wide mail transport, built on first use.
 *
 * Not built at module load: `next build` evaluates server modules, and a
 * container sets the mail variables for the running server and not for the build,
 * so deciding then would leave mail permanently unconfigured. Construction opens
 * no socket.
 */
export function getTransporter(): Transporter | null {
  if (global.__mailTransporter === undefined) {
    global.__mailTransporter = createTransporter();
  }

  const mailPassword = process.env.MAIL_PASSWORD;

  if (global.__mailTransporter && mailPassword && !passwordTainted) {
    passwordTainted = true;

    taint(
      'Mail password is a server secret. Do not pass to Client Components.',
      mailPassword,
    );
  }

  return global.__mailTransporter;
}

export class MailNotificationService implements NotificationService {
  private transporter: Transporter;

  private constructor(transporter: Transporter) {
    this.transporter = transporter;
  }

  static create(): MailNotificationService | null {
    const transporter = getTransporter();

    if (!transporter) {
      return null;
    }

    return new MailNotificationService(transporter);
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
    const from = process.env.MAIL_EMAIL || process.env.MAIL_USER;
    const messageId = createMessageId(from);
    const slots = getDeliverySlots();

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
