import {createHash} from 'node:crypto';
import https from 'node:https';
import {DeliverySlots} from '@/lib/core/concurrency/delivery-slots';
import webpush, {WebPushError} from 'web-push';
import type {Client} from '@/goovee/.generated/client';
import {getGlobalConfig, tenantConfigProvider} from '@/tenant/config-provider';
import type {TenantConfig} from '@/tenant';
import type {
  NotificationPayload,
  NotificationRecord,
  PushDeliveryReport,
} from './types';

/* RFC 8030 §7.2 guarantees only that a push service accepts 4096 bytes of
 * encrypted body — more is not obliged — and RFC 8291 §4 spends 103 of those on
 * the header, padding delimiter and authentication tag. A service that transcodes
 * the payload for a bridged device accepts only 2744, and its endpoints look no
 * different from any other, so this is the figure to hold to. */
const MAX_ENCRYPTED_BYTES = 2744;
const ENCRYPTION_OVERHEAD_BYTES = 103;
const MAX_PAYLOAD_BYTES = MAX_ENCRYPTED_BYTES - ENCRYPTION_OVERHEAD_BYTES;

/* Deliveries in flight at once, and sockets the shared agent may
 * hold open per push service. No push service documents a limit, so this exists
 * to keep a wide audience from encrypting and connecting for every device at
 * once rather than to satisfy anyone's cap. */
const DEFAULT_MAX_CONNECTIONS = 10;

/* Bounds inactivity, not the transfer. Absent, a service that accepts the
 * connection and then stops answering holds the send open indefinitely. */
const SEND_TIMEOUT_MS = 10_000;

/* web-push never retries; the policy is the caller's. Only worth spending
 * attempts on because the notification is already stored — a push that never
 * lands costs the toast, not the record, so this stays short. */
const RETRY_DELAYS_MS = [1_000, 5_000, 30_000];

/* RFC 8030 §5.4: at most 32 characters from the URL and filename-safe base64
 * alphabet. web-push rejects anything else outright. */
const MAX_TOPIC_LENGTH = 32;

/* Notifications stored at once while notifying an audience. Delivery is not
 * batched — only the queries are. */
const STORE_BATCH_SIZE = 10;

const RATE_LIMITED = 429;

/* Node's timer ceiling. A delay past it fires immediately instead of late. */
const MAX_DELAY_MS = 2 ** 31 - 1;

// A socket that failed or never opened — nothing reached the service.
const TEMPORARY_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
]);

// web-push destroys a timed-out request with this exact message and no code.
const SOCKET_TIMEOUT_MESSAGE = 'Socket timeout';

/* One agent and one set of slots serve the whole process, so the ceiling is the
 * deployment's and comes from "$global". A value it cannot use is refused when
 * the document is read, named there, rather than corrected silently here. */
export function getMaxConnections(): number {
  return getGlobalConfig().pushMaxConnections ?? DEFAULT_MAX_CONNECTIONS;
}

/* One agent and one set of slots for the process, so devices on the same push
 * service reuse a connection instead of handshaking per message, and an audience
 * costs the slot count rather than its own size. This module is evaluated once
 * per bundler layer, and again on every Turbopack recompile, so the globals are
 * what keep them shared. */
declare global {
  var __pushAgent: https.Agent | undefined;
  var __pushDeliverySlots: DeliverySlots | undefined;
}

function getAgent(): https.Agent {
  if (!global.__pushAgent) {
    global.__pushAgent = new https.Agent({
      keepAlive: true,
      /* Per origin. The slots are what bound the process, since an audience can
       * span several push services. */
      maxSockets: getMaxConnections(),
    });
  }

  return global.__pushAgent;
}

function describePushBacklog(queued: number): string {
  return `[PUSH] ${queued} notifications are waiting to send — the push service is not keeping up`;
}

function getDeliverySlots(): DeliverySlots {
  if (!global.__pushDeliverySlots) {
    global.__pushDeliverySlots = new DeliverySlots(
      getMaxConnections(),
      describePushBacklog,
    );
  }

  return global.__pushDeliverySlots;
}

export type VapidDetails = {
  subject: string;
  publicKey: string;
  privateKey: string;
};

/* Reported per tenant: one tenant's missing keys must not silence the report for
 * the others, which is what a single flag would do — the tenant that happens to
 * send first would be the only one ever named. */
const reportedBadVapidConfig = new Set<string>();

function reportBadVapidConfig(tenantId: string, reason: string): null {
  if (!reportedBadVapidConfig.has(tenantId)) {
    reportedBadVapidConfig.add(tenantId);
    console.error(
      `[PUSH] tenant "${tenantId}": ${reason} — no notification will reach its devices`,
    );
  }

  return null;
}

/**
 * The signing identity for a tenant's push messages.
 *
 * A browser subscribes against the public key its own tenant published, and a
 * push service refuses a message signed by any other key pair — so this must come
 * from the acting tenant's configuration, never from a process-wide value. A
 * deployment-wide key would leave every subscription refused rather than merely
 * unsigned.
 *
 * Exported so startup can report a bad configuration once per tenant instead of
 * leaving every send to discover it.
 */
export function getVapidDetails(
  tenantId: string,
  config: TenantConfig | null,
): VapidDetails | null {
  const publicKey = config?.publicEnv?.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = config?.webPush?.privateKey;
  const subject = config?.webPush?.subject;

  if (!publicKey || !privateKey || !subject) {
    return reportBadVapidConfig(
      tenantId,
      'publicEnv.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY, webPush.privateKey and webPush.subject must all be set',
    );
  }

  if (!subject.startsWith('mailto:') && !subject.startsWith('https://')) {
    return reportBadVapidConfig(
      tenantId,
      'webPush.subject must start with mailto: or https:',
    );
  }

  return {subject, publicKey, privateKey};
}

/* The tag already names what the notification is about, which is what Topic
 * coalesces on, but the portal's tags carry ':' and are not bounded — so send a
 * digest of it rather than the tag itself. */
function toTopic(tag: string): string {
  return createHash('sha256')
    .update(tag)
    .digest('base64url')
    .slice(0, MAX_TOPIC_LENGTH);
}

/* Only a rate limit or a server error clears on its own. Everything else the
 * service has settled: 400/401/403 are the request's fault, 413 will not shrink
 * on a retry, and 404/410 mean the subscription is gone. */
function isTemporary(error: unknown): boolean {
  if (error instanceof WebPushError) {
    return error.statusCode === RATE_LIMITED || error.statusCode >= 500;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  if (error.message === SOCKET_TIMEOUT_MESSAGE) {
    return true;
  }

  const {code} = error as {code?: unknown};

  return typeof code === 'string' && TEMPORARY_ERROR_CODES.has(code);
}

function isExpired(error: unknown): boolean {
  return (
    error instanceof WebPushError &&
    (error.statusCode === 404 || error.statusCode === 410)
  );
}

/* Honours what the service asks for in `Retry-After` — a count of seconds or an
 * HTTP date (RFC 9110 §10.2.3) — since a request to be left alone for an hour is
 * meant, and a sleeping attempt holds nothing. Never waits less than the backoff
 * it would have used anyway: a header that parses to no delay at all, from a date
 * already past or a clock a few seconds out, must not turn "back off" into an
 * immediate retry. */
function getRetryDelayMs(error: unknown, fallback: number): number {
  if (!(error instanceof WebPushError)) {
    return fallback;
  }

  const header: string | undefined = error.headers?.['retry-after'];

  if (!header) {
    return fallback;
  }

  const seconds = Number(header);
  const asked = Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(header) - Date.now();

  if (Number.isNaN(asked)) {
    return fallback;
  }

  /* Past MAX_DELAY_MS a timer fires immediately, which would invert the longest
   * backoff into none at all. */
  return Math.min(Math.max(asked, fallback), MAX_DELAY_MS);
}

/* The payload travels as UTF-8, so accented text costs more than its length
 * suggests and the budget has to be counted in bytes. */
function byteLength(value: string): number {
  return Buffer.byteLength(value, 'utf8');
}

function shorten(text: string, characters: number): string {
  if (characters <= 0) {
    return '…';
  }

  const cut = text.slice(0, characters);
  const last = cut.charCodeAt(cut.length - 1);

  /* `slice` counts UTF-16 units, so a cut can land between the halves of a
   * surrogate pair and keep only the first — which reaches the device as a
   * replacement character. */
  const whole = last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;

  return `${whole.trimEnd()}…`;
}

/* Shortens the body until the whole payload fits, rather than letting the
 * service refuse a message it cannot carry. The envelope around the body is
 * fixed, so a binary search over the body settles in a few passes. */
function serializeWithinLimit(payload: NotificationPayload): string {
  const serialized = JSON.stringify(payload);

  if (byteLength(serialized) <= MAX_PAYLOAD_BYTES) {
    return serialized;
  }

  const body = payload.body;

  if (!body) {
    console.warn(
      `[PUSH] a notification exceeds ${MAX_PAYLOAD_BYTES} bytes with no body to shorten and will be refused`,
    );

    return serialized;
  }

  let fits = 0;
  let tooLong = body.length;

  while (fits < tooLong) {
    const candidate = Math.ceil((fits + tooLong) / 2);
    const attempt = JSON.stringify({
      ...payload,
      body: shorten(body, candidate),
    });

    if (byteLength(attempt) <= MAX_PAYLOAD_BYTES) {
      fits = candidate;
    } else {
      tooLong = candidate - 1;
    }
  }

  const shortened = JSON.stringify({...payload, body: shorten(body, fits)});

  /* Reachable when the title and the rest of the envelope alone exceed the
   * limit, which shortening the body cannot fix. */
  if (byteLength(shortened) > MAX_PAYLOAD_BYTES) {
    console.warn(
      `[PUSH] a notification exceeds ${MAX_PAYLOAD_BYTES} bytes with its body removed and will be refused`,
    );
  }

  return shortened;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type DeliveryOutcome = 'sent' | 'expired' | 'failed';

/* Retries only what a later attempt can clear, and waits as long as the service
 * asks. A slot is held across the send but released before any wait, so a
 * retrying device occupies nothing while it sleeps. */
async function deliver({
  subscriptionId,
  endpoint,
  keys,
  payloadJson,
  vapidDetails,
  topic,
}: {
  subscriptionId: string;
  endpoint: string;
  keys: {p256dh: string; auth: string};
  payloadJson: string;
  vapidDetails: VapidDetails;
  topic?: string;
}): Promise<DeliveryOutcome> {
  const slots = getDeliverySlots();

  for (let attempt = 0; ; attempt++) {
    let failure: unknown;

    /* Taken before the send rather than around the socket: encrypting the
     * payload and signing the request happen synchronously inside
     * `sendNotification`, before a connection is asked for, so the agent's own
     * limit does not bound them. */
    await slots.acquire();

    try {
      await webpush.sendNotification({endpoint, keys}, payloadJson, {
        vapidDetails,
        agent: getAgent(),
        timeout: SEND_TIMEOUT_MS,
        ...(topic ? {topic} : {}),
      });

      return 'sent';
    } catch (error) {
      failure = error;
    } finally {
      slots.release();
    }

    if (isExpired(failure)) {
      return 'expired';
    }

    const nextDelay = RETRY_DELAYS_MS[attempt];

    if (nextDelay === undefined || !isTemporary(failure)) {
      const status =
        failure instanceof WebPushError ? failure.statusCode : 'no response';

      console.error(
        `[PUSH] giving up on device ${subscriptionId} after ${attempt + 1} attempt(s) — ${new URL(endpoint).host} answered ${status}`,
        failure,
      );

      return 'failed';
    }

    await delay(getRetryDelayMs(failure, nextDelay));
  }
}

export type NotifyUserArgs = {
  userId: string;
  tenantId: string;
  workspaceURL?: string;
  client: Client;
  payload: Omit<
    NotificationPayload,
    'tenantId' | 'workspaceURL' | 'notification'
  >;
  /**
   * When provided, called with the total unread count for this tag (including
   * the notification being created). Use this to produce grouped titles like
   * "You have 3 new comments on X" that replace previous push notifications
   * in the OS tray via the tag mechanism.
   */
  getReplacementTitle?: (count: number) => string | Promise<string>;
};

/* Everything a delivery needs once the database work is behind it. Separating
 * the two is what lets a whole audience be stored before any device is waited
 * on. */
type PreparedDelivery = {
  client: Client;
  userId: string;
  notificationId?: string;
  payloadJson: string;
  topic?: string;
  vapidDetails: VapidDetails;
  subscriptions: Array<{
    id: string;
    version: number;
    endpoint: string | null;
    p256dh: string | null;
    auth: string | null;
    expiresAt: Date | null;
  }>;
};

function emptyReport(): PushDeliveryReport {
  return {sent: 0, expired: 0, failed: 0};
}

/* Stores the notification and gathers the devices to send it to. Returns null
 * when there is nothing to deliver — the record is still stored. */
async function prepare({
  userId,
  tenantId,
  workspaceURL,
  client,
  payload,
  getReplacementTitle,
}: NotifyUserArgs): Promise<PreparedDelivery | null> {
  if (!client) return null;

  let unreadCount = 1; // +1 for the notification we are about to create
  if (getReplacementTitle && payload.tag) {
    try {
      unreadCount += Number(
        await client.pushNotification.count({
          where: {partner: {id: userId}, tag: payload.tag, isRead: false},
        }),
      );
    } catch {
      // non-fatal — fall back to singular title
    }
  }

  const pushTitle: string =
    getReplacementTitle && unreadCount > 1
      ? await getReplacementTitle(unreadCount)
      : payload.title;

  // Stored whether or not any device can be reached.
  let dbNotification: NotificationRecord | undefined;
  try {
    dbNotification = await client.pushNotification.create({
      data: {
        partner: {select: {id: userId}},
        workspace: workspaceURL ? {select: {url: workspaceURL}} : undefined,
        title: payload.title,
        body: payload.body,
        url: payload.url,
        isRead: false,
        tag: payload.tag,
      },
      select: {
        id: true,
        title: true,
        createdOn: true,
      },
    });
  } catch (error) {
    console.error('Failed to store notification record:', error);
  }

  /* Signed with the acting tenant's own key pair. Captured here and carried on
   * the prepared delivery, so a retry and a shortened resend both sign with the
   * same tenant's keys as the first attempt. */
  const vapidDetails = getVapidDetails(
    tenantId,
    tenantConfigProvider.get(tenantId),
  );

  if (!vapidDetails) return null;

  const subscriptions = await client.pushSubscription.find({
    where: {partner: {id: userId}},
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
      version: true,
      expiresAt: true,
    },
  });

  if (!subscriptions?.length) return null;

  /* `body`, `url` and `tag` are carried at the top level only — the service
   * worker merges them back into the record it hands open tabs. `title` appears
   * in both because they differ: the top-level one may be a grouped title
   * standing in for several notifications. */
  const payloadJson = serializeWithinLimit({
    ...payload,
    title: pushTitle,
    tenantId,
    workspaceURL,
    notification: dbNotification,
  });

  return {
    client,
    userId,
    notificationId: dbNotification?.id,
    payloadJson,
    topic: payload.tag ? toTopic(payload.tag) : undefined,
    vapidDetails,
    subscriptions,
  };
}

async function dispatch({
  client,
  payloadJson,
  topic,
  vapidDetails,
  subscriptions,
}: PreparedDelivery): Promise<PushDeliveryReport> {
  const report = emptyReport();

  /* Each device is settled on its own: one that throws where nothing else does
   * — a subscription deleted underneath us, say — must not discard what the
   * others already reported. Every path counts the device exactly once, and
   * counts it last, so a failed cleanup cannot count it twice. */
  await Promise.all(
    subscriptions.map(async sub => {
      try {
        /* A subscription missing its keys or past its expiry is dropped like one
         * the push service has forgotten — otherwise it is reported on every
         * notification from here on. */
        if (
          !sub.endpoint ||
          !sub.p256dh ||
          !sub.auth ||
          (sub.expiresAt && sub.expiresAt < new Date())
        ) {
          await client.pushSubscription.delete({
            id: sub.id,
            version: sub.version,
          });
          report.expired++;
          return;
        }

        const outcome = await deliver({
          subscriptionId: sub.id,
          endpoint: sub.endpoint,
          keys: {p256dh: sub.p256dh, auth: sub.auth},
          payloadJson,
          vapidDetails,
          topic,
        });

        if (outcome === 'expired') {
          await client.pushSubscription.delete({
            id: sub.id,
            version: sub.version,
          });
        }

        report[outcome]++;
      } catch (error) {
        report.failed++;
        console.error(`[PUSH] device ${sub.id} could not be settled`, error);
      }
    }),
  );

  return report;
}

export async function notifyUser(
  args: NotifyUserArgs,
): Promise<PushDeliveryReport> {
  try {
    const prepared = await prepare(args);

    if (!prepared) return emptyReport();

    const report = await dispatch(prepared);

    /* Only for a single recipient: an audience reports once, in notifyAll. */
    if (report.failed) {
      console.error(
        `[PUSH] notification ${prepared.notificationId ?? '(unstored)'} reached ${report.sent} of ${report.sent + report.failed} devices for partner ${prepared.userId}`,
      );
    }

    return report;
  } catch (error) {
    console.error('Failed to send push notification:', {
      userId: args.userId,
      error,
    });

    return emptyReport();
  }
}

/**
 * Notifies an audience. Every recipient's notification is stored before any
 * device is waited on, so a device that retries for minutes cannot delay
 * someone else's notification from appearing in the portal.
 */
export async function notifyAll<T>(
  recipients: T[],
  build: (recipient: T) => NotifyUserArgs | Promise<NotifyUserArgs>,
): Promise<PushDeliveryReport> {
  const prepared: PreparedDelivery[] = [];

  /* Stored in batches: this is database work, and a wide audience should not
   * open a query per recipient at once. */
  for (let from = 0; from < recipients.length; from += STORE_BATCH_SIZE) {
    const batch = recipients.slice(from, from + STORE_BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async recipient => {
        let args: NotifyUserArgs;

        try {
          args = await build(recipient);
        } catch (error) {
          console.error(
            '[PUSH] a recipient was skipped — its notification could not be built',
            error,
          );

          return null;
        }

        try {
          return await prepare(args);
        } catch (error) {
          console.error(
            `[PUSH] partner ${args.userId} was skipped — its notification could not be prepared`,
            error,
          );

          return null;
        }
      }),
    );

    for (const result of results) {
      if (result) prepared.push(result);
    }
  }

  /* Every recipient at once from here; the delivery slots decide how many are
   * encrypted and in flight, and a waiting retry holds none. */
  const reports = await Promise.all(
    prepared.map(async delivery => {
      try {
        return await dispatch(delivery);
      } catch (error) {
        console.error('[PUSH] failed to notify a recipient', {
          userId: delivery.userId,
          error,
        });

        return emptyReport();
      }
    }),
  );

  const total = reports.reduce(
    (sum, report) => ({
      sent: sum.sent + report.sent,
      expired: sum.expired + report.expired,
      failed: sum.failed + report.failed,
    }),
    emptyReport(),
  );

  /* One line for the audience rather than one per recipient: a push service
   * having a bad day should not write a line per member of a large group. */
  if (total.failed) {
    const skipped = recipients.length - prepared.length;

    console.error(
      `[PUSH] notified ${total.sent} of ${total.sent + total.failed} devices across ${prepared.length} of ${recipients.length} recipient(s)` +
        (skipped
          ? `; ${skipped} had no device to notify or could not be prepared`
          : ''),
    );
  }

  return total;
}
