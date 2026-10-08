import 'server-only';

import type {TenantConfig} from '@/tenant';
import {tenantURLs} from '@/url/scope';
import {pendingSignal, type GatewaySignal} from '../domain/signal';
import {
  EVENT_TYPE,
  GATEWAY,
  RECEIVED_VIA,
  type ReceivedVia,
} from '../domain/types';
import type {
  CreatedSession,
  GatewayAdapter,
  GatewayContext,
  SessionInput,
} from './types';
import {
  commandFor,
  eventIdFor,
  VERIFONE_RECONCILE,
  eventTypeForCode,
  fieldValue,
  numericCurrency,
  OUTCOME_PARAM,
  parseCommand,
  rawQueryOf,
  readVerifonePublicKey,
  signFields,
  signedPairs,
  verifyVerifoneSignature,
  withOutcome,
  withReference,
} from './verifone';

type PayboxConfig = NonNullable<
  NonNullable<TenantConfig['payments']>['paybox']
>;

function payboxConfig(config: TenantConfig): PayboxConfig {
  const paybox = config.payments?.paybox;
  if (!paybox) {
    throw new Error('Paybox is not configured');
  }
  return paybox;
}

/** The fields Paybox sends back, in this order, on both legs. `sign` must stay last. */
const RETOUR = 'montant:M;reference:R;auto:A;transaction:S;error:E;sign:K';

/** Paybox's payment page keeps a session open for this long. */
const SESSION_LIFETIME_MS = 15 * 60 * 1000;

/*
 * Reads the signed fields Paybox appended to a return or IPN address. The
 * same function serves both legs: Paybox signs both with its key, so they are
 * exactly as trustworthy as each other and only differ in how reliably they
 * arrive.
 */
function signalFromQuery(
  rawQuery: string,
  receivedVia: ReceivedVia,
  outcome: string | null,
): GatewaySignal {
  const {pairs, signature} = signedPairs(rawQuery);
  const message = pairs.map(([name, value]) => `${name}=${value}`).join('&');
  if (!signature || !message) {
    throw new Error('Paybox response carries no signed fields');
  }
  if (
    !verifyVerifoneSignature(
      message,
      signature,
      readVerifonePublicKey('paybox'),
    )
  ) {
    throw new Error('Paybox response signature is invalid');
  }

  const command = parseCommand(fieldValue(pairs, 'reference'));
  if (!command) {
    throw new Error('Paybox response names no reference of ours');
  }
  const {reference, marker} = command;
  const attempt = marker ?? reference;
  const amount = fieldValue(pairs, 'montant');
  const transaction = fieldValue(pairs, 'transaction');
  const authorisation = fieldValue(pairs, 'auto');
  const code = fieldValue(pairs, 'error');
  if (!code) {
    throw new Error('Paybox response carries no result code');
  }
  const resolution = {by: 'reference', reference} as const;
  const payload = {
    source: receivedVia,
    outcome,
    montant: amount,
    transaction,
    auto: authorisation,
    error: code,
  };

  let type = eventTypeForCode(code);
  /* A refusal code on the abandon address is the buyer leaving, not the bank
   * saying no; the marker is ours, but it only chooses between two ways of
   * ending a session that both leave nothing charged. */
  if (type === EVENT_TYPE.refused && outcome === 'cancel') {
    type = EVENT_TYPE.cancelled;
  }

  if (type === 'pending') {
    return pendingSignal({
      gateway: GATEWAY.paybox,
      resolution,
      sessionRef: marker,
      receivedVia,
      payload,
    });
  }

  const transactionKey =
    transaction && transaction !== '0' ? transaction : null;

  return {
    gateway: GATEWAY.paybox,
    resolution,
    type,
    eventId: eventIdFor(type, attempt, transactionKey, code),
    amount: type === EVENT_TYPE.captured && amount ? Number(amount) : null,
    currencyCode: null,
    providerRef: transactionKey,
    sessionRef: marker,
    reason: type === EVENT_TYPE.refused ? code : null,
    receivedVia,
    receivedOn: new Date(),
    payload,
  };
}

export const payboxAdapter: GatewayAdapter = {
  gateway: GATEWAY.paybox,

  capabilities: {
    /* Paybox System offers no way to ask what became of a payment: the IPN is
     * the only durable confirmation, which makes it load-bearing. */
    queryable: false,
    settlesOnReturn: true,
    chargesOnStart: false,
  },

  reconcile: VERIFONE_RECONCILE,

  isConfigured(config) {
    const paybox = config.payments?.paybox;
    return Boolean(
      paybox?.site &&
        paybox.rang &&
        paybox.identifiant &&
        paybox.secret &&
        paybox.paybox,
    );
  },

  async createSession(
    input: SessionInput,
    context: GatewayContext,
  ): Promise<CreatedSession> {
    const paybox = payboxConfig(context.config);
    /* The reference on the return address is the fallback the route shows a
     * page for when the signed fields cannot be read; it grants nothing. */
    const returnUrl = withReference(input.returnUrl, input.reference);
    const fields: Record<string, string> = {
      PBX_SITE: paybox.site,
      PBX_RANG: paybox.rang,
      PBX_IDENTIFIANT: paybox.identifiant,
      PBX_TOTAL: String(input.money.amount),
      PBX_DEVISE: numericCurrency(input.money.currencyCode),
      PBX_CMD: commandFor(input.reference, input.idempotencyKey),
      PBX_PORTEUR: input.payer,
      PBX_RETOUR: RETOUR,
      PBX_HASH: 'SHA512',
      PBX_TIME: new Date().toISOString(),
      PBX_EFFECTUE: withOutcome(returnUrl, 'success'),
      PBX_ATTENTE: withOutcome(returnUrl, 'wait'),
      PBX_REFUSE: withOutcome(returnUrl, 'refuse'),
      PBX_ANNULE: withOutcome(returnUrl, 'cancel'),
      PBX_REPONDRE_A: tenantURLs(context.tenantId).forExternal(
        '/api/webhooks/paybox',
      ),
    };
    fields.PBX_HMAC = signFields(fields, paybox.secret);

    return {
      handoff: {kind: 'form-post', url: paybox.paybox, fields},
      /* Paybox gives no handle of its own; the attempt marker it echoes is
       * what later legs name. */
      sessionRef: input.idempotencyKey,
      expiresOn: new Date(Date.now() + SESSION_LIFETIME_MS),
    };
  },

  async parseReturn(request) {
    const url = new URL(request.url);
    return signalFromQuery(
      url.search,
      RECEIVED_VIA.return,
      url.searchParams.get(OUTCOME_PARAM),
    );
  },

  async parseNotification(request) {
    return [
      signalFromQuery(await rawQueryOf(request), RECEIVED_VIA.webhook, null),
    ];
  },

  async fetchStatus() {
    throw new Error(
      'Paybox cannot be asked about a payment; wait for its notification',
    );
  },
};
