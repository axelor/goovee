// ---- CORE IMPORTS ---- //
import {PaymentOption} from '@/types';
import {ContextStatus} from '@/payment/common/orm';

export type PaymentOrder = {
  amount: number;
  context: PaymentContext;
  cancelled?: boolean;
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
};
