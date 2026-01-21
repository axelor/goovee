// ---- CORE IMPORTS ---- //
import {PaymentOption} from '@/types';
import {ContextStatus} from '@/lib/core/payment/common/orm';

export type PaymentOrder = {
  amount: number;
  context: PaymentContext;
};

export const PAYMENT_TYPE = {
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
} as const;

export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

export const PAYMENT_SOURCE = {
  INVOICES: 'invoices',
  SHOP: 'shop',
  EVENTS: 'events',
} as const;

export type PaymentSource =
  (typeof PAYMENT_SOURCE)[keyof typeof PAYMENT_SOURCE];

export type PaymentContextData = {
  id: string | number;
  paymentType?: PaymentType;
  paymentIntent?: string;
  source?: PaymentSource;
};

export type PaymentContext = {
  id: string;
  version: number;
  data: any;
  mode: PaymentOption;
  status: ContextStatus;
};
