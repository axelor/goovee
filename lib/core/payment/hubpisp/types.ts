// ---- CORE IMPORTS ---- //
import {HubPispLocalInstrument} from '@/lib/core/payment/hubpisp/constants';
import type {PaymentContextData} from '@/lib/core/payment/common/type';

export type HubPispContextData = PaymentContextData & {
  amount?: number;
  resourceId?: string;
};

export type PsuInfo = {
  name: string;
  email?: string;
};

export type PageConsentInfo = {
  pageTimeout?: number;
  pageTimeoutUnit?: 'SECONDS';
  pageUserTimeout?: number;
  pageUserTimeoutUnit?: 'SECONDS' | 'MINUTES';
  pageTimeOutReturnURL?: string;
};

export type CreatePaymentLinkParams = {
  amount: number;
  currency: string;
  description?: string;
  endToEnd?: string;
  remittanceInformation?: string;
  localInstrument?: HubPispLocalInstrument;
  expireIn?: number;
  requestedExecutionDate?: string;
  successfulReportUrl?: string;
  unsuccessfulReportUrl?: string;
  pageConsentInfo?: PageConsentInfo;
  psuInfo?: PsuInfo;
};

export type CreatePaymentLinkResult = {
  resourceId: string;
  consentHref: string;
};

export type PaymentLinkStatusResult = {
  resourceId: string;
  consentStatus: string;
  paymentRequestResourceId?: string;
  [key: string]: unknown;
};

export type PaymentRequestStatusResult = {
  transactionStatus?: string;
  creditTransferTransaction?: Array<{
    transactionStatus: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};
