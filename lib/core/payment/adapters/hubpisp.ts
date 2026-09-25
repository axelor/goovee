import 'server-only';

import {createHash, createSign, randomUUID} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import https from 'node:https';
import path from 'node:path';

import type {TenantConfig} from '@/tenant';
import {signReturnGrant, verifyReturnGrant} from '../access';
import {fromMinorUnits, scaleOfCurrency, toMinorUnits} from '../domain/money';
import {parseReference} from '../domain/reference';
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

/*
 * BPCE's HUB PISP: a bank-to-bank transfer the payer authorises on their
 * bank's consent page. The handoff is a redirect to that page; the bank's
 * answer arrives by a webhook naming the payment link, and both the webhook
 * and the reconciler fetch the link and then the payment request over mTLS to
 * learn what the transfer did. The browser's return carries no fact, so it
 * only sets the cookie and shows the page.
 */

type HubPispConfig = NonNullable<
  NonNullable<TenantConfig['payments']>['hubpisp']
>;

function hubPispConfig(config: TenantConfig): HubPispConfig {
  const hubpisp = config.payments?.hubpisp;
  if (!hubpisp) {
    throw new Error('HUB PISP is not configured');
  }
  return hubpisp;
}

const PAYMENT_LINK_PATH = '/nxflq/hub-pisp/v2/payment-link';
const PAYMENT_REQUEST_PATH = '/nxflq/hub-pisp/v2/payment-requests';

/** How long the payer has to authorise the transfer. */
const CONSENT_LIFETIME_SECONDS = 1800;

/** How long the report addresses may grant the result page: the consent window, with a day's margin for a slow bank. */
const GRANT_LIFETIME_SECONDS = CONSENT_LIFETIME_SECONDS + 24 * 60 * 60;

/** How long the consent page may stay open. */
const PAGE_TIMEOUT_SECONDS = 1200;
const PAGE_USER_TIMEOUT_SECONDS = 300;

/** The link may not be readable the moment BPCE fires the webhook; a 400 is retried a few times, a pause apart. */
const LINK_FETCH_DELAY_MS = 2000;
const LINK_FETCH_ATTEMPTS = 3;

/** The shape of a BPCE resource id; anything else is refused before a call is made. */
const RESOURCE_ID = /^[A-Za-z0-9._-]{8,80}$/;

/** The two transfer types, as the workspace configuration names them. */
export const HUBPISP_OPTIONS = ['standard', 'instant'] as const;

export type HubPispOption = (typeof HUBPISP_OPTIONS)[number];

/** Each transfer type as the API names it. */
const LOCAL_INSTRUMENTS: Record<HubPispOption, 'SCT' | 'INST'> = {
  standard: 'SCT',
  instant: 'INST',
};

export function isHubPispOption(value: string): value is HubPispOption {
  return Object.hasOwn(LOCAL_INSTRUMENTS, value);
}

class HubPispApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(`${message} (${status}): ${body}`);
  }
}

/* Read once per directory: the certificate changes with a deployment, not a
 * request. */
const certificateFiles = new Map<
  string,
  {cert: Buffer; key: Buffer; keyPem: string}
>();

function certificatesIn(certsDir: string) {
  const cached = certificateFiles.get(certsDir);
  if (cached) {
    return cached;
  }
  const keyFile = path.join(certsDir, 'private-key.pem');
  if (!existsSync(keyFile)) {
    throw new Error('HUB PISP private key is not deployed');
  }
  const key = readFileSync(keyFile);
  const loaded = {
    cert: readFileSync(path.join(certsDir, 'client.crt')),
    key,
    keyPem: key.toString('utf8'),
  };
  certificateFiles.set(certsDir, loaded);
  return loaded;
}

/** BPCE publishes no figure; PayPal's guidance of "a minimum timeout setting of 30 seconds" is borrowed. */
const PISP_TIMEOUT_MS = 30_000;

/* Node's fetch cannot present a client certificate, so the calls go through
 * https with the tenant's mTLS pair. One deadline covers the whole call, the
 * connection and TLS handshake as much as a response that stalls, and ends it
 * by destroying the request. */
function pispFetch(
  url: string,
  init: {
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    body?: string;
  },
  certsDir: string,
): Promise<{status: number; ok: boolean; text: string}> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (outcome: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      outcome();
    };
    const parsed = new URL(url);
    const body = init.body != null ? Buffer.from(init.body) : undefined;
    const request = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: init.method,
        headers: {
          ...init.headers,
          ...(body ? {'Content-Length': String(body.byteLength)} : {}),
        },
        cert: certificatesIn(certsDir).cert,
        key: certificatesIn(certsDir).key,
      },
      response => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('error', error => finish(() => reject(error)));
        response.on('end', () => {
          const status = response.statusCode ?? 0;
          finish(() =>
            resolve({
              status,
              ok: status >= 200 && status < 300,
              text: Buffer.concat(chunks).toString('utf8'),
            }),
          );
        });
      },
    );
    const deadline = setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            `HUB PISP ${init.method} ${parsed.pathname} did not complete within ${PISP_TIMEOUT_MS / 1000} s`,
          ),
        ),
      );
      request.destroy();
    }, PISP_TIMEOUT_MS);
    request.on('error', error => finish(() => reject(error)));
    if (body) {
      request.write(body);
    }
    request.end();
  });
}

const tokens = new Map<string, {value: string; expiresAt: number}>();

async function accessToken(hubpisp: HubPispConfig): Promise<string> {
  const key = `${hubpisp.tokenUrl}:${hubpisp.clientId}`;
  const cached = tokens.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const credentials = Buffer.from(
    `${hubpisp.clientId}:${hubpisp.clientSecret}`,
  ).toString('base64');
  const response = await pispFetch(
    hubpisp.tokenUrl,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    },
    hubpisp.certsDir,
  );
  if (!response.ok) {
    throw new HubPispApiError(
      'HUB PISP token request failed',
      response.status,
      response.text,
    );
  }
  const {access_token: value, expires_in: expiresIn} = JSON.parse(
    response.text,
  ) as {access_token: string; expires_in?: number};
  tokens.set(key, {
    value,
    expiresAt: Date.now() + ((expiresIn ?? 300) - 30) * 1000,
  });
  return value;
}

/**
 * A signed call, per HUB PISP's HTTP signature profile: a SHA-256 digest of
 * the body and an RSA-SHA256 signature over the request target, digest, date
 * and request id, made with the tenant's private key and named by the
 * certificate fingerprint.
 */
async function signedCall(
  hubpisp: HubPispConfig,
  method: 'GET' | 'POST',
  apiPath: string,
  body: string,
): Promise<{status: number; ok: boolean; text: string}> {
  const digest = `SHA-256=${createHash('sha256').update(body, 'utf8').digest('base64')}`;
  const date = new Date().toISOString();
  const requestId = randomUUID();
  const target = `${method.toLowerCase()} ${apiPath}`;
  const signer = createSign('RSA-SHA256');
  signer.update(
    [
      `(request-target): ${target}`,
      `digest: ${digest}`,
      `date: ${date}`,
      `x-request-id: ${requestId}`,
    ].join('\n'),
    'utf8',
  );
  signer.end();
  const signature = signer.sign(
    certificatesIn(hubpisp.certsDir).keyPem,
    'base64',
  );

  return pispFetch(
    `${hubpisp.apiUrl}${apiPath}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${await accessToken(hubpisp)}`,
        Digest: digest,
        Date: date,
        'X-Request-ID': requestId,
        Signature: `keyId="${hubpisp.certFingerprint.toLowerCase()}",algorithm="rsa-sha256",headers="(request-target) digest date x-request-id",signature="${signature}"`,
        ...(body ? {'Content-Type': 'application/json'} : {}),
      },
      ...(body ? {body} : {}),
    },
    hubpisp.certsDir,
  );
}

/** A timestamp with the Paris offset written out; the API refuses a `Z` date. */
function parisTimestamp(atMs: number): string {
  const date = new Date(atMs);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .map(part => [part.type, part.value]),
  );
  const hour = Number(parts.hour) % 24;
  const wallClockMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMinutes =
    Math.floor(wallClockMs / 60_000) - Math.floor(date.getTime() / 60_000);
  const pad = (value: number, length = 2) =>
    String(value).padStart(length, '0');
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offset = Math.abs(offsetMinutes);
  return (
    `${parts.year}-${parts.month}-${parts.day}T${pad(hour)}:${parts.minute}:${parts.second}` +
    `.${pad(date.getMilliseconds(), 3)}${sign}${pad(Math.floor(offset / 60))}:${pad(offset % 60)}`
  );
}

type PaymentLink = {
  resourceId: string;
  consentStatus?: 'PENDING' | 'EXECUTED' | 'EXPIRED' | 'PROCESSED';
  paymentRequestResourceId?: string;
  paymentDetails?: {
    amount?: number;
    currency?: string;
    endToEnd?: string;
  };
};

type PaymentRequest = {
  transactionStatus?: string;
  statusReasonInformation?: string;
  creditTransferTransaction?: {
    transactionStatus?: string;
    statusReasonInformation?: string;
  }[];
};

async function fetchLink(
  hubpisp: HubPispConfig,
  resourceId: string,
): Promise<PaymentLink> {
  const response = await signedCall(
    hubpisp,
    'GET',
    `${PAYMENT_LINK_PATH}/${resourceId}`,
    '',
  );
  if (!response.ok) {
    throw new HubPispApiError(
      'HUB PISP payment link fetch failed',
      response.status,
      response.text,
    );
  }
  return JSON.parse(response.text) as PaymentLink;
}

async function fetchPaymentRequest(
  hubpisp: HubPispConfig,
  resourceId: string,
): Promise<PaymentRequest> {
  const response = await signedCall(
    hubpisp,
    'GET',
    `${PAYMENT_REQUEST_PATH}/${resourceId}`,
    '',
  );
  if (!response.ok) {
    throw new HubPispApiError(
      'HUB PISP payment request fetch failed',
      response.status,
      response.text,
    );
  }
  const data = JSON.parse(response.text) as {
    paymentRequest?: PaymentRequest;
  } & PaymentRequest;
  return data.paymentRequest ?? data;
}

/** Our reference on a payment link, or null when it is not this tenant's. */
function ourReference(link: PaymentLink, tenantId: string): string | null {
  const parsed = parseReference(link.paymentDetails?.endToEnd);
  return parsed && parsed.tenantId === tenantId ? parsed.reference : null;
}

/**
 * What a payment link says about the money, after asking about its payment
 * request where one exists. Terminal transaction statuses are ACSC (debited),
 * CANC and RJCT; anything else is not decided yet.
 */
async function signalForLink(
  hubpisp: HubPispConfig,
  link: PaymentLink,
  reference: string,
  receivedVia: ReceivedVia,
  payload: Record<string, unknown>,
): Promise<GatewaySignal> {
  const resolution = {by: 'reference', reference} as const;
  const common = {
    gateway: GATEWAY.hubpisp,
    resolution,
    currencyCode: link.paymentDetails?.currency?.toUpperCase() ?? null,
    sessionRef: link.resourceId,
    receivedVia,
    receivedOn: new Date(),
  };

  if (link.consentStatus === 'EXPIRED') {
    return {
      ...common,
      type: EVENT_TYPE.expired,
      eventId: link.resourceId,
      amount: null,
      providerRef: null,
      reason: null,
      payload: {...payload, consentStatus: link.consentStatus},
    };
  }

  const requestId = link.paymentRequestResourceId;
  if (link.consentStatus !== 'PROCESSED' || !requestId) {
    return pendingSignal({
      gateway: GATEWAY.hubpisp,
      resolution,
      sessionRef: link.resourceId,
      receivedVia,
      payload: {...payload, consentStatus: link.consentStatus},
    });
  }

  const paymentRequest = await fetchPaymentRequest(hubpisp, requestId);
  const transaction = paymentRequest.creditTransferTransaction?.[0];
  const status =
    transaction?.transactionStatus ?? paymentRequest.transactionStatus ?? null;
  const reason =
    transaction?.statusReasonInformation ??
    paymentRequest.statusReasonInformation ??
    null;
  const detail = {
    ...payload,
    consentStatus: link.consentStatus,
    paymentRequestResourceId: requestId,
    transactionStatus: status,
    statusReasonInformation: reason,
  };

  switch (status) {
    case 'ACSC': {
      const amount = link.paymentDetails?.amount;
      const currency = link.paymentDetails?.currency ?? 'EUR';
      return {
        ...common,
        type: EVENT_TYPE.captured,
        eventId: requestId,
        amount:
          typeof amount === 'number'
            ? toMinorUnits(amount, scaleOfCurrency(currency))
            : null,
        providerRef: requestId,
        reason: null,
        payload: detail,
      };
    }
    case 'CANC':
      return {
        ...common,
        type: EVENT_TYPE.cancelled,
        eventId: `${requestId}:CANC`,
        amount: null,
        providerRef: requestId,
        reason,
        payload: detail,
      };
    case 'RJCT':
      return {
        ...common,
        type: EVENT_TYPE.refused,
        eventId: `${requestId}:RJCT`,
        amount: null,
        providerRef: requestId,
        reason: reason ?? 'RJCT',
        payload: detail,
      };
    default:
      return pendingSignal({
        gateway: GATEWAY.hubpisp,
        resolution,
        sessionRef: link.resourceId,
        receivedVia,
        payload: detail,
      });
  }
}

async function describeLink(
  hubpisp: HubPispConfig,
  resourceId: string,
  tenantId: string,
  receivedVia: ReceivedVia,
  payload: Record<string, unknown>,
): Promise<GatewaySignal | null> {
  const link = await fetchLink(hubpisp, resourceId);
  const reference = ourReference(link, tenantId);
  if (!reference) {
    return null;
  }
  return signalForLink(hubpisp, link, reference, receivedVia, payload);
}

export const hubpispAdapter: GatewayAdapter = {
  gateway: GATEWAY.hubpisp,

  capabilities: {
    queryable: true,
    /* The report address the bank sends the browser to carries nothing the
     * server can verify; the webhook and the reconciler learn the outcome. */
    settlesOnReturn: false,
    chargesOnStart: false,
  },

  /* A credit transfer the bank has accepted is asked every six hours; a
   * standard SEPA credit transfer takes business days, more over a weekend or
   * a bank holiday, so a person looks five days past its expiry. */
  reconcile: {
    timedFrom: 'expiry',
    recheckMs: 6 * 60 * 60 * 1000,
    decideAfterExpiryMs: 5 * 24 * 60 * 60 * 1000,
  },

  isConfigured(config) {
    const hubpisp = config.payments?.hubpisp;
    return Boolean(
      hubpisp?.apiUrl &&
        hubpisp.tokenUrl &&
        hubpisp.clientId &&
        hubpisp.clientSecret &&
        hubpisp.certFingerprint &&
        hubpisp.beneficiaryName &&
        hubpisp.iban &&
        hubpisp.certsDir,
    );
  },

  async createSession(
    input: SessionInput,
    context: GatewayContext,
  ): Promise<CreatedSession> {
    const hubpisp = hubPispConfig(context.config);
    if (input.money.currencyCode.toUpperCase() !== 'EUR') {
      throw new Error('HUB PISP only carries EUR transfers');
    }
    const option = input.option ?? 'standard';
    if (!isHubPispOption(option)) {
      throw new Error(`Unknown HUB PISP transfer type "${input.option}"`);
    }
    const localInstrument = LOCAL_INSTRUMENTS[option];
    /* The report addresses carry a grant the return leg is checked against:
     * the bank and the payer's browser are the only ones who ever see it. */
    const returnUrl = new URL(input.returnUrl);
    returnUrl.searchParams.set('ref', input.reference);
    returnUrl.searchParams.set(
      'grant',
      signReturnGrant(context.config, input.reference, GRANT_LIFETIME_SECONDS),
    );
    const report = (outcome: string) => {
      const url = new URL(returnUrl);
      url.searchParams.set('outcome', outcome);
      return url.toString();
    };
    const payerName = [input.billing?.firstName, input.billing?.lastName]
      .filter(Boolean)
      .join(' ');

    const body = JSON.stringify({
      amount: Number(
        fromMinorUnits(input.money.amount, input.money.currencyScale),
      ),
      currency: 'EUR',
      beneficiary: {
        creditor: {name: hubpisp.beneficiaryName},
        creditorAccount: {iban: hubpisp.iban},
        ...(hubpisp.bic && {creditorAgent: {bicFi: hubpisp.bic}}),
      },
      requestedExecutionDate: parisTimestamp(Date.now() + 15_000),
      consentInfo: {expireIn: CONSENT_LIFETIME_SECONDS, unit: 'SECONDS'},
      localInstrument,
      endToEnd: input.reference,
      remittanceInformation: input.label.slice(0, 100),
      successfulReportUrl: report('success'),
      unsuccessfulReportUrl: report('cancel'),
      psuInfo: {name: payerName || input.payer, email: input.payer},
      pageConsentInfo: {
        pageTimeout: PAGE_TIMEOUT_SECONDS,
        pageTimeoutUnit: 'SECONDS',
        pageUserTimeout: PAGE_USER_TIMEOUT_SECONDS,
        pageUserTimeoutUnit: 'SECONDS',
        pageTimeOutReturnURL: report('expired'),
      },
    });

    const response = await signedCall(hubpisp, 'POST', PAYMENT_LINK_PATH, body);
    if (!response.ok) {
      throw new HubPispApiError(
        'HUB PISP payment link creation failed',
        response.status,
        response.text,
      );
    }
    const created = JSON.parse(response.text) as {
      resourceId?: string;
      _links?: {consent?: {href?: string}};
    };
    if (!created.resourceId || !created._links?.consent?.href) {
      throw new Error('HUB PISP returned no consent link');
    }

    return {
      handoff: {kind: 'redirect', url: created._links.consent.href},
      sessionRef: created.resourceId,
      expiresOn: new Date(Date.now() + CONSENT_LIFETIME_SECONDS * 1000),
    };
  },

  /* The bank sends the browser back with our own markers only. Nothing here
   * is a provider fact, so the signal is "not yet" and settles nothing; the
   * route gives the browser its cookie on the strength of the grant the
   * report address was created with, and shows the page. */
  async parseReturn(request, context) {
    const url = new URL(request.url);
    const reference = parseReference(url.searchParams.get('ref'))?.reference;
    if (!reference) {
      throw new Error('HUB PISP return names no reference of ours');
    }
    const granted = verifyReturnGrant(
      context.config,
      reference,
      url.searchParams.get('grant'),
    );
    if (!granted) {
      throw new Error('HUB PISP return carries no valid grant');
    }
    return pendingSignal({
      gateway: GATEWAY.hubpisp,
      resolution: {by: 'reference', reference},
      receivedVia: RECEIVED_VIA.return,
      payload: {source: 'return', outcome: url.searchParams.get('outcome')},
    });
  },

  /* The webhook address ends with the payment link's id and carries no
   * signature; trust comes from reading the link back over mTLS. BPCE never
   * redelivers, and the link may not be readable at once, so a 400 is retried
   * a few times before the reconciler is left to pick the payment up. */
  async parseNotification(request, context) {
    const hubpisp = hubPispConfig(context.config);
    const resourceId = new URL(request.url).pathname
      .split('/')
      .filter(Boolean)
      .pop();
    /* Checked before anything is asked of BPCE with our credentials: the
     * address is not signed, so a stranger's call must cost nothing. */
    if (!resourceId || !RESOURCE_ID.test(resourceId)) {
      throw new Error('HUB PISP notification names no payment link');
    }
    for (let attempt = 1; ; attempt++) {
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, LINK_FETCH_DELAY_MS));
      }
      try {
        const signal = await describeLink(
          hubpisp,
          resourceId,
          context.tenantId,
          RECEIVED_VIA.webhook,
          {source: 'webhook', resourceId},
        );
        return signal ? [signal] : [];
      } catch (error) {
        /* A link BPCE does not know is not ours to wait for. */
        if (error instanceof HubPispApiError && error.status === 404) {
          return [];
        }
        if (
          !(error instanceof HubPispApiError) ||
          error.status !== 400 ||
          attempt >= LINK_FETCH_ATTEMPTS
        ) {
          throw error;
        }
      }
    }
  },

  async fetchStatus(sessionRef, context) {
    const signal = await describeLink(
      hubPispConfig(context.config),
      sessionRef,
      context.tenantId,
      RECEIVED_VIA.reconcile,
      {source: 'reconcile', resourceId: sessionRef},
    );
    if (!signal) {
      throw new Error(`HUB PISP payment link ${sessionRef} is not one of ours`);
    }
    return signal;
  },
};
