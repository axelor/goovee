export const PAYMENT_SOURCE = {
  invoices: 'invoices',
  events: 'events',
  marketplace: 'marketplace',
  shop: 'shop',
} as const;

export type PaymentSource =
  (typeof PAYMENT_SOURCE)[keyof typeof PAYMENT_SOURCE];

export const GATEWAY = {
  stripeCard: 'stripe_card',
  stripeBankTransfer: 'stripe_bank_transfer',
  paypal: 'paypal',
  paybox: 'paybox',
  up2pay: 'up2pay',
  hubpisp: 'hubpisp',
} as const;

export type Gateway = (typeof GATEWAY)[keyof typeof GATEWAY];

/* Describes the money and nothing else. Whether the ERP has caught up is the
 * task queue's business. */
export const PAYMENT_STATUS = {
  initiated: 'initiated',
  awaiting: 'awaiting',
  captured: 'captured',
  partiallyCaptured: 'partially_captured',
  refused: 'refused',
  cancelled: 'cancelled',
  expired: 'expired',
  /**
   * No answer from a provider that cannot be asked, long past the time it
   * would have sent one. Not expired and not cancelled: we do not know that it
   * was not paid, and a late notification still settles it.
   */
  unconfirmed: 'unconfirmed',
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const SESSION_STATUS = {
  initiated: 'initiated',
  awaiting: 'awaiting',
  captured: 'captured',
  refused: 'refused',
  cancelled: 'cancelled',
  expired: 'expired',
  /** Closed by us for want of an answer; the provider's own word still replaces it. */
  unconfirmed: 'unconfirmed',
} as const;

export type SessionStatus =
  (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const EVENT_TYPE = {
  authorised: 'authorised',
  captured: 'captured',
  partiallyCaptured: 'partially_captured',
  refused: 'refused',
  cancelled: 'cancelled',
  expired: 'expired',
} as const;

export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

export const RECEIVED_VIA = {
  return: 'return',
  webhook: 'webhook',
  reconcile: 'reconcile',
  admin: 'admin',
} as const;

export type ReceivedVia = (typeof RECEIVED_VIA)[keyof typeof RECEIVED_VIA];

/* The keys name what a task does; the values are the stored codes. */
export const TASK_KIND = {
  register: 'project',
  notify: 'notify',
  reconcile: 'reconcile',
  /** After money lands on an invoice, withdraw the transfers it no longer needs. */
  cancelTransfers: 'cancel_transfers',
  /** Turn what a person entered by hand in the ERP into ledger events. */
  applyManualEntries: 'apply_recorded',
  /**
   * More was captured than the payment was for. Not run by anyone: it is
   * written already parked for a decision, so the payment is listed under
   * Payments to resolve until a person resolves it in the ERP.
   */
  overCaptured: 'over_captured',
} as const;

export type TaskKind = (typeof TASK_KIND)[keyof typeof TASK_KIND];

export const FULFILMENT_STATUS = {
  pending: 'pending',
  delivered: 'delivered',
  undeliverable: 'undeliverable',
  /** A person settled an undeliverable purchase outside the portal and said why, in the ERP. */
  resolved: 'resolved',
} as const;

export type FulfilmentStatus =
  (typeof FULFILMENT_STATUS)[keyof typeof FULFILMENT_STATUS];

/** An amount in integer minor units of its currency: 1050 for EUR 10.50. */
export type Money = {
  amount: number;
  currencyCode: string;
  currencyScale: number;
};
