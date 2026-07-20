import crypto from 'crypto';
import {NextResponse, after} from 'next/server';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {manager} from '@/tenant';
import type {Client} from '@/goovee/.generated/client';
import {SUBAPP_CODES} from '@/constants';
import {CONTEXT_STATUS} from '@/lib/core/payment/common/orm';
import {
  notifyPaymentUpdate,
  PAYMENT_UPDATE_STATUS,
} from '@/lib/core/payment/sse';
import NotificationManager, {NotificationType} from '@/notification';
import {getTranslation} from '@/locale/server';
import {findGooveeUserByEmail} from '@/orm/partner';
import {notifyUser} from '@/pwa/utils';
import {TenantIdSchema} from '@/utils/validators';

/**
 * Called by AOS after one of its payment-incident fix actions (events
 * "Create invoice", shop "Complete order") completed the failed work
 * in-process. The context row is goovee-owned, so AOS never writes it —
 * it reports the resolution here and goovee moves its own context out of
 * the failure queue. Same HMAC + timestamp contract as the notifications
 * webhook (signed with the shared portal.ws.secret).
 *
 * Idempotent: a context already out of the failure queues is acknowledged
 * with 200/ignored so an AOS redelivery never errors.
 */

function isValidSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function isValidTimestamp(timestamp: number) {
  const current = Date.now();
  const ts = Number(timestamp);
  return ts <= current && current - ts < FIVE_MINUTES_MS;
}

function response(data: any, status: number) {
  return NextResponse.json(data, {status});
}

/**
 * Payer notification for a resolution — same mail + push pair the
 * notifications webhook sends, but addressed to the payment's payer (frozen
 * on the context) instead of subscribers: the person who saw "our team will
 * review and finish the processing" is the one who must hear it is done.
 * Best-effort: the context is already resolved, a notification failure only
 * costs the courtesy message. No locale is stored on the context, so wording
 * falls back to the default locale.
 */
async function sendResolutionNotifications({
  client,
  tenantId,
  payer,
  source,
  entityId,
  workspaceURL,
  contextUserId,
  eventId,
  amount,
  currencyCode,
  paymentMode,
  providerTransactionRef,
}: {
  client: Client;
  tenantId: string;
  payer: string;
  source?: string;
  entityId?: string;
  /** From the context data — present for shop, absent for invoices/events. */
  workspaceURL?: string;
  /** Goovee user id from the context data when the source froze it (shop). */
  contextUserId?: string;
  /** Portal event id from the context data (events) — the deep link needs its slug. */
  eventId?: string;
  amount?: string | number;
  currencyCode?: string;
  paymentMode?: string;
  providerTransactionRef?: string;
}) {
  const t = (key: string, ...args: string[]) =>
    getTranslation({tenant: tenantId}, key, ...args);

  const subject = await t('Your payment has been processed');
  const detail =
    source === SUBAPP_CODES.shop
      ? await t('Your order has been completed.')
      : source === SUBAPP_CODES.events
        ? await t('Your event registration has been completed.')
        : source === SUBAPP_CODES.invoices
          ? await t('Your invoice payment has been processed.')
          : await t('Your payment has been processed.');

  // Deep link when the pieces are known (shop order / invoice / event page);
  // the payer can still act on the plain message without one. Events have no
  // registration detail page, so the link goes to the event itself (by slug,
  // like the payment redirect URLs).
  let url = workspaceURL;
  let cta = await t('Open Goovee');
  if (workspaceURL && entityId && source === SUBAPP_CODES.shop) {
    url = `${workspaceURL}/${SUBAPP_CODES.orders}/${entityId}`;
    cta = await t('View your order');
  } else if (workspaceURL && entityId && source === SUBAPP_CODES.invoices) {
    url = `${workspaceURL}/${SUBAPP_CODES.invoices}/${entityId}`;
    cta = await t('View your invoice');
  } else if (workspaceURL && eventId && source === SUBAPP_CODES.events) {
    try {
      const event = await client.aOSPortalEvent.findOne({
        where: {id: eventId},
        select: {slug: true},
      });
      if (event?.slug) {
        url = `${workspaceURL}/${SUBAPP_CODES.events}/${event.slug}`;
        cta = await t('View the event');
      }
    } catch (err) {
      console.error(
        '[PAYMENT-INCIDENT][WEBHOOK] Failed to resolve event slug for deep link',
        {eventId, error: err instanceof Error ? err.message : err},
      );
    }
  }

  try {
    const mailService = NotificationManager.getService(NotificationType.mail);
    if (mailService) {
      const detailRows: Array<[string, string]> = [];
      if (amount != null) {
        detailRows.push([
          await t('Amount'),
          `${amount}${currencyCode ? ` ${currencyCode}` : ''}`,
        ]);
      }
      if (paymentMode) {
        detailRows.push([await t('Payment method'), paymentMode]);
      }
      if (providerTransactionRef) {
        detailRows.push([await t('Reference'), providerTransactionRef]);
      }
      if (entityId && source === SUBAPP_CODES.shop) {
        detailRows.push([await t('Order'), `#${entityId}`]);
      }
      if (entityId && source === SUBAPP_CODES.invoices) {
        detailRows.push([await t('Invoice'), `#${entityId}`]);
      }

      const detailsHtml = detailRows.length
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate;overflow:hidden;">
            ${detailRows
              .map(
                ([label, value], i) => `
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6b7280;background:#f9fafb;border-top:${i === 0 ? 'none' : '1px solid #e5e7eb'};white-space:nowrap;">${label}</td>
                <td align="right" style="padding:12px 16px;font-size:13px;color:#111827;font-weight:600;background:#f9fafb;border-top:${i === 0 ? 'none' : '1px solid #e5e7eb'};">${value}</td>
              </tr>`,
              )
              .join('')}
          </table>`
        : '';

      const buttonHtml = url
        ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px;">
            <tr>
              <td style="border-radius:8px;background:#0e9f6e;">
                <a href="${url}" target="_blank"
                  style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${cta}</a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;word-break:break-all;">
            ${await t('Or copy this link into your browser:')}<br>
            <a href="${url}" target="_blank" style="color:#0e9f6e;text-decoration:underline;">${url}</a>
          </p>`
        : '';

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
  <!-- Preheader: shown next to the subject in inbox previews, invisible in the mail body. -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${detail}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:#0e9f6e;border-radius:12px 12px 0 0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" style="padding:40px 48px 36px;font-family:Arial,Helvetica,sans-serif;">
                    <!-- Success icon -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center" style="width:56px;height:56px;border-radius:50%;background:#def7ec;font-size:26px;line-height:56px;color:#0e9f6e;font-weight:700;">&#10003;</td>
                      </tr>
                    </table>
                    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;">${subject}</h1>
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">${detail}</p>
                    <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">${await t('No further action is required on your side.')}</p>
                    ${detailsHtml}
                    ${buttonHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const text = [subject, '', detail, url ?? ''].join('\n').trim();

      await mailService.notify({to: payer, subject, html, text});
      console.log('[PAYMENT-INCIDENT][WEBHOOK] Resolution mail sent', {payer});
    } else {
      console.log(
        '[PAYMENT-INCIDENT][WEBHOOK] Email not configured — skipping resolution mail',
      );
    }
  } catch (err) {
    console.error(
      '[PAYMENT-INCIDENT][WEBHOOK] Failed to send resolution mail',
      {
        payer,
        error: err instanceof Error ? err.message : err,
      },
    );
  }

  try {
    const userId =
      contextUserId ?? (await findGooveeUserByEmail(payer, client))?.id;

    if (!userId) {
      console.log(
        '[PAYMENT-INCIDENT][WEBHOOK] No goovee user for payer — skipping push',
        {payer},
      );
      return;
    }

    await notifyUser({
      userId: String(userId),
      tenantId,
      workspaceURL,
      client,
      payload: {title: `${subject} — ${detail}`, url},
    });
    console.log('[PAYMENT-INCIDENT][WEBHOOK] Resolution push sent', {
      payer,
      userId: String(userId),
    });
  } catch (err) {
    console.error(
      '[PAYMENT-INCIDENT][WEBHOOK] Failed to send resolution push',
      {
        payer,
        error: err instanceof Error ? err.message : err,
      },
    );
  }
}

const PaymentIncidentWebhookPayloadSchema = z.object({
  tenantId: TenantIdSchema,
  paymentContextId: z.union([z.string(), z.number()]),
  timestamp: z.number().int('Timestamp must be an integer'),
});

export async function POST(request: Request) {
  const body = await request.text();

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return response('Payload is required', 400);
  }

  const parsed = PaymentIncidentWebhookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return response(z.prettifyError(parsed.error), 400);
  }

  const {tenantId, paymentContextId, timestamp} = parsed.data;

  if (!isValidTimestamp(timestamp)) {
    return response('Invalid timestamp', 400);
  }

  const signature = request.headers.get('x-signature');

  if (!signature) {
    return response('Unauthorized', 401);
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return response('Unauthorized', 401);
  }
  const {client} = tenant;

  const secret = tenant.config.aos.webhookSecret;

  if (!secret || !isValidSignature(body, signature, secret)) {
    return response('Unauthorized', 401);
  }

  const context = await client.paymentContext.findOne({
    where: {id: String(paymentContextId)},
    select: {
      id: true,
      version: true,
      status: true,
      data: true,
      payer: true,
      mode: true,
    },
  });

  if (!context) {
    return response('Payment context not found', 404);
  }

  const data = ((await context.data) ?? {}) as any;

  if (
    context.status !== CONTEXT_STATUS.refund_required &&
    context.status !== CONTEXT_STATUS.reconcile_required
  ) {
    // Already caught up (redelivery) or never queued — nothing to move.
    console.log('[PAYMENT-INCIDENT][WEBHOOK] Context not in a failure queue', {
      contextId: context.id,
      status: context.status,
    });
    return response({ignored: true, status: context.status}, 200);
  }

  await client.paymentContext.update({
    data: {
      id: context.id,
      version: context.version,
      status: CONTEXT_STATUS.processed,
      // The incident keeps the failure history; a processed context must not
      // contradict itself.
      failureReason: null,
      updatedOn: new Date(),
    },
    select: {id: true},
  });

  console.log('[PAYMENT-INCIDENT][WEBHOOK] Context resolved by ERP action', {
    contextId: context.id,
    tenantId,
  });

  const source = data?.source;
  const entityId = data?.id;
  if (source && entityId) {
    // Harmless if nobody is subscribed — a user may be sitting on the page.
    notifyPaymentUpdate(
      source,
      entityId,
      context.id,
      PAYMENT_UPDATE_STATUS.SUCCESS,
    );
  }

  const payer = context.payer;
  if (payer) {
    after(() =>
      sendResolutionNotifications({
        client,
        tenantId,
        payer,
        source,
        entityId: entityId != null ? String(entityId) : undefined,
        workspaceURL: data?.workspaceURL,
        contextUserId:
          data?.user?.id != null ? String(data.user.id) : undefined,
        eventId: data?.eventId != null ? String(data.eventId) : undefined,
        amount: data?.amount,
        currencyCode: data?.currencyCode,
        paymentMode: context.mode ?? undefined,
        providerTransactionRef: data?.providerTransactionRef,
      }),
    );
  } else {
    console.log(
      '[PAYMENT-INCIDENT][WEBHOOK] No payer on context — skipping notifications',
      {contextId: context.id},
    );
  }

  return response({resolved: true}, 200);
}
