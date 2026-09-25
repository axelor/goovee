import 'server-only';

import {EVENT_TYPE, GATEWAY, RECEIVED_VIA} from '../domain/types';
import {
  getStripe,
  ourReference,
  readStripeEvent,
  retrieveSession,
  signalForSession,
  signalsForStripeEvent,
} from './stripe-events';
import type {
  CreatedSession,
  GatewayAdapter,
  GatewayContext,
  SessionInput,
} from './types';

export {getStripe} from './stripe-events';

export const stripeCardAdapter: GatewayAdapter = {
  gateway: GATEWAY.stripeCard,

  capabilities: {
    queryable: true,
    settlesOnReturn: true,
    chargesOnStart: false,
  },

  /* A card checkout is decided within its session; one still open a day
   * past its expiry is a person's to look up. */
  reconcile: {
    timedFrom: 'expiry',
    recheckMs: 60 * 60 * 1000,
    decideAfterExpiryMs: 24 * 60 * 60 * 1000,
  },

  isConfigured(config) {
    return Boolean(config.payments?.stripe?.clientSecret);
  },

  async createSession(
    input: SessionInput,
    context: GatewayContext,
  ): Promise<CreatedSession> {
    const stripe = getStripe(context.config);
    const returnUrl = new URL(input.returnUrl);
    returnUrl.searchParams.set('ref', input.reference);

    /* The session id placeholder is filled in by Stripe, and would be escaped
     * by URLSearchParams, so it is appended by hand. */
    const successUrl = `${returnUrl.toString()}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${returnUrl.toString()}&session_id={CHECKOUT_SESSION_ID}&outcome=cancel`;
    const metadata = {
      reference: input.reference,
      tenant_id: context.tenantId,
      gateway: GATEWAY.stripeCard,
    };

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        submit_type: 'pay',
        client_reference_id: input.reference,
        customer_email: input.payer,
        metadata,
        payment_intent_data: {metadata},
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.money.currencyCode.toLowerCase(),
              product_data: {name: input.label},
              unit_amount: input.money.amount,
            },
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      {idempotencyKey: input.idempotencyKey},
    );

    if (!session.url) {
      throw new Error(`Stripe session ${session.id} has no checkout url`);
    }

    return {
      handoff: {kind: 'redirect', url: session.url},
      sessionRef: session.id,
      expiresOn: session.expires_at
        ? new Date(session.expires_at * 1000)
        : null,
    };
  },

  async parseReturn(request, context) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    const reference = url.searchParams.get('ref');
    const stripe = getStripe(context.config);

    if (!sessionId) {
      throw new Error('Stripe return carries no session id');
    }

    let session = await retrieveSession(stripe, sessionId);
    /* Before anything is done to it: a session id alone, or another tenant on
     * the same Stripe account, must not be able to end an open checkout. */
    if (
      !ourReference(
        session.metadata,
        session.client_reference_id,
        context.tenantId,
      )
    ) {
      throw new Error(`Stripe session ${sessionId} is not one of ours`);
    }

    /* The buyer left the Checkout page. That is the browser's word, so the
     * server makes it the provider's: it expires the still-open session at
     * Stripe and records what Stripe then says about it. A session that was
     * paid after all is settled as paid, whatever the browser claimed. */
    const cancelled = url.searchParams.get('outcome') === 'cancel';
    if (cancelled && session.status === 'open') {
      session = await stripe.checkout.sessions.expire(sessionId, {
        expand: ['payment_intent'],
      });
    }

    const signal = signalForSession(
      session,
      context.tenantId,
      RECEIVED_VIA.return,
      {
        source: 'return',
        sessionId,
        outcome: cancelled ? 'cancel' : 'success',
        status: session.status,
        paymentStatus: session.payment_status,
        ...(reference && {reference}),
      },
    );
    if (!signal) {
      throw new Error(`Stripe session ${sessionId} is not one of ours`);
    }

    if (cancelled && signal.type === EVENT_TYPE.expired) {
      return {
        ...signal,
        type: EVENT_TYPE.cancelled,
        eventId: session.id,
      };
    }
    return signal;
  },

  /* Reads every Stripe event, for both Stripe gateways: the account has one
   * endpoint per tenant and the parser sorts the objects by the gateway
   * recorded on them. */
  async parseNotification(request, context) {
    const event = await readStripeEvent(request, context.config);
    return signalsForStripeEvent(
      getStripe(context.config),
      event,
      context.tenantId,
    );
  },

  async fetchStatus(sessionRef, context) {
    const stripe = getStripe(context.config);
    const session = await retrieveSession(stripe, sessionRef);
    const signal = signalForSession(
      session,
      context.tenantId,
      RECEIVED_VIA.reconcile,
      {
        source: 'reconcile',
        sessionId: sessionRef,
        status: session.status,
        paymentStatus: session.payment_status,
      },
    );
    if (!signal) {
      throw new Error(`Stripe session ${sessionRef} is not one of ours`);
    }
    return signal;
  },
};
