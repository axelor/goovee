import {experimental_taintUniqueValue} from 'react';
import nodemailer, {type Transporter} from 'nodemailer';
import type SMTPPool from 'nodemailer/lib/smtp-pool';
import type Mail from 'nodemailer/lib/mailer';

import {NotificationService, type MailNotificationData} from '.';

/* `experimental_taintUniqueValue` only exists in the `react-server` build that
 * Next.js loads for Server Components and Route Handlers. CLI scripts resolve
 * the plain `react` build, where it is undefined — and have no Client Components
 * to leak into. */
function taint(message: string, value: string) {
  if (typeof experimental_taintUniqueValue === 'function') {
    experimental_taintUniqueValue(message, process, value);
  }
}

/* `maxRequeues` is a real pooled-transport option that is missing from
 * `@types/nodemailer`. Required rather than optional, because nodemailer reads
 * an absent value as unlimited — the thing MAX_REQUEUES exists to prevent. */
type PoolOptions = SMTPPool.Options & {maxRequeues: number};

/* Connections the pool may hold open at once. Configurable because servers
 * differ by an order of magnitude: a Microsoft 365 mailbox allows three and
 * refuses the rest with `432 4.3.2 Concurrent connections limit exceeded`, while
 * Postfix allows fifty by default. The default matches BATCH_SIZE in
 * `app/api/webhooks/notifications/route.ts` so a batch does not queue behind
 * itself; a lower value only makes it queue. */
const DEFAULT_MAX_CONNECTIONS = 10;

/* Nodemailer's own default, stated because a shared pool actually reaches it. */
const MAX_MESSAGES = 100;

/* Caps nodemailer's requeue loop. When a connection dies with a message in
 * flight, the message goes back to the front of the queue and a new connection
 * opens; with no cap that repeats forever and its `sendMail` never settles,
 * neither delivering nor failing. One attempt covers the case the loop exists
 * for — a message assigned to a connection the server was already closing. It
 * cannot serve as an outage policy, because the loop has no backoff: a higher
 * count only multiplies connection attempts at a server already failing. */
const MAX_REQUEUES = 1;

/* Tainted from the send path rather than from where the pool is built, since the
 * pool is built once and possibly in a bundler layer whose React has no taint
 * API. Once per module instance is enough — each layer has its own React and so
 * its own registry — and no more, because React registers a finalization cell on
 * every call, keyed on `process`, which is never collected. */
let passwordTainted = false;

function getMaxConnections(): number {
  const configured = Number(process.env.MAIL_MAX_CONNECTIONS);

  if (!Number.isInteger(configured) || configured < 1) {
    return DEFAULT_MAX_CONNECTIONS;
  }

  return configured;
}

/* One pool for the process, on the global rather than in module scope. A pooled
 * transport holds its sockets open between sends, and nothing collects an
 * unreferenced one — its live sockets keep it reachable from the event loop — so
 * a second pool leaks. This module is instantiated once per bundler layer, and
 * Turbopack re-evaluates it while mail code is edited; the global is what makes
 * every instance share one pool.
 *
 *   undefined — not decided yet
 *   null      — mail is not configured
 *   transport — mail is configured */
declare global {
  var __mailTransporter: Transporter | null | undefined;
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
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  } satisfies PoolOptions;

  return nodemailer.createTransport(options);
}

/**
 * The process-wide mail transport, built on first use. `null` when mail is not
 * configured.
 *
 * Not built at module load: `next build` evaluates server modules, and a
 * container sets the mail variables for the running server and not for the
 * build, so deciding then would leave mail permanently unconfigured.
 * Construction opens no socket — the pool connects on its first send.
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

    const {to, subject, text, html, attachments, icalEvent} = data;
    const from = process.env.MAIL_EMAIL || process.env.MAIL_USER;

    const mailOptions: Mail.Options = {
      to,
      subject,
      text,
      html,
      from,
      attachments,
      icalEvent,
    };

    return this.transporter.sendMail(mailOptions);
  }
}

export default MailNotificationService;
