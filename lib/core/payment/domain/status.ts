import {
  EVENT_TYPE,
  PAYMENT_STATUS,
  SESSION_STATUS,
  type EventType,
  type PaymentStatus,
  type SessionStatus,
} from './types';

export type LedgerEntry = {
  type: EventType;
  amount: number;
  /** False for an event recorded in a currency other than the payment's. */
  countable: boolean;
  /** The session the event belongs to; null for an event no session claims. */
  sessionId: string | null;
  /** Names the event when no session does. */
  eventKey: string;
};

export type DerivedStatus = {
  status: PaymentStatus;
  capturedAmount: number;
};

/**
 * The money state of a payment, derived from its ledger and never stored
 * anywhere else first.
 *
 * Captures sum; a partial funding and its remainder add up to the amount due.
 * With nothing captured the payment is where its latest session left it:
 * refused, cancelled and expired are session outcomes, which is what lets a
 * buyer try again on the same payment.
 */
export function deriveStatus({
  amount,
  ledger,
  latestSessionStatus,
}: {
  amount: number;
  ledger: LedgerEntry[];
  latestSessionStatus: SessionStatus | null;
}): DerivedStatus {
  /* Within one session a provider reports the money it holds so far: a
   * partial funding says how much has arrived, the capture that follows says
   * the whole amount. Those are snapshots of one balance and the highest one
   * is the truth, which is also what makes a redelivered or late-arriving
   * event harmless: it can never add to what an earlier snapshot already
   * said. Across sessions the balances add up, so a payment split over two
   * providers still reaches its amount. */
  const capturedBySession = new Map<string, number>();
  /* A session that ended cancelled or expired while funded in part kept none
   * of it: a Stripe bank transfer holds a partial funding on the intent, off
   * the account's balance, and hands it back to the payer when it ends. */
  const endedSessions = new Set(
    ledger.flatMap(entry =>
      entry.sessionId &&
      (entry.type === EVENT_TYPE.cancelled || entry.type === EVENT_TYPE.expired)
        ? [entry.sessionId]
        : [],
    ),
  );

  for (const entry of ledger) {
    if (
      !entry.countable ||
      (entry.type !== EVENT_TYPE.captured &&
        entry.type !== EVENT_TYPE.partiallyCaptured) ||
      (entry.type === EVENT_TYPE.partiallyCaptured &&
        entry.sessionId !== null &&
        endedSessions.has(entry.sessionId))
    ) {
      continue;
    }
    const key = entry.sessionId ?? `event:${entry.eventKey}`;
    capturedBySession.set(
      key,
      Math.max(capturedBySession.get(key) ?? 0, entry.amount),
    );
  }

  let capturedAmount = 0;
  for (const captured of capturedBySession.values()) {
    capturedAmount += captured;
  }

  if (capturedAmount >= amount && amount > 0) {
    return {status: PAYMENT_STATUS.captured, capturedAmount};
  }
  if (capturedAmount > 0) {
    return {status: PAYMENT_STATUS.partiallyCaptured, capturedAmount};
  }

  return {
    status: statusFromSession(latestSessionStatus),
    capturedAmount,
  };
}

function statusFromSession(status: SessionStatus | null): PaymentStatus {
  switch (status) {
    case SESSION_STATUS.awaiting:
      return PAYMENT_STATUS.awaiting;
    case SESSION_STATUS.refused:
      return PAYMENT_STATUS.refused;
    case SESSION_STATUS.cancelled:
      return PAYMENT_STATUS.cancelled;
    case SESSION_STATUS.expired:
      return PAYMENT_STATUS.expired;
    case SESSION_STATUS.unconfirmed:
      return PAYMENT_STATUS.unconfirmed;
    case SESSION_STATUS.captured:
      /* A captured session with nothing countable in the ledger is a capture in
       * another currency; the payment stays where the session found it. */
      return PAYMENT_STATUS.awaiting;
    default:
      return PAYMENT_STATUS.initiated;
  }
}

/** What a settled event does to the session that produced it. */
export function sessionStatusFor(type: EventType): SessionStatus | null {
  switch (type) {
    case EVENT_TYPE.captured:
      return SESSION_STATUS.captured;
    case EVENT_TYPE.refused:
      return SESSION_STATUS.refused;
    case EVENT_TYPE.cancelled:
      return SESSION_STATUS.cancelled;
    case EVENT_TYPE.expired:
      return SESSION_STATUS.expired;
    default:
      return null;
  }
}

/**
 * What was captured beyond the amount due, in the payment's minor units: two
 * sessions of one payment that both took the money. The status still reads
 * captured, because the amount due was received; the excess is a person's to
 * give back at the provider and to resolve in the ERP.
 */
export function overCapturedBy(capturedAmount: number, amount: number): number {
  return Math.max(capturedAmount - amount, 0);
}

/**
 * A payment in one of these states can be retried on a new session. One with
 * no answer is, like one still awaiting: the earlier session's notification
 * still settles it should it come.
 */
export function canRetry(status: PaymentStatus): boolean {
  return (
    status === PAYMENT_STATUS.initiated ||
    status === PAYMENT_STATUS.awaiting ||
    status === PAYMENT_STATUS.refused ||
    status === PAYMENT_STATUS.cancelled ||
    status === PAYMENT_STATUS.expired ||
    status === PAYMENT_STATUS.unconfirmed
  );
}

/** Nothing more will happen to the money without a new provider event. */
export function isTerminal(status: PaymentStatus): boolean {
  return (
    status !== PAYMENT_STATUS.initiated && status !== PAYMENT_STATUS.awaiting
  );
}
