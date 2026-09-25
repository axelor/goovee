import 'server-only';

import {createHmac, createVerify} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';

import {findReference} from '../domain/reference';
import {EVENT_TYPE, type EventType} from '../domain/types';
import type {ReconcilePolicy} from './types';

/*
 * Shared by the two Verifone-family gateways, Paybox System and Crédit
 * Agricole's Up2Pay e-Transactions. Both take a signed form of PBX_* fields,
 * send the browser back with the fields named in PBX_RETOUR, and call the IPN
 * address with the same fields; both sign what they send with Verifone's RSA
 * key, so the two legs are equally trustworthy.
 */

/** ISO 4217 numeric codes for PBX_DEVISE. */
const CURRENCY_NUMERIC: Record<string, string> = {
  EUR: '978',
  USD: '840',
  GBP: '826',
  CHF: '756',
  CAD: '124',
  JPY: '392',
};

export function numericCurrency(code: string): string {
  const numeric = CURRENCY_NUMERIC[code.toUpperCase()];
  if (!numeric) {
    throw new Error(`Currency ${code} is not supported by this gateway`);
  }
  return numeric;
}

/**
 * What goes in PBX_CMD: the reference, then a marker for this attempt. Both
 * gateways echo it on every leg, so an attempt is told apart from an earlier
 * one on the same payment even though neither gateway gives a session id of
 * its own.
 */
/* Unreserved under RFC 3986, so it reaches us as sent whatever the URL layer
 * does, and absent from a reference, whose tenant part is [a-z][a-z0-9]*. */
export const COMMAND_SEPARATOR = '~';

export function commandFor(reference: string, marker: string): string {
  return `${reference}${COMMAND_SEPARATOR}${marker}`;
}

export type ParsedCommand = {reference: string; marker: string | null};

/** The reference and attempt marker out of an echoed PBX_CMD, or null for a command that is not ours. */
export function parseCommand(command: string | null): ParsedCommand | null {
  const reference = findReference(command)?.reference;
  if (!reference || !command) {
    return null;
  }
  const separator = command.indexOf(COMMAND_SEPARATOR);
  const marker = separator >= 0 ? command.slice(separator + 1) : null;
  return {reference, marker: marker || null};
}

/** The HMAC-SHA512 of the fields in order, keyed by the merchant's hex secret; upper-case hex as Verifone expects. */
export function signFields(
  fields: Record<string, string>,
  hexSecret: string,
): string {
  const message = Object.entries(fields)
    .map(([name, value]) => `${name}=${value}`)
    .join('&');
  return createHmac('sha512', Buffer.from(hexSecret, 'hex'))
    .update(message, 'utf8')
    .digest('hex')
    .toUpperCase();
}

export class PublicKeyNotDeployedError extends Error {
  constructor(gatewayDir: string) {
    super(
      `Verifone public key for ${gatewayDir} is not deployed at certs/${gatewayDir}/public-key.pem`,
    );
  }
}

/* Read once per process: the key changes with a deployment, not a request. */
const publicKeys = new Map<string, string>();

/**
 * Verifone's public key for a gateway, from `certs/<gateway>/public-key.pem`.
 *
 * @throws {PublicKeyNotDeployedError} when the file is absent, so a missing
 *   deployment reads differently in the logs from a forged signature.
 */
export function readVerifonePublicKey(gatewayDir: string): string {
  const cached = publicKeys.get(gatewayDir);
  if (cached) {
    return cached;
  }
  const file = path.join(process.cwd(), 'certs', gatewayDir, 'public-key.pem');
  if (!existsSync(file)) {
    throw new PublicKeyNotDeployedError(gatewayDir);
  }
  const pem = readFileSync(file, 'utf8');
  publicKeys.set(gatewayDir, pem);
  return pem;
}

/** RSA-SHA1 over the returned fields, with the base64 `sign` Verifone appended. */
export function verifyVerifoneSignature(
  message: string,
  signature: string,
  publicKeyPem: string,
): boolean {
  if (!message || !signature || !publicKeyPem) {
    return false;
  }
  try {
    const verifier = createVerify('SHA1');
    verifier.update(message);
    verifier.end();
    return verifier.verify(publicKeyPem, Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}

/*
 * A percent-encoded unreserved character (RFC 3986 §2.3) is the same
 * character. Verifone signs such characters bare, `~` among them, and a URL
 * layer on the way to us may encode them; reading them back bare compares
 * what Verifone signed.
 */
function normaliseUnreserved(value: string): string {
  return value.replace(
    /%(7E|2D|2E|5F|3[0-9]|4[1-9A-F]|5[0-9A]|6[1-9A-F]|7[0-9A])/gi,
    encoded => String.fromCharCode(parseInt(encoded.slice(1), 16)),
  );
}

function decodeField(value: string): string | null {
  try {
    return decodeURIComponent(value.replace(/\+/g, '%20'));
  } catch {
    return null;
  }
}

/**
 * The raw query string Verifone signed: everything before `&sign=`. Verifone
 * appends its fields to whatever address it was given and signs the whole
 * query it then sends, so our own parameters on a return address are covered
 * too, and the IPN address, which carries none of ours, follows the same rule.
 *
 * Returns the raw pairs so a gateway can re-encode the values the way it
 * signs them. A query that cannot be decoded is reported as unsigned.
 */
export function signedPairs(rawQuery: string): {
  pairs: [string, string][];
  signature: string | null;
} {
  const query = rawQuery.startsWith('?') ? rawQuery.slice(1) : rawQuery;
  const parts = query.split('&').filter(Boolean);
  const pairs: [string, string][] = [];
  let signature: string | null = null;
  for (const part of parts) {
    const separator = part.indexOf('=');
    const name = separator < 0 ? part : part.slice(0, separator);
    const value = separator < 0 ? '' : part.slice(separator + 1);
    if (name === 'sign') {
      signature = decodeField(value)?.trim() ?? null;
      break;
    }
    if (decodeField(value) === null) {
      return {pairs: [], signature: null};
    }
    pairs.push([name, normaliseUnreserved(value)]);
  }
  return {pairs, signature};
}

/**
 * The decoded value of a returned field, from the raw pairs. The last
 * occurrence wins: Verifone's fields come after any of ours on the same
 * address, so a name we happen to use as well never shadows theirs.
 */
export function fieldValue(
  pairs: [string, string][],
  name: string,
): string | null {
  const pair = [...pairs].reverse().find(([candidate]) => candidate === name);
  return pair ? decodeField(pair[1]) : null;
}

/**
 * The fields a Verifone gateway sent, whichever way it sent them: in the
 * query of a GET, or as a form body on a POST, which Paybox's back office can
 * be set to use for the IPN.
 */
export async function rawQueryOf(request: Request): Promise<string> {
  if (request.method === 'POST') {
    const body = await request.text();
    if (body) {
      return body;
    }
  }
  return new URL(request.url).search;
}

export const VERIFONE_SUCCESS = '00000';
export const VERIFONE_PENDING_ISSUER = '99999';
export const VERIFONE_TIMEOUT = '00030';

/** What a Verifone error code says happened to the money. */
export function eventTypeForCode(code: string | null): EventType | 'pending' {
  if (code === VERIFONE_SUCCESS) return EVENT_TYPE.captured;
  if (code === VERIFONE_PENDING_ISSUER) return 'pending';
  if (code === VERIFONE_TIMEOUT) return EVENT_TYPE.expired;
  return EVENT_TYPE.refused;
}

/** The outcome marker our return addresses carry, so a refusal and an abandon can be told apart. */
export const OUTCOME_PARAM = 'outcome';

export type ReturnOutcome = 'success' | 'wait' | 'refuse' | 'cancel';

export function withOutcome(returnUrl: string, outcome: ReturnOutcome): string {
  const url = new URL(returnUrl);
  url.searchParams.set(OUTCOME_PARAM, outcome);
  return url.toString();
}

/** The reference on a return address, for the route to show a page for when the signed fields cannot be read. */
export function withReference(returnUrl: string, reference: string): string {
  const url = new URL(returnUrl);
  url.searchParams.set('ref', reference);
  return url.toString();
}

/**
 * The event's id for what a Verifone gateway reported about one attempt. A
 * capture is the gateway's transaction number where it gives one; an attempt
 * that ended with nothing charged is the attempt and the code, so the return
 * and the IPN reporting the same ending land as one row whichever names it
 * first (a refusal and a cancellation share a key prefix), and the marker on
 * the return only picks between refused and cancelled on the row that wins.
 */
export function eventIdFor(
  type: EventType,
  attempt: string,
  transaction: string | null,
  code: string | null,
): string {
  if (type === EVENT_TYPE.captured) {
    return transaction ?? attempt;
  }
  return `${attempt}:${code ?? 'unknown'}`;
}

/*
 * How long past its expiry a Paybox or Up2Pay session waits for its IPN
 * before it is closed as "no answer". Verifone calls the IPN server to server
 * as the payer validates and does not retry a failed call — it mails the
 * merchant a warning instead (Paybox System integration manual 8.3, §5.3) —
 * so a card payment's IPN comes within minutes or not at all. Only a method
 * awaiting validation (code 99999: PayPal, Oney, iDeal through Paybox) is
 * called again, "quelques heures à quelques jours" later (§5.2). A week covers
 * those with room to spare, and a late IPN still settles the payment. Neither
 * gateway can be asked, so the recheck is never used.
 */
export const VERIFONE_RECONCILE: ReconcilePolicy = {
  timedFrom: 'expiry',
  recheckMs: 60 * 60 * 1000,
  decideAfterExpiryMs: 7 * 24 * 60 * 60 * 1000,
};
