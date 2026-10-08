import 'server-only';

import Stripe from 'stripe';

import type {TenantConfig} from '@/tenant';
import {parseReference} from '../domain/reference';
import {pendingSignal, type GatewaySignal} from '../domain/signal';
import {
  EVENT_TYPE,
  GATEWAY,
  RECEIVED_VIA,
  type Gateway,
  type ReceivedVia,
} from '../domain/types';

/*
 * One Stripe account delivers every event to one endpoint per tenant, for
 * both Stripe gateways at once. Everything here reads Stripe objects into
 * signals; which gateway an object belongs to is the `gateway` we wrote into
 * its metadata when the session was created, and which tenant, the tenant
 * marker in the reference.
 */

/* Clients are cached per secret so tenants sharing an account share a client,
 * and the SDK's connection pooling is preserved. */
const clients = new Map<string, Stripe>();

export function getStripe(config: TenantConfig): Stripe {
  const secret = config.payments?.stripe?.clientSecret;
  if (!secret) {
    throw new Error('Stripe is not configured');
  }
  let client = clients.get(secret);
  if (!client) {
    client = new Stripe(secret);
    clients.set(secret, client);
  }
  return client;
}

export function idOf(
  value: string | {id: string} | null | undefined,
): string | null {
  if (!value) {
    return null;
  }
  return typeof value === 'string' ? value : value.id;
}

/** The Stripe gateway an object was created for, from its metadata. Card unless it says otherwise. */
export function gatewayOf(
  metadata: Stripe.Metadata | null | undefined,
): Gateway {
  return metadata?.gateway === GATEWAY.stripeBankTransfer
    ? GATEWAY.stripeBankTransfer
    : GATEWAY.stripeCard;
}

/** Our reference on a Stripe object, or null when it is not this tenant's. */
export function ourReference(
  metadata: Stripe.Metadata | null | undefined,
  fallback: string | null | undefined,
  tenantId: string,
): string | null {
  const parsed = parseReference(metadata?.reference ?? fallback ?? null);
  return parsed && parsed.tenantId === tenantId ? parsed.reference : null;
}

export async function retrieveSession(stripe: Stripe, sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });
}

/**
 * The signal for a Checkout Session, whichever leg observed it. Keyed on the
 * PaymentIntent so the return leg and `payment_intent.succeeded` name one
 * capture. Null for a session that is not this tenant's.
 */
export function signalForSession(
  session: Stripe.Checkout.Session,
  tenantId: string,
  receivedVia: ReceivedVia,
  payload: unknown,
): GatewaySignal | null {
  const reference = ourReference(
    session.metadata,
    session.client_reference_id,
    tenantId,
  );
  if (!reference) {
    return null;
  }
  const gateway = gatewayOf(session.metadata);
  const resolution = {by: 'reference', reference} as const;
  const paymentIntentId = idOf(session.payment_intent);

  if (session.payment_status === 'paid' && paymentIntentId) {
    const paymentIntent =
      typeof session.payment_intent === 'object'
        ? session.payment_intent
        : null;
    return {
      gateway,
      resolution,
      type: EVENT_TYPE.captured,
      eventId: paymentIntentId,
      amount: session.amount_total ?? paymentIntent?.amount_received ?? null,
      currencyCode:
        (session.currency ?? paymentIntent?.currency ?? '').toUpperCase() ||
        null,
      providerRef: paymentIntentId,
      sessionRef: session.id,
      reason: null,
      receivedVia,
      receivedOn: new Date(),
      payload,
    };
  }

  if (session.status === 'expired') {
    return {
      gateway,
      resolution,
      type: EVENT_TYPE.expired,
      eventId: session.id,
      amount: null,
      currencyCode: null,
      providerRef: null,
      sessionRef: session.id,
      reason: null,
      receivedVia,
      receivedOn: new Date(),
      payload,
    };
  }

  return pendingSignal({
    gateway,
    resolution,
    sessionRef: session.id,
    receivedVia,
    payload,
  });
}

/**
 * The signal for a PaymentIntent, whichever leg observed it: a card intent
 * behind a Checkout Session, or a bank-transfer intent whose funding may
 * arrive in parts. Null for an intent that is not this tenant's.
 */
export function signalForPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  tenantId: string,
  receivedVia: ReceivedVia,
  payload: unknown,
  sessionId: string | null = null,
): GatewaySignal | null {
  const reference = ourReference(paymentIntent.metadata, null, tenantId);
  if (!reference) {
    return null;
  }
  const gateway = gatewayOf(paymentIntent.metadata);
  const resolution = {by: 'reference', reference} as const;
  const currencyCode = paymentIntent.currency.toUpperCase();
  const sessionRef =
    gateway === GATEWAY.stripeBankTransfer ? paymentIntent.id : sessionId;
  const common = {
    gateway,
    resolution,
    currencyCode,
    sessionRef,
    receivedVia,
    receivedOn: new Date(),
    payload,
  };

  if (paymentIntent.status === 'succeeded') {
    return {
      ...common,
      type: EVENT_TYPE.captured,
      eventId: paymentIntent.id,
      amount: paymentIntent.amount_received,
      providerRef: paymentIntent.id,
      reason: null,
    };
  }

  if (paymentIntent.status === 'canceled') {
    return {
      ...common,
      type: EVENT_TYPE.cancelled,
      eventId: paymentIntent.id,
      amount: null,
      providerRef: paymentIntent.id,
      reason: paymentIntent.cancellation_reason ?? null,
    };
  }

  /* A bank transfer funded in part: Stripe keeps the intent open and says
   * how much is still expected. Each partial funding is its own event, keyed
   * on what remained after it. */
  const instructions =
    paymentIntent.next_action?.display_bank_transfer_instructions;
  if (
    gateway === GATEWAY.stripeBankTransfer &&
    instructions &&
    typeof instructions.amount_remaining === 'number' &&
    instructions.amount_remaining > 0 &&
    instructions.amount_remaining < paymentIntent.amount
  ) {
    return {
      ...common,
      type: EVENT_TYPE.partiallyCaptured,
      eventId: `${paymentIntent.id}:${instructions.amount_remaining}`,
      amount: paymentIntent.amount - instructions.amount_remaining,
      providerRef: paymentIntent.id,
      reason: null,
    };
  }

  return pendingSignal({gateway, resolution, sessionRef, receivedVia, payload});
}

/** The Stripe events the shared parser turns into signals. Others are acknowledged and ignored. */
const HANDLED_EVENTS = new Set<Stripe.Event.Type>([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.expired',
  'payment_intent.succeeded',
  'payment_intent.partially_funded',
  'payment_intent.canceled',
]);

/** Reads a verified Stripe event into signals. */
export async function signalsForStripeEvent(
  stripe: Stripe,
  event: Stripe.Event,
  tenantId: string,
): Promise<GatewaySignal[]> {
  if (!HANDLED_EVENTS.has(event.type)) {
    return [];
  }
  const payload = {source: 'webhook', eventId: event.id, type: event.type};

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.expired': {
      /* The event's session is not expanded; the PaymentIntent it names is
       * needed for the event key. */
      const session = await retrieveSession(stripe, event.data.object.id);
      const signal = signalForSession(
        session,
        tenantId,
        RECEIVED_VIA.webhook,
        payload,
      );
      return signal ? [signal] : [];
    }
    case 'payment_intent.succeeded':
    case 'payment_intent.partially_funded':
    case 'payment_intent.canceled': {
      const paymentIntent = event.data.object;
      if (!ourReference(paymentIntent.metadata, null, tenantId)) {
        return [];
      }
      /* A card intent is cancelled by Stripe when its Checkout Session
       * expires; the session's own event says so and is the one recorded. */
      if (gatewayOf(paymentIntent.metadata) === GATEWAY.stripeCard) {
        return [];
      }
      const signal = signalForPaymentIntent(
        paymentIntent,
        tenantId,
        RECEIVED_VIA.webhook,
        payload,
        null,
      );
      return signal ? [signal] : [];
    }
    default:
      return [];
  }
}

/** Verifies a webhook delivery against the tenant's signing secret and returns the event. */
export async function readStripeEvent(
  request: Request,
  config: TenantConfig,
): Promise<Stripe.Event> {
  const secret = config.payments?.stripe?.webhookSecret;
  if (!secret) {
    throw new Error('Stripe webhook secret is not configured');
  }
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    throw new Error('Stripe webhook is not signed');
  }
  const body = await request.text();
  return getStripe(config).webhooks.constructEvent(body, signature, secret);
}
