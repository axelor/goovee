// ---- CORE IMPORTS ---- //
import {PaymentOption} from '@/types';
import {ContextStatus} from '@/lib/core/payment/common/orm';

export type PaymentOrder = {
  amount: number;
  context: PaymentContext;
  cancelled?: boolean;
  /**
   * Provider-side id of the captured payment (Stripe PaymentIntent, PayPal
   * capture, Paybox transaction) — the key an admin pastes into the provider
   * dashboard to find or refund the charge.
   */
  providerTransactionRef?: string | null;
};

export const PAYMENT_TYPE = {
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
} as const;

export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

export enum PAYMENT_SOURCE {
  INVOICES = 'invoices',
  SHOP = 'shop',
  EVENTS = 'events',
}

export type PaymentSource = PAYMENT_SOURCE;

export type PaymentContextData = {
  /**
   * Id of the entity the payment pays for — invoices: invoice id, shop: sale
   * order id, events: registration id. Present from creation for invoices;
   * written mid-saga once shop/events create theirs.
   */
  id?: string;
  paymentType?: PaymentType;
  paymentIntent?: string;
  source?: PaymentSource;
  /** Requested amount, stored for the saga failure queues and admin review. */
  amount?: number;
  /**
   * Amount that would have settled the entity when this payment started —
   * shop: cart total, invoices: remaining to pay (partial payments stack, so
   * the invoice total would make a full payment of the remainder look
   * partial). Frozen for the failure incidents: `amount` may be a legitimate
   * partial payment, and the admin reviewing an incident needs to see paid vs
   * due without goovee. Absent for events (paid is by definition the due).
   */
  amountDue?: number;
  paymentModeId?: string;
  /** ISO code of the paid currency, shown on failure incidents. */
  currencyCode?: string;
  /**
   * Provider-side id of the captured payment, merged in by completePayment()
   * at claim time so failure incidents carry the refund key.
   */
  providerTransactionRef?: string;
  /**
   * Events only: PartnerPortalWorkspace id snapshotted at context creation —
   * the ERP's "Create invoice" fix action needs it to replay the invoice.
   */
  partnerWorkspaceId?: string;
};

export type PaymentContext = {
  id: string;
  version: number;
  data: any;
  mode: PaymentOption;
  status: ContextStatus;
  payer?: string | null;
};
