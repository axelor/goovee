import {createHash} from 'node:crypto';

import type {Subject} from './subject';
import type {Money} from './types';

/** What a press asks to buy, as the server priced it: the parts that make one purchase. */
export type PricedIntent = {
  source: string;
  money: Money;
  subject: Subject | null;
  snapshot: unknown;
};

/* JSON with object keys in a fixed order, so two equal intents always give
 * the same text whatever order their keys were built in. A value with its
 * own JSON form, a BigDecimal or a Date, is keyed by that form; any other
 * class instance is refused rather than keyed as an empty object, which
 * would leave its contents out of the key. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const json = (value as {toJSON?: unknown}).toJSON;
    if (typeof json === 'function') {
      return canonical(json.call(value));
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error('A purchase can only be keyed on plain data');
    }
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * The key a payment is found again by: the page's checkout token and the
 * priced intent together. A second press of the same purchase — a double
 * click, another tab, a retry after a refusal — gives the same key and finds
 * the same payment. A press of anything else — another amount, another cart,
 * other participants, a price that moved — gives another key and is another
 * payment, so a payment's amount is never rewritten under a session still
 * open at a provider.
 */
export function purchaseKey(
  checkoutToken: string,
  intent: PricedIntent,
): string {
  const digest = createHash('sha256')
    .update(
      canonical({
        source: intent.source,
        currencyCode: intent.money.currencyCode.toUpperCase(),
        currencyScale: intent.money.currencyScale,
        amount: intent.money.amount,
        subject: intent.subject,
        snapshot: intent.snapshot,
      }),
    )
    .digest('hex');
  return `${checkoutToken}:${digest}`;
}
