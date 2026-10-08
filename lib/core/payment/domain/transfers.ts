import {GATEWAY, type Gateway} from './types';

/**
 * How long the payer has to complete a Stripe bank transfer, from its start.
 * At its end the transfer is cancelled, whatever part of it arrived, and money
 * applied to it goes back to the payer's Stripe cash balance.
 */
export const BANK_TRANSFER_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * How long past its deadline a session is still asked about. A provider that
 * has given no final word by then is not waited on any longer: the session is
 * closed as no answer, for finance to look up.
 */
export const RECONCILE_GIVE_UP_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

/** When a bank transfer started at `startedOn` is cancelled if still open. */
export function transferDeadline(startedOn: Date): Date {
  return new Date(startedOn.getTime() + BANK_TRANSFER_WINDOW_MS);
}

/** Gateways whose payer wires the money later, against instructions. */
export const TRANSFER_GATEWAYS: readonly Gateway[] = [
  GATEWAY.stripeBankTransfer,
  GATEWAY.hubpisp,
];

/**
 * What the invoice guard asks of each open, unfunded transfer once money has
 * landed on the invoice. With nothing left to pay, every one of them would pay
 * it twice. With something still owed, only a transfer asking for more than
 * that would overpay it; one asking for no more is still a way to settle the
 * rest.
 *
 * The comparison is made on what each session asked for, as the ledger keeps
 * it; the provider's own figure for the transfer is checked again before
 * anything is withdrawn.
 */
export type WithdrawalRequest =
  | {reason: 'duplicate'}
  /** The window is over: withdrawn whatever part of it arrived. */
  | {reason: 'abandoned'}
  /** Without a limit, the payer asked, and the transfer goes whatever it asks for. */
  | {reason: 'requested_by_customer'; keepIfAtMost?: number};

export function withdrawalRequest(
  /** What the invoice still needs, in its minor units. */
  remaining: number,
): WithdrawalRequest {
  return remaining <= 0
    ? {reason: 'duplicate'}
    : {reason: 'requested_by_customer', keepIfAtMost: remaining};
}

/** Whether a transfer asking `requested` is withdrawn under the request. */
export function isWithdrawn(
  request: WithdrawalRequest,
  requested: number,
): boolean {
  return (
    request.reason !== 'requested_by_customer' ||
    request.keepIfAtMost === undefined ||
    requested > request.keepIfAtMost
  );
}
