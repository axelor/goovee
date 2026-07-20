// ---- CORE IMPORTS ---- //
import {PaymentOption} from '@/types';
import {ContextStatus} from '@/lib/core/payment/common/orm';

export type PaymentOrder = {
  amount: number;
  context: PaymentContext;
  cancelled?: boolean;
  /** Provider's transaction identifier for this payment (intent / capture / transaction id). */
  reference?: string;
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
  id: string;
  paymentType?: PaymentType;
  paymentIntent?: string;
  source?: PaymentSource;
  paymentModeId?: string;
};

export type PaymentContext = {
  id: string;
  version: number;
  data: any;
  mode: PaymentOption;
  status: ContextStatus;
  payer?: string | null;
  /**
   * Provider's transaction identifier for this payment, stored on its own
   * column (not in `data`) so a paid order/invoice can be reconciled to the
   * provider transaction later. Set once, never overwritten.
   */
  providerTransactionRef?: string | null;
};
