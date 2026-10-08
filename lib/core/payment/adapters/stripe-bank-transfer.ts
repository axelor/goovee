import 'server-only';

import {randomUUID} from 'node:crypto';
import type Stripe from 'stripe';

import {fromMinorUnits, scaleOfCurrency} from '../domain/money';
import {
  BANK_TRANSFER_WINDOW_MS,
  isWithdrawn,
  transferDeadline,
  type WithdrawalRequest,
} from '../domain/transfers';
import {GATEWAY, RECEIVED_VIA, type ReceivedVia} from '../domain/types';
import {
  gatewayOf,
  getStripe,
  ourReference,
  readStripeEvent,
  signalForPaymentIntent,
  signalsForStripeEvent,
} from './stripe-events';
import type {GatewaySignal} from '../domain/signal';
import type {
  AwaitingInstructions,
  CancelReason,
  CancelResult,
  CreatedSession,
  GatewayAdapter,
  GatewayContext,
  SessionInput,
} from './types';

/*
 * A Stripe bank transfer: the payer is given an account and a reference and
 * wires the money whenever they wire it, days later or never. There is no
 * page to come back from, so the handoff goes straight to our result page,
 * which shows the instructions while the payment awaits; the webhook is the
 * only confirmation, and a transfer may arrive in parts.
 */

/** The Stripe bank-transfer variant for a currency; EUR transfers name the country whose account Stripe presents. */
function transferTypeFor(
  currencyCode: string,
  country: string,
): Stripe.PaymentIntentCreateParams.PaymentMethodOptions.CustomerBalance.BankTransfer | null {
  switch (currencyCode.toUpperCase()) {
    case 'EUR':
      return {type: 'eu_bank_transfer', eu_bank_transfer: {country}};
    case 'USD':
      return {type: 'us_bank_transfer'};
    default:
      return null;
  }
}

/* Where to wire the money does not change for the life of an intent, so one
 * retrieve per intent per process serves every render of its page. What is
 * still expected does change, with every partial funding: readers take the
 * lower of this figure and the ledger's. */
const INSTRUCTIONS_TTL_MS = 60 * 60 * 1000;
const instructionsCache = new Map<
  string,
  {value: AwaitingInstructions | null; expiresAt: number}
>();

/* A transfer needs a Stripe customer to fund. One is looked up by the payer's
 * address and created when missing, under an idempotency key derived from the
 * session's so a retried create cannot make two. */
async function customerFor(
  stripe: Stripe,
  payer: string,
  tenantId: string,
  idempotencyKey: string,
): Promise<string> {
  /* Scoped to the tenant: on a shared account another tenant's customer with
   * the same address holds a cash balance Stripe would otherwise apply here.
   * The list endpoint is used rather than search, which Stripe does not offer
   * to every account region. */
  const email = payer.trim().toLowerCase();
  for await (const customer of stripe.customers.list({email, limit: 100})) {
    if (customer.metadata.tenant_id === tenantId) {
      return customer.id;
    }
  }
  const created = await stripe.customers.create(
    {email, metadata: {tenant_id: tenantId}},
    {idempotencyKey: `${idempotencyKey}:customer`},
  );
  return created.id;
}

function instructionsOf(
  paymentIntent: Stripe.PaymentIntent,
): AwaitingInstructions | null {
  const instructions =
    paymentIntent.next_action?.display_bank_transfer_instructions;
  if (!instructions) {
    return null;
  }
  const address = instructions.financial_addresses?.[0];
  const scale = scaleOfCurrency(paymentIntent.currency);
  const result: AwaitingInstructions = {
    reference: instructions.reference ?? undefined,
    amountRemaining:
      typeof instructions.amount_remaining === 'number'
        ? fromMinorUnits(instructions.amount_remaining, scale)
        : undefined,
  };
  if (address?.type === 'iban' && address.iban) {
    result.iban = address.iban.iban;
    result.bic = address.iban.bic ?? undefined;
    result.accountHolder = address.iban.account_holder_name ?? undefined;
  } else if (address?.type === 'aba' && address.aba) {
    result.routingNumber = address.aba.routing_number;
    result.accountNumber = address.aba.account_number;
    result.bankName = address.aba.bank_name ?? undefined;
  }
  return result;
}

async function readIntent(
  intentId: string,
  context: GatewayContext,
  receivedVia: ReceivedVia,
) {
  const stripe = getStripe(context.config);
  const paymentIntent = await stripe.paymentIntents.retrieve(intentId);
  const signal = signalForPaymentIntent(
    paymentIntent,
    context.tenantId,
    receivedVia,
    {source: receivedVia, intentId, status: paymentIntent.status},
  );
  if (!signal) {
    throw new Error(`Stripe intent ${intentId} is not one of ours`);
  }
  return signal;
}

export const stripeBankTransferAdapter: GatewayAdapter = {
  gateway: GATEWAY.stripeBankTransfer,

  capabilities: {
    queryable: true,
    settlesOnReturn: true,
    chargesOnStart: true,
  },

  /* The payer sends the transfer when they choose, within its window: asked
   * daily from the start, and cancelled at the provider when the window
   * ends, whatever part of it arrived. */
  reconcile: {
    timedFrom: 'start',
    recheckMs: 24 * 60 * 60 * 1000,
    firstCheckAfterMs: 24 * 60 * 60 * 1000,
    decideAfterMs: BANK_TRANSFER_WINDOW_MS,
  },

  /* Without the signing secret nothing would ever confirm a transfer, and the
   * payer would be shown real bank details for a payment that stays awaiting. */
  isConfigured(config) {
    return Boolean(
      config.payments?.stripe?.clientSecret &&
        config.payments?.stripe?.webhookSecret,
    );
  },

  async createSession(
    input: SessionInput,
    context: GatewayContext,
  ): Promise<CreatedSession> {
    const transfer = transferTypeFor(
      input.money.currencyCode,
      context.config.payments?.stripe?.bankTransferCountry ?? 'FR',
    );
    if (!transfer) {
      throw new Error(
        `Stripe bank transfers are not offered in ${input.money.currencyCode}`,
      );
    }
    const stripe = getStripe(context.config);
    const customer = await customerFor(
      stripe,
      input.payer,
      context.tenantId,
      input.idempotencyKey,
    );

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: input.money.amount,
        currency: input.money.currencyCode.toLowerCase(),
        customer,
        payment_method_types: ['customer_balance'],
        payment_method_data: {type: 'customer_balance'},
        payment_method_options: {
          customer_balance: {
            funding_type: 'bank_transfer',
            bank_transfer: transfer,
          },
        },
        confirm: true,
        description: input.label,
        metadata: {
          reference: input.reference,
          tenant_id: context.tenantId,
          gateway: GATEWAY.stripeBankTransfer,
        },
      },
      {idempotencyKey: input.idempotencyKey},
    );

    const completeUrl = new URL(input.returnUrl);
    completeUrl.searchParams.set('ref', input.reference);
    completeUrl.searchParams.set('intent', paymentIntent.id);

    return {
      /* The return route reads the intent back and settles whatever Stripe
       * says about it, which is usually "awaiting", then shows the page with
       * the instructions. */
      handoff: {kind: 'redirect', url: completeUrl.toString()},
      sessionRef: paymentIntent.id,
      /* The end of its window, when the portal cancels it: what the ERP
       * shows as its expiry. */
      expiresOn: transferDeadline(new Date()),
    };
  },

  async parseReturn(request, context) {
    const intentId = new URL(request.url).searchParams.get('intent');
    if (!intentId) {
      throw new Error('Stripe bank transfer return carries no intent id');
    }
    return readIntent(intentId, context, RECEIVED_VIA.return);
  },

  async parseNotification(request, context) {
    const event = await readStripeEvent(request, context.config);
    return signalsForStripeEvent(
      getStripe(context.config),
      event,
      context.tenantId,
    );
  },

  async fetchStatus(sessionRef, context) {
    return readIntent(sessionRef, context, RECEIVED_VIA.reconcile);
  },

  async describeAwaiting(sessionRef, context) {
    const cached = instructionsCache.get(sessionRef);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    const stripe = getStripe(context.config);
    const paymentIntent = await stripe.paymentIntents.retrieve(sessionRef);
    const value = instructionsOf(paymentIntent);
    instructionsCache.set(sessionRef, {
      value,
      expiresAt: Date.now() + INSTRUCTIONS_TTL_MS,
    });
    return value;
  },

  async cancelAwaiting(sessionRef, request, context) {
    const result = await cancelTransferIntent(
      getStripe(context.config),
      sessionRef,
      request,
      context.tenantId,
    );
    instructionsCache.delete(sessionRef);
    return result;
  },
};

/** What a bank-transfer intent's state allows. */
export type TransferIntentState = 'cancelable' | 'funded' | 'ended';

/* The only states Stripe documents as cancelable that a bank transfer can be
 * in. `processing` is cancelable only in rare cases and means money is moving,
 * so it is left alone with the rest. */
const CANCELABLE_STATUSES: ReadonlySet<Stripe.PaymentIntent.Status> = new Set([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
]);

/**
 * Whether a bank-transfer intent may be withdrawn. A transfer Stripe has
 * applied any money to — a partial funding, or a cash balance it used at
 * confirmation — is funded even while it still waits for the rest: the
 * invoice guard and the payer leave it be. At the end of its window it goes
 * anyway, and Stripe returns what was applied to the customer's cash balance
 * (checked in test mode). Any state not known to be safe counts as funded.
 */
export function classifyTransferIntent(
  paymentIntent: Pick<
    Stripe.PaymentIntent,
    'status' | 'amount' | 'amount_received' | 'next_action'
  >,
): TransferIntentState {
  if (paymentIntent.status === 'canceled') {
    return 'ended';
  }
  if (
    !CANCELABLE_STATUSES.has(paymentIntent.status) ||
    hasReceivedMoney(paymentIntent)
  ) {
    return 'funded';
  }
  return 'cancelable';
}

/* Stripe shows money applied to an open transfer as what is left to send, not
 * as money received, so both are read. */
function hasReceivedMoney(
  paymentIntent: Pick<
    Stripe.PaymentIntent,
    'amount' | 'amount_received' | 'next_action'
  >,
): boolean {
  if (paymentIntent.amount_received > 0) {
    return true;
  }
  const remaining =
    paymentIntent.next_action?.display_bank_transfer_instructions
      ?.amount_remaining;
  return typeof remaining === 'number' && remaining < paymentIntent.amount;
}

/** The parts of the Stripe client a withdrawal uses, so it can be run against a stand-in. */
export type TransferIntentClient = {
  paymentIntents: Pick<Stripe['paymentIntents'], 'retrieve' | 'cancel'>;
};

/**
 * Withdraws a bank-transfer intent unless it has received money, or whatever
 * it received once its window is over (`abandoned`), and reports the
 * provider's own account of it either way. The intent is read immediately
 * before the cancel, because Stripe offers no cancel that is conditional on
 * the intent being unfunded. Money that reaches Stripe between the read and
 * the cancel is the one case this cannot rule out; Stripe returns money
 * applied to a cancelled intent to the customer's cash balance.
 *
 * What the transfer still asks for is read from the intent, not the ledger:
 * Stripe may have applied a cash balance the customer held, which lowers what
 * the intent is waiting for without an event the ledger would record.
 *
 * A cancel that fails is not caught: the task runs again, and its read then
 * finds the intent cancelled, funded or still open. The idempotency key is
 * fresh on every call, because Stripe replays the first answer to a key for a
 * day, failures included; repeating a cancel needs no key, since the read
 * before it says whether one is needed.
 */
export async function cancelTransferIntent(
  stripe: TransferIntentClient,
  intentId: string,
  request: WithdrawalRequest,
  tenantId: string,
): Promise<CancelResult> {
  const before = await stripe.paymentIntents.retrieve(intentId);
  /* Checked before anything is withdrawn: on a Stripe account shared between
   * tenants, an intent that is not this tenant's bank transfer is not ours to
   * cancel. */
  if (
    !ourReference(before.metadata, null, tenantId) ||
    gatewayOf(before.metadata) !== GATEWAY.stripeBankTransfer
  ) {
    throw new Error(`Stripe intent ${intentId} is not one of ours`);
  }
  const state = classifyTransferIntent(before);
  /* Past its window a transfer goes even if part of it arrived: Stripe holds
   * that part on the intent, off the account's balance, and gives it back to
   * the customer's cash balance when the intent is cancelled. One Stripe
   * completed is not cancelable and is left to be settled as paid. */
  const abandonedInPart =
    request.reason === 'abandoned' &&
    state === 'funded' &&
    CANCELABLE_STATUSES.has(before.status);
  if (state !== 'cancelable' && !abandonedInPart) {
    return {
      outcome: state === 'ended' ? 'already-ended' : 'funded',
      signal: transferSignal(before, tenantId, request.reason),
    };
  }
  if (!isWithdrawn(request, before.amount)) {
    return {
      outcome: 'kept',
      signal: transferSignal(before, tenantId, request.reason),
    };
  }

  const cancelled = await stripe.paymentIntents.cancel(
    intentId,
    {cancellation_reason: request.reason},
    {idempotencyKey: `cancel_pi_${intentId}_${randomUUID()}`},
  );

  return {
    outcome: 'cancelled',
    signal: transferSignal(cancelled, tenantId, request.reason),
  };
}

function transferSignal(
  paymentIntent: Stripe.PaymentIntent,
  tenantId: string,
  reason: CancelReason,
): GatewaySignal {
  const signal = signalForPaymentIntent(
    paymentIntent,
    tenantId,
    RECEIVED_VIA.reconcile,
    {
      source: 'cancel',
      reason,
      intentId: paymentIntent.id,
      status: paymentIntent.status,
    },
  );
  if (!signal) {
    throw new Error(`Stripe intent ${paymentIntent.id} is not one of ours`);
  }
  return signal;
}
