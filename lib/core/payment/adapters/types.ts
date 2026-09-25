import type {TenantConfig} from '@/tenant';
import type {GatewaySignal} from '../domain/signal';
import type {WithdrawalRequest} from '../domain/transfers';
import type {Gateway, Money} from '../domain/types';

/**
 * The provider says it holds no such session any more, as PayPal does for an
 * order nobody approved in time. Not an expiry and not a cancellation: it
 * says nothing about the money, so the session is closed as "no answer" for
 * finance to check. Thrown by `fetchStatus` only for that exact answer; any
 * other failure is an ordinary error, retried.
 */
export class SessionNotFoundError extends Error {
  override name = 'SessionNotFoundError';
}

export type GatewayCapabilities = {
  /**
   * Can we ask the provider what became of a session? The reconcile task asks
   * a queryable one; one that is not is closed as "no answer" once its
   * deadline passes, for finance to check.
   */
  queryable: boolean;
  /** May the browser leg settle, for speed? Turning it off must change nothing but latency. */
  settlesOnReturn: boolean;
  /**
   * Can creating the session move money before the payer does anything, as
   * confirming a Stripe bank transfer applies a customer's cash balance at
   * once? A start of one whose handoff never came back is closed as "no
   * answer" past its deadline with a reason saying so, for finance to look up
   * at the provider.
   */
  chargesOnStart: boolean;
};

/**
 * When the reconcile task looks at a session of this provider, and its
 * deadline. Past the deadline a session is asked daily and listed under
 * Pending tasks as overdue, until its provider answers or a month has gone
 * by.
 * Most sessions are payable until an expiry, and timed from it; a transfer
 * the payer sends at leisure has no expiry, and is timed from its start.
 */
export type ReconcilePolicy =
  | {
      timedFrom: 'expiry';
      /** How long before a provider that still says pending is asked again. */
      recheckMs: number;
      /** Past the session's expiry, how long before its deadline. */
      decideAfterExpiryMs: number;
    }
  | {
      timedFrom: 'start';
      recheckMs: number;
      /** After the start, when it is first looked at. */
      firstCheckAfterMs: number;
      /** After the start, how long before its deadline. */
      decideAfterMs: number;
    };

/** What the button does after the server created the session. */
export type Handoff =
  | {kind: 'redirect'; url: string}
  | {kind: 'form-post'; url: string; fields: Record<string, string>}
  /** The provider's in-page SDK approves the order; the button then sends the browser to `completeUrl` with the order id appended as `token`. */
  | {kind: 'sdk'; orderId: string; completeUrl: string};

export type GatewayContext = {
  tenantId: string;
  config: TenantConfig;
};

/** What some providers want to know about the payer's billing address. */
export type BillingDetails = {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  zipCode?: string;
  city?: string;
  /** ISO 3166-1 numeric. */
  countryCode?: string;
};

export type SessionInput = {
  reference: string;
  /** Random per session. Sent to providers that take a key of their own. */
  idempotencyKey: string;
  money: Money;
  payer: string;
  /** What the buyer sees on the provider's page. */
  label: string;
  /** Absolute address of the return route for this gateway. */
  returnUrl: string;
  billing?: BillingDetails;
  /** A variant the gateway offers and the buyer chose, such as an instant or a standard transfer. */
  option?: string;
};

/** What a payer still has to do for a payment that is awaiting their bank. */
export type AwaitingInstructions = {
  /** The reference the payer must quote with the transfer. */
  reference?: string;
  /** Decimal string of what is still expected, in the payment's currency. */
  amountRemaining?: string;
  accountHolder?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  routingNumber?: string;
  accountNumber?: string;
};

export type CreatedSession = {
  handoff: Handoff;
  /** The provider's handle for the session, null where the provider only echoes our reference. */
  sessionRef: string | null;
  /** When the handoff stops being payable. Null where the provider sets no limit. */
  expiresOn: Date | null;
};

/**
 * One provider, behind one interface. Adapters are server-only and nothing
 * outside the payment module imports them.
 *
 * Both legs produce the same {@link GatewaySignal}, carrying the provider's
 * id for the event, which is what makes the two legs land as one row.
 */
export interface GatewayAdapter {
  readonly gateway: Gateway;
  readonly capabilities: GatewayCapabilities;
  readonly reconcile: ReconcilePolicy;

  /** Whether the tenant's configuration lets this gateway be offered. */
  isConfigured(config: TenantConfig): boolean;

  createSession(
    input: SessionInput,
    context: GatewayContext,
  ): Promise<CreatedSession>;

  /**
   * Reads the browser's return and turns it into a provider-attested signal:
   * verifies the provider's signature or retrieves the session from the
   * provider. The browser supplies a pointer, never a fact.
   */
  parseReturn(
    request: Request,
    context: GatewayContext,
  ): Promise<GatewaySignal>;

  /**
   * Reads a server-to-server notification. May itself call the provider to
   * learn the rest, as HUB PISP's webhook requires. Returns every financial
   * event the notification carries, which may be none.
   */
  parseNotification(
    request: Request,
    context: GatewayContext,
  ): Promise<GatewaySignal[]>;

  /** Asks the provider about a session. Only for `queryable` gateways. */
  fetchStatus(
    sessionRef: string,
    context: GatewayContext,
  ): Promise<GatewaySignal>;

  /**
   * What the payer still has to do while the payment awaits their bank: the
   * account to transfer to and the reference to quote. Only for gateways
   * whose handoff is an instruction rather than a page of the provider's.
   */
  describeAwaiting?(
    sessionRef: string,
    context: GatewayContext,
  ): Promise<AwaitingInstructions | null>;

  /**
   * Withdraws a session the payer has not funded yet, so money sent later is
   * no longer taken for it. Only for gateways that can take it back; the
   * others have nothing to cancel, or cannot be asked to.
   *
   * Never withdraws a session that has received any money, in part or in
   * full, unless the request says its window is over (`abandoned`): then one
   * funded in part goes too, the provider handing that part back to the
   * payer. One paid in full is never withdrawn and is left for the provider's
   * own event to settle.
   */
  cancelAwaiting?(
    sessionRef: string,
    request: WithdrawalRequest,
    context: GatewayContext,
  ): Promise<CancelResult>;
}

/** Why a session is withdrawn: the invoice no longer needs it, or the payer asked. */
export type CancelReason = WithdrawalRequest['reason'];

/**
 * What became of a withdrawal. Every outcome carries the provider's own
 * account of the session, to be settled like any other signal: that is what
 * records a cancellation, and what records money that arrived first. `kept`
 * is a transfer asking for no more than the request allows.
 */
export type CancelResult =
  | {outcome: 'cancelled'; signal: GatewaySignal}
  | {outcome: 'already-ended'; signal: GatewaySignal}
  | {outcome: 'funded'; signal: GatewaySignal}
  | {outcome: 'kept'; signal: GatewaySignal};
