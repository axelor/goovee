// ---- CORE IMPORTS ---- //
import {HubPispLocalInstrument} from '@/payment/hubpisp/constants';
import {HubPispTransferType} from '@/payment/hubpisp/types';
import {BANK_TRANSFER_STATUS} from '@/payment/stripe/constants';
import {BankAccountType} from '@/payment/stripe/types';
import {ActionResponse, ErrorResponse, SuccessResponse} from '@/types/action';
import {PaymentSource} from '@/payment/common/type';
import {PaymentUpdateStatus} from '@/payment/sse/constants';

export type PaymentSSEProps = {
  source: PaymentSource;
  entityId: string;
  onPaymentUpdate: (status: PaymentUpdateStatus) => void;
};

export type PaypalProps<TData = unknown> = {
  disabled?: boolean;
  onApprove: (result: SuccessResponse<TData>) => void;
  onValidate?: (paymentOption: string) => Promise<boolean>;
  createOrder: () => Promise<{
    order?: {id: string};
    error?: any;
    message?: string;
  }>;
  captureOrder: (orderID: string) => ActionResponse<TData>;
  onPaymentSuccess?: () => any;
  successMessage?: string;
  errorMessage?: string;
  skipSuccessToast?: boolean;
};

export type StripeProps<TData = unknown> = {
  disabled?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onValidate?: (paymentOption: string) => Promise<boolean>;
  onCreateCheckOutSession: () => Promise<{
    url?: string | null;
    error?: boolean;
    message?: string;
    client_secret?: string | null;
  }>;
  onValidateSession: (params: {
    stripeSessionId: string;
  }) => ActionResponse<TData>;
  onApprove?: (result: SuccessResponse<TData>) => void;
  onPaymentSuccess?: () => any;
  skipSuccessToast?: boolean;
  onCreateBankTransferIntent?: () => Promise<
    ErrorResponse | SuccessResponse<BankTransferIntentResult>
  >;
  sse?: PaymentSSEProps;
};

export type BankTransferIntentResult =
  | {
      status: typeof BANK_TRANSFER_STATUS.PAID;
      id: string;
      contextId: string;
    }
  | ({
      status: typeof BANK_TRANSFER_STATUS.PENDING;
    } & {
      id: string;
      contextId: string;
      amount: number;
      currency: string;
      reference: string;
      formattedAmount: string;
      bankDetails: NormalizedBankDetails;
    });

export type BankTransferDetailsType = {
  id: string;
  totalAmount: number;
  formattedTotalAmount: string;
  amount: number;
  currency: string;
  reference: string;
  formattedAmount: string;
  bankDetails: NormalizedBankDetails;
  contextId: string;
  initiatedDate: Date;
};

export type BankAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export interface NormalizedBankDetails {
  type: BankAccountType;
  accountHolderName?: string;
  bankName?: string;
  country?: string;
  // EUR (SEPA)
  iban?: string;
  swiftCode?: string;
  // USD
  routingNumber?: string;
  accountNumber?: string;
  accountType?: string;
  // Address
  bankAddress?: BankAddress;
  accountHolderAddress?: BankAddress;
}

export type PayboxProps<TData = unknown> = {
  disabled?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onValidate?: (paymentOption: string) => Promise<boolean>;
  onCreateOrder: ({uri}: {uri: string}) => Promise<any>;
  onValidatePayment: ({
    params,
  }: {
    params: Record<string, string>;
  }) => ActionResponse<TData>;
  onPaymentSuccess?: () => void;
  onApprove: (result: SuccessResponse<TData>) => void;
  skipSuccessToast?: boolean;
};

export type Up2payProps = {
  disabled?: boolean;
  errorMessage?: string;
  cancelMessage?: string;
  onValidate?: (paymentOption: string) => Promise<boolean>;
  onCreateOrder: ({uri}: {uri: string}) => Promise<any>;
  sse?: PaymentSSEProps;
};

export type HubPispProps = {
  disabled?: boolean;
  errorMessage?: string;
  cancelMessage?: string;
  onValidate?: (paymentOption: string) => Promise<boolean>;
  onCreateOrder: ({
    uri,
    localInstrument,
  }: {
    uri: string;
    localInstrument?: HubPispLocalInstrument;
  }) => Promise<any>;
  sse?: PaymentSSEProps;
  transferTypes?: HubPispTransferType[];
};
