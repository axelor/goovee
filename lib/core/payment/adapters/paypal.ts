import 'server-only';

import {
  ApiError,
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrdersController,
  type Order,
  type OrdersCapture,
} from '@paypal/paypal-server-sdk';

import type {TenantConfig} from '@/tenant';
import {fromMinorUnits, scaleOfCurrency, toMinorUnits} from '../domain/money';
import {parseReference} from '../domain/reference';
import {
  GATEWAY,
  EVENT_TYPE,
  RECEIVED_VIA,
  type EventType,
  type ReceivedVia,
} from '../domain/types';
import {
  pendingSignal,
  type GatewaySignal,
  type SignalResolution,
} from '../domain/signal';
import {
  SessionNotFoundError,
  type CreatedSession,
  type GatewayAdapter,
  type GatewayContext,
  type SessionInput,
} from './types';

type PaypalConfig = NonNullable<
  NonNullable<TenantConfig['payments']>['paypal']
>;

function paypalConfig(config: TenantConfig): PaypalConfig {
  const paypal = config.payments?.paypal;
  if (!paypal) {
    throw new Error('PayPal is not configured');
  }
  return paypal;
}

function apiBase(paypal: PaypalConfig): string {
  return paypal.live === true
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

/** PayPal's guidance: "a minimum timeout setting of 30 seconds" on its API calls. */
const PAYPAL_TIMEOUT_MS = 30_000;

/* Clients are cached per credentials so tenants sharing an account share a
 * client and its OAuth token; the SDK renews the token itself. */
const clients = new Map<string, Client>();

function paypalClient(paypal: PaypalConfig): Client {
  const key = `${paypal.live === true ? 'live' : 'sandbox'}:${paypal.clientId}:${paypal.clientSecret}`;
  let client = clients.get(key);
  if (!client) {
    client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: paypal.clientId,
        oAuthClientSecret: paypal.clientSecret,
      },
      environment:
        paypal.live === true ? Environment.Production : Environment.Sandbox,
      timeout: PAYPAL_TIMEOUT_MS,
    });
    clients.set(key, client);
  }
  return client;
}

function ordersController(paypal: PaypalConfig): OrdersController {
  return new OrdersController(paypalClient(paypal));
}

/* The webhook verification call is not in the SDK, so its token is fetched by
 * hand and kept until shortly before it expires. */
const tokens = new Map<string, {value: string; expiresAt: number}>();

async function accessToken(paypal: PaypalConfig): Promise<string> {
  const key = `${apiBase(paypal)}:${paypal.clientId}`;
  const cached = tokens.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const response = await fetch(`${apiBase(paypal)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${paypal.clientId}:${paypal.clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(PAYPAL_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`PayPal token request failed: ${response.status}`);
  }
  const {access_token: value, expires_in: expiresIn} =
    (await response.json()) as {access_token: string; expires_in: number};
  tokens.set(key, {value, expiresAt: Date.now() + (expiresIn - 60) * 1000});
  return value;
}

/** A buyer may approve an order for three hours; the reconciler asks about it after that. */
const APPROVAL_WINDOW_MS = 3 * 60 * 60 * 1000;

/** The webhook events the adapter turns into signals. Others are acknowledged and ignored. */
const HANDLED_EVENTS = new Set([
  'CHECKOUT.ORDER.APPROVED',
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
]);

type WebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: Record<string, unknown>;
};

type PaypalMoney = {currency_code?: string; value?: string};

/** Minor units of a PayPal decimal, or null when the amount cannot be read; settle records the event either way. */
function minor(
  value: string | undefined,
  currency: string | undefined,
): number | null {
  if (!value || !currency) return null;
  try {
    return toMinorUnits(value, scaleOfCurrency(currency));
  } catch {
    return null;
  }
}

function issueOf(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const result = error.result as {details?: {issue?: string}[]} | undefined;
  return result?.details?.[0]?.issue ?? null;
}

function captureOf(order: Order): OrdersCapture | null {
  return order.purchaseUnits?.[0]?.payments?.captures?.[0] ?? null;
}

/** Our reference on an order, or null when the order is not one of this tenant's. */
function ourReference(order: Order, tenantId: string): string | null {
  const raw =
    order.purchaseUnits?.[0]?.customId ?? captureOf(order)?.customId ?? null;
  const parsed = parseReference(raw);
  return parsed && parsed.tenantId === tenantId ? parsed.reference : null;
}

function base(
  type: EventType | 'pending',
  resolution: SignalResolution,
  receivedVia: ReceivedVia,
  payload: unknown,
): Omit<
  GatewaySignal,
  | 'eventId'
  | 'amount'
  | 'currencyCode'
  | 'providerRef'
  | 'sessionRef'
  | 'reason'
> {
  return {
    gateway: GATEWAY.paypal,
    resolution,
    type,
    receivedVia,
    receivedOn: new Date(),
    payload,
  };
}

/** The signal for one of our orders as the Orders API returns it, whichever leg asked. */
function signalForOrder(
  order: Order,
  reference: string,
  receivedVia: ReceivedVia,
  payload: unknown,
  declinedIssue: string | null,
): GatewaySignal {
  if (!order.id) {
    throw new Error('PayPal order carries no id');
  }
  const resolution = {by: 'reference', reference} as const;
  const capture = captureOf(order);
  const captureAmount = minor(
    capture?.amount?.value,
    capture?.amount?.currencyCode,
  );
  const captureCurrency = capture?.amount?.currencyCode?.toUpperCase() ?? null;

  if (
    order.status === 'COMPLETED' &&
    capture?.id &&
    capture.status === 'COMPLETED'
  ) {
    return {
      ...base(EVENT_TYPE.captured, resolution, receivedVia, payload),
      eventId: capture.id,
      amount: captureAmount,
      currencyCode: captureCurrency,
      providerRef: capture.id,
      sessionRef: order.id,
      reason: null,
    };
  }

  /* A declined capture, whether the API refused the call or the read-back
   * order carries a declined capture. Keyed on the capture where PayPal made
   * one, so the DENIED webhook names the same refusal. */
  if (declinedIssue || capture?.status === 'DECLINED') {
    return {
      ...base(EVENT_TYPE.refused, resolution, receivedVia, payload),
      eventId: capture?.id ?? `${order.id}:${declinedIssue ?? 'DECLINED'}`,
      amount: captureAmount,
      currencyCode: captureCurrency,
      providerRef: capture?.id ?? null,
      sessionRef: order.id,
      reason: declinedIssue ?? 'DECLINED',
    };
  }

  if (order.status === 'VOIDED') {
    return {
      ...base(EVENT_TYPE.expired, resolution, receivedVia, payload),
      eventId: order.id,
      amount: null,
      currencyCode: null,
      providerRef: null,
      sessionRef: order.id,
      reason: null,
    };
  }

  return pendingSignal({
    gateway: GATEWAY.paypal,
    resolution,
    sessionRef: order.id,
    receivedVia,
    payload,
  });
}

function cancelledSignal(
  orderId: string,
  reference: string,
  payload: unknown,
): GatewaySignal {
  return {
    ...base(
      EVENT_TYPE.cancelled,
      {by: 'reference', reference},
      RECEIVED_VIA.return,
      payload,
    ),
    eventId: orderId,
    amount: null,
    currencyCode: null,
    providerRef: null,
    sessionRef: orderId,
    reason: null,
  };
}

/*
 * Captures an approved order. Capturing is what turns the buyer's approval
 * into money, so it is the mutating call this adapter makes; an order captured
 * already, by the webhook or an earlier return, is read back instead, and the
 * same capture id keys both observations. Never called before the order has
 * been read and found to be one of ours.
 */
async function captureOrRead(
  controller: OrdersController,
  orderId: string,
): Promise<{order: Order; declinedIssue: string | null}> {
  try {
    const response = await controller.captureOrder({
      id: orderId,
      paypalRequestId: `capture:${orderId}`,
      prefer: 'return=representation',
    });
    return {order: response.result, declinedIssue: null};
  } catch (error) {
    const issue = issueOf(error);
    if (issue === 'ORDER_ALREADY_CAPTURED' || issue === 'ORDER_NOT_APPROVED') {
      const response = await controller.getOrder({id: orderId});
      return {order: response.result, declinedIssue: null};
    }
    if (
      issue === 'INSTRUMENT_DECLINED' ||
      issue === 'PAYER_CANNOT_PAY' ||
      issue === 'TRANSACTION_REFUSED'
    ) {
      const response = await controller.getOrder({id: orderId});
      return {order: response.result, declinedIssue: issue};
    }
    throw error;
  }
}

/**
 * Reads an order, checks it is one of this tenant's, and completes it: an
 * approved order is captured, anything else is reported as it stands.
 */
async function settleOrder(
  controller: OrdersController,
  orderId: string,
  tenantId: string,
  receivedVia: ReceivedVia,
  payload: Record<string, unknown>,
  alreadyRead?: Order,
): Promise<GatewaySignal | null> {
  let order = alreadyRead ?? (await controller.getOrder({id: orderId})).result;
  const reference = ourReference(order, tenantId);
  if (!reference) {
    return null;
  }
  let declinedIssue: string | null = null;
  if (order.status === 'APPROVED') {
    ({order, declinedIssue} = await captureOrRead(controller, orderId));
  }
  return signalForOrder(
    order,
    reference,
    receivedVia,
    {...payload, status: order.status, declinedIssue},
    declinedIssue,
  );
}

/* PayPal signs webhooks with a certificate; the signature is checked by
 * asking PayPal, with the webhook id the endpoint was registered under. */
async function verifyWebhook(
  paypal: PaypalConfig,
  request: Request,
  body: string,
): Promise<WebhookEvent> {
  if (!paypal.webhookId) {
    throw new Error('PayPal webhook id is not configured');
  }
  const header = (name: string) => request.headers.get(name);
  const event = JSON.parse(body) as WebhookEvent;
  const verification = await fetch(
    `${apiBase(paypal)}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await accessToken(paypal)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: header('paypal-transmission-id'),
        transmission_time: header('paypal-transmission-time'),
        cert_url: header('paypal-cert-url'),
        auth_algo: header('paypal-auth-algo'),
        transmission_sig: header('paypal-transmission-sig'),
        webhook_id: paypal.webhookId,
        webhook_event: event,
      }),
      signal: AbortSignal.timeout(PAYPAL_TIMEOUT_MS),
    },
  );
  if (!verification.ok) {
    throw new Error(
      `PayPal webhook verification failed: ${verification.status}`,
    );
  }
  const {verification_status: status} = (await verification.json()) as {
    verification_status: string;
  };
  if (status !== 'SUCCESS') {
    throw new Error('PayPal webhook signature is invalid');
  }
  return event;
}

/** Why PayPal denied a capture: its status details carry the reason code. */
function deniedReason(details: unknown): string {
  const reason =
    typeof details === 'object' && details !== null && 'reason' in details
      ? (details as {reason: unknown}).reason
      : null;
  return typeof reason === 'string' ? reason : 'DENIED';
}

/** The id at the end of a webhook resource's "up" link, which names what it applies to. */
function upLinkId(resource: Record<string, unknown>): string | null {
  const links = resource.links as {rel?: string; href?: string}[] | undefined;
  const up = links?.find(link => link.rel === 'up')?.href;
  return up ? (up.split('/').pop() ?? null) : null;
}

/**
 * Pure: the signals a verified webhook event carries, without calling PayPal.
 * A capture naming a reference that is not this tenant's is ignored here and
 * rejected again by settle. Exported for tests.
 */
export function signalsForWebhookEvent(
  event: WebhookEvent,
  tenantId: string,
): GatewaySignal[] {
  const resource = event.resource ?? {};
  const payload = {
    source: 'webhook',
    eventId: event.id,
    type: event.event_type,
  };
  const amount = resource.amount as PaypalMoney | undefined;
  const id = typeof resource.id === 'string' ? resource.id : null;

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
    case 'PAYMENT.CAPTURE.DENIED': {
      const parsed = parseReference(resource.custom_id);
      if (!parsed || parsed.tenantId !== tenantId || !id) return [];
      const related = resource.supplementary_data as
        | {related_ids?: {order_id?: string}}
        | undefined;
      const orderId = related?.related_ids?.order_id ?? upLinkId(resource);
      const completed = event.event_type === 'PAYMENT.CAPTURE.COMPLETED';
      return [
        {
          ...base(
            completed ? EVENT_TYPE.captured : EVENT_TYPE.refused,
            {by: 'reference', reference: parsed.reference},
            RECEIVED_VIA.webhook,
            payload,
          ),
          eventId: id,
          amount: minor(amount?.value, amount?.currency_code),
          currencyCode: amount?.currency_code?.toUpperCase() ?? null,
          providerRef: id,
          sessionRef: orderId,
          reason: completed ? null : deniedReason(resource.status_details),
        },
      ];
    }
    default:
      return [];
  }
}

export const paypalAdapter: GatewayAdapter = {
  gateway: GATEWAY.paypal,

  capabilities: {
    queryable: true,
    /* Our server makes the capture, so the browser leg is how the outcome is
     * learnt first-hand; the webhook is the backstop. */
    settlesOnReturn: true,
    chargesOnStart: false,
  },

  reconcile: {
    timedFrom: 'expiry',
    recheckMs: 60 * 60 * 1000,
    decideAfterExpiryMs: 24 * 60 * 60 * 1000,
  },

  isConfigured(config) {
    /* The button in the browser loads the SDK with the public client id, so
     * both halves of the configuration are needed to offer PayPal at all. */
    return Boolean(
      config.payments?.paypal?.clientId &&
        config.payments?.paypal?.clientSecret &&
        config.public?.paypal?.clientId,
    );
  },

  async createSession(
    input: SessionInput,
    context: GatewayContext,
  ): Promise<CreatedSession> {
    const paypal = paypalConfig(context.config);
    const response = await ordersController(paypal).createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            referenceId: input.reference,
            customId: input.reference,
            description: input.label.slice(0, 127),
            amount: {
              currencyCode: input.money.currencyCode,
              value: fromMinorUnits(
                input.money.amount,
                input.money.currencyScale,
              ),
            },
          },
        ],
      },
      paypalRequestId: input.idempotencyKey,
      prefer: 'return=representation',
    });
    const order = response.result;
    if (!order.id) {
      throw new Error('PayPal returned an order without an id');
    }

    const completeUrl = new URL(input.returnUrl);
    completeUrl.searchParams.set('ref', input.reference);

    return {
      handoff: {
        kind: 'sdk',
        orderId: order.id,
        completeUrl: completeUrl.toString(),
      },
      sessionRef: order.id,
      expiresOn: new Date(Date.now() + APPROVAL_WINDOW_MS),
    };
  },

  async parseReturn(request, context) {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('token');
    if (!orderId) {
      throw new Error('PayPal return carries no order id');
    }
    const paypal = paypalConfig(context.config);
    const controller = ordersController(paypal);
    const cancelled = url.searchParams.get('outcome') === 'cancel';
    const payload = {source: 'return', orderId, cancelled};

    /* The buyer closed PayPal's window. An order they had already approved
     * is captured all the same: the money wins over the browser's word. */
    let alreadyRead: Order | undefined;
    if (cancelled) {
      const read = await controller.getOrder({id: orderId});
      const reference = ourReference(read.result, context.tenantId);
      if (!reference) {
        throw new Error(`PayPal order ${orderId} is not one of ours`);
      }
      if (
        read.result.status !== 'APPROVED' &&
        read.result.status !== 'COMPLETED'
      ) {
        return cancelledSignal(orderId, reference, {
          ...payload,
          status: read.result.status,
        });
      }
      alreadyRead = read.result;
    }

    const signal = await settleOrder(
      controller,
      orderId,
      context.tenantId,
      RECEIVED_VIA.return,
      payload,
      alreadyRead,
    );
    if (!signal) {
      throw new Error(`PayPal order ${orderId} is not one of ours`);
    }
    return signal;
  },

  async parseNotification(request, context) {
    const paypal = paypalConfig(context.config);
    const body = await request.text();
    const event = await verifyWebhook(paypal, request, body);
    if (!event.event_type || !HANDLED_EVENTS.has(event.event_type)) {
      return [];
    }

    /* Approved but never captured: the buyer approved in PayPal's window and
     * the browser never came back. Capturing here is what the return leg
     * would have done, after the same check that the order is ours. */
    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const orderId =
        typeof event.resource?.id === 'string' ? event.resource.id : null;
      if (!orderId) return [];
      const signal = await settleOrder(
        ordersController(paypal),
        orderId,
        context.tenantId,
        RECEIVED_VIA.webhook,
        {source: 'webhook', eventId: event.id, type: event.event_type},
      );
      return signal ? [signal] : [];
    }

    return signalsForWebhookEvent(event, context.tenantId);
  },

  async fetchStatus(sessionRef, context) {
    const paypal = paypalConfig(context.config);
    let signal;
    try {
      signal = await settleOrder(
        ordersController(paypal),
        sessionRef,
        context.tenantId,
        RECEIVED_VIA.reconcile,
        {source: 'reconcile', orderId: sessionRef},
      );
    } catch (error) {
      /* The SDK's own error carries no message; the status and PayPal's
       * issue code are what a person needs to look the order up. */
      if (error instanceof ApiError) {
        const message = `PayPal answered ${error.statusCode}${issueOf(error) ? ` ${issueOf(error)}` : ''} for order ${sessionRef}`;
        /* PayPal drops an order nobody approved; asked about it later, it
         * answers exactly this, and nothing else means that. */
        if (
          error.statusCode === 404 &&
          issueOf(error) === 'INVALID_RESOURCE_ID'
        ) {
          throw new SessionNotFoundError(message, {cause: error});
        }
        throw new Error(message, {cause: error});
      }
      throw error;
    }
    if (!signal) {
      throw new Error(`PayPal order ${sessionRef} is not one of ours`);
    }
    return signal;
  },
};
