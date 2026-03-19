// ---- CORE IMPORTS ---- //
import {
  HUBPISP_CONSENT_STATUS,
  HubPispLocalInstrument,
  HubPispConsentStatus,
} from '@/lib/core/payment/hubpisp/constants';
import type {PaymentContextData} from '@/lib/core/payment/common/type';

export type HubPispContextData = PaymentContextData & {
  amount?: number;
  resourceId?: string;
  localInstrument?: HubPispLocalInstrument;
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

export type PaymentLinkStatusPsuInfo = {
  country: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  number: string | null;
  street: string | null;
  complement: string | null;
  city: string | null;
  zip: string | null;
};

export type PaymentLinkStatusPaymentDetails = {
  amount: number;
  consentInfo?: {
    expireIn: number;
    unit: string;
  };
  currency: string;
  description: string | null;
  endToEnd?: string;
  localInstrument?: HubPispLocalInstrument;
  psuInfo?: PaymentLinkStatusPsuInfo;
  remittanceInformation?: string;
  successfulReportUrl?: string;
  unsuccessfulReportUrl?: string;
};

export type PaymentLinkStatusResult = {
  resourceId: string;
  createdAt?: string;
  expireAt?: string;
  executedAt?: string;
  processedAt?: string;
  consentStatus: HubPispConsentStatus;
  paymentRequestResourceId?: string;
  client?: {
    name: string;
  };
  paymentDetails?: PaymentLinkStatusPaymentDetails;
};

export type GetPaymentLinkStatusResult =
  | {
      consentStatus: (typeof HUBPISP_CONSENT_STATUS)['PROCESSED'];
      data: PaymentLinkStatusResult;
    }
  | {consentStatus: (typeof HUBPISP_CONSENT_STATUS)['EXPIRED']}
  | {
      consentStatus:
        | (typeof HUBPISP_CONSENT_STATUS)['PENDING']
        | (typeof HUBPISP_CONSENT_STATUS)['EXECUTED'];
    };

export type PaymentRequestStatusResult = {
  transactionStatus?: string;
  creditTransferTransaction?: Array<{
    transactionStatus: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};
