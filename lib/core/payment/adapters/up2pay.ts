import 'server-only';

import type {TenantConfig} from '@/tenant';
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

type Up2payConfig = NonNullable<
  NonNullable<TenantConfig['payments']>['up2pay']
>;

function up2payConfig(config: TenantConfig): Up2payConfig {
  const up2pay = config.payments?.up2pay;
  if (!up2pay) {
    throw new Error('Up2Pay is not configured');
  }
  return up2pay;
}

/**
 * The fields Up2Pay sends back, in this order, on the return and on the IPN
 * registered in its back office. `sign` must stay last. The command is named
 * `reference` rather than `ref`, which our own return address carries.
 */
const RETOUR = 'montant:M;reference:R;auto:A;trans:S;erreur:E;sign:K';

const SESSION_LIFETIME_MS = 15 * 60 * 1000;

/** ISO 3166-1 numeric France, for a billing address with no country. */
const DEFAULT_BILLING_COUNTRY = '250';

/* Up2Pay signs the returned fields after encoding exactly these characters in
 * the values (chapter 14 of the e-Transactions integration manual). */
const ENCODED: Record<string, string> = {
  ';': '%3B',
  '?': '%3F',
  '/': '%2F',
  ':': '%3A',
  '#': '%23',
  '&': '%26',
  '=': '%3D',
  '+': '%2B',
  $: '%24',
  ',': '%2C',
  ' ': '%20',
  '%': '%25',
  '@': '%40',
};

function encodeForSignature(value: string): string {
  return value.replace(/[;?/:&#=+$, %@]/g, character => ENCODED[character]);
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Whether an IPN names a payment of ours at all. Used before any database is touched. */
export function isOurUp2payNotification(request: Request): boolean {
  const command = new URL(request.url).searchParams.get('reference');
  return parseCommand(command) !== null;
}

/**
 * Whether Verifone signed this query, read without the database. Throws when
 * the public key is not deployed, since nothing can be verified then.
 */
export function isSignedByUp2pay(rawQuery: string): boolean {
  const {pairs, signature} = signedPairs(rawQuery);
  const message = pairs
    .map(
      ([name, value]) =>
        `${name}=${encodeForSignature(fieldValue([[name, value]], name) ?? '')}`,
    )
    .join('&');
  if (!signature || !message) {
    return false;
  }
  return verifyVerifoneSignature(
    message,
    signature,
    readVerifonePublicKey('up2pay'),
  );
}

function signalFromQuery(
  rawQuery: string,
  receivedVia: ReceivedVia,
  outcome: string | null,
): GatewaySignal {
  if (!isSignedByUp2pay(rawQuery)) {
    throw new Error('Up2Pay response signature is invalid');
  }
  const {pairs} = signedPairs(rawQuery);

  const command = parseCommand(fieldValue(pairs, 'reference'));
  if (!command) {
    throw new Error('Up2Pay response names no reference of ours');
  }
  const {reference, marker} = command;
  const attempt = marker ?? reference;
  const amount = fieldValue(pairs, 'montant');
  const transaction = fieldValue(pairs, 'trans');
  const authorisation = fieldValue(pairs, 'auto');
  const code = fieldValue(pairs, 'erreur');
  if (!code) {
    throw new Error('Up2Pay response carries no result code');
  }
  const resolution = {by: 'reference', reference} as const;
  const payload = {
    source: receivedVia,
    outcome,
    montant: amount,
    trans: transaction,
    auto: authorisation,
    erreur: code,
  };

  let type = eventTypeForCode(code);
  if (type === EVENT_TYPE.refused && outcome === 'cancel') {
    type = EVENT_TYPE.cancelled;
  }

  if (type === 'pending') {
    return pendingSignal({
      gateway: GATEWAY.up2pay,
      resolution,
      sessionRef: marker,
      receivedVia,
      payload,
    });
  }

  const transactionKey =
    transaction && transaction !== '0' ? transaction : null;

  return {
    gateway: GATEWAY.up2pay,
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

export const up2payAdapter: GatewayAdapter = {
  gateway: GATEWAY.up2pay,

  capabilities: {
    queryable: false,
    settlesOnReturn: true,
    chargesOnStart: false,
  },

  reconcile: VERIFONE_RECONCILE,

  isConfigured(config) {
    const up2pay = config.payments?.up2pay;
    return Boolean(
      up2pay?.site &&
        up2pay.rang &&
        up2pay.identifiant &&
        up2pay.secret &&
        up2pay.paybox,
    );
  },

  async createSession(
    input: SessionInput,
    context: GatewayContext,
  ): Promise<CreatedSession> {
    const up2pay = up2payConfig(context.config);
    const billing = input.billing ?? {};
    const returnUrl = withReference(input.returnUrl, input.reference);
    const shoppingCart =
      '<?xml version="1.0" encoding="utf-8"?><shoppingcart><total><totalQuantity>1</totalQuantity></total></shoppingcart>';
    const billingXml =
      '<?xml version="1.0" encoding="utf-8"?><Billing><Address>' +
      `<FirstName>${xmlEscape(billing.firstName ?? '')}</FirstName>` +
      `<LastName>${xmlEscape(billing.lastName ?? '')}</LastName>` +
      `<Address1>${xmlEscape(billing.addressLine1 ?? '')}</Address1>` +
      `<ZipCode>${xmlEscape(billing.zipCode ?? '')}</ZipCode>` +
      `<City>${xmlEscape(billing.city ?? '')}</City>` +
      `<CountryCode>${xmlEscape(billing.countryCode ?? DEFAULT_BILLING_COUNTRY)}</CountryCode>` +
      '</Address></Billing>';

    const fields: Record<string, string> = {
      PBX_SITE: up2pay.site,
      PBX_RANG: up2pay.rang,
      PBX_IDENTIFIANT: up2pay.identifiant,
      PBX_TOTAL: String(input.money.amount),
      PBX_DEVISE: numericCurrency(input.money.currencyCode),
      PBX_CMD: commandFor(input.reference, input.idempotencyKey),
      PBX_PORTEUR: input.payer,
      PBX_RETOUR: RETOUR,
      PBX_HASH: 'SHA512',
      PBX_TIME: new Date().toISOString(),
      PBX_SOUHAITAUTHENT: '04',
      PBX_SHOPPINGCART: shoppingCart,
      PBX_BILLING: billingXml,
      PBX_EFFECTUE: withOutcome(returnUrl, 'success'),
      PBX_ANNULE: withOutcome(returnUrl, 'cancel'),
      PBX_REFUSE: withOutcome(returnUrl, 'refuse'),
    };
    fields.PBX_HMAC = signFields(fields, up2pay.secret);

    /* Sent as a GET address, not a form post: the platform answers its
     * payment address with a redirect, which would turn a posted form into an
     * empty GET. The HMAC covers the fields unencoded, as the platform reads
     * them. */
    const paymentUrl = new URL(up2pay.paybox);
    paymentUrl.search = Object.entries(fields)
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join('&');

    return {
      handoff: {kind: 'redirect', url: paymentUrl.toString()},
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
      'Up2Pay cannot be asked about a payment; wait for its notification',
    );
  },
};
