import {
  EVENT_TYPE,
  type EventType,
  type Gateway,
  type ReceivedVia,
} from './types';

/**
 * How a provider callback names the payment it is about. Always a value we
 * already hold: our reference where the provider echoes it, the session
 * reference where it does not.
 */
export type SignalResolution =
  | {by: 'reference'; reference: string}
  | {by: 'sessionRef'; sessionRef: string};

/**
 * What a provider told us, in one vocabulary for every provider and both legs.
 *
 * `parseReturn` and `parseNotification` produce the same shape, and one settle
 * function consumes it, so no leg is authoritative: the ledger's unique key on
 * `(gateway, eventKey)` decides which observation of a financial event does the
 * work. An adapter names the event by the provider's own id; the key is made
 * from the id and the type by one rule, `eventKeyOf`, for every provider.
 *
 * A `pending` signal is "not yet": the provider was asked and the money has not
 * moved. It records nothing and never invents a failure from an absence.
 */
export type GatewaySignal = {
  gateway: Gateway;
  resolution: SignalResolution;
  type: EventType | 'pending';
  /**
   * The provider's own id for the event, identical whichever leg observed it:
   * the payment intent a capture is of. Where one provider id names several
   * events of the same kind, the adapter makes it compound (an attempt and the
   * code it ended with). Null only for a pending signal.
   */
  eventId: string | null;
  /** Minor units as the provider reports them. Null when the event carries no amount. */
  amount: number | null;
  currencyCode: string | null;
  /** The provider's reference for the event: a charge, a Paybox transaction number. */
  providerRef: string | null;
  /** The provider's handle for the session, where the signal carries one. */
  sessionRef: string | null;
  /** The provider's reason on a refusal. */
  reason: string | null;
  receivedVia: ReceivedVia;
  receivedOn: Date;
  /** The signal's source material, kept for support. Must be JSON-serialisable. */
  payload: unknown;
};

export function pendingSignal(input: {
  gateway: Gateway;
  resolution: SignalResolution;
  sessionRef?: string | null;
  receivedVia: ReceivedVia;
  payload: unknown;
}): GatewaySignal {
  return {
    gateway: input.gateway,
    resolution: input.resolution,
    type: 'pending',
    eventId: null,
    amount: null,
    currencyCode: null,
    providerRef: null,
    sessionRef: input.sessionRef ?? null,
    reason: null,
    receivedVia: input.receivedVia,
    receivedOn: new Date(),
    payload: input.payload,
  };
}

/*
 * The prefix of each type's key. A refusal and a cancellation share one: they
 * are both the end of an attempt, which ends once, and a provider may report
 * the same ending as either on different legs (a Paybox return says refused
 * where its IPN says cancelled), so the two must land as one row. Adding an
 * event type means adding its prefix here and in the ERP's
 * PortalPaymentEventKeys, which keys events entered by hand the same way.
 */
const KEY_PREFIX: Record<EventType, string> = {
  [EVENT_TYPE.authorised]: 'authorise',
  [EVENT_TYPE.captured]: 'capture',
  [EVENT_TYPE.partiallyCaptured]: 'partial',
  [EVENT_TYPE.refused]: 'ended',
  [EVENT_TYPE.cancelled]: 'ended',
  [EVENT_TYPE.expired]: 'expire',
};

/** The ledger's key for an event: its type's prefix and the provider's id. */
export function eventKeyOf(type: EventType, eventId: string): string {
  return `${KEY_PREFIX[type]}:${eventId}`;
}

/** The provider's id back out of a key made by `eventKeyOf`; a key made otherwise is its own id. */
export function eventIdOf(type: EventType, eventKey: string): string {
  const prefix = `${KEY_PREFIX[type]}:`;
  return eventKey.startsWith(prefix) ? eventKey.slice(prefix.length) : eventKey;
}
