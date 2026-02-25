// ---- CORE IMPORTS ---- //
import {BankAccountType} from '@/lib/core/payment/stripe/utils';
import {ErrorResponse, SuccessResponse} from '@/types/action';

export type PaypalProps = {
  disabled?: boolean;
  onApprove: (result: any) => void;
  onValidate?: (paymentOption: string) => Promise<boolean>;
  createOrder: (
    data: any,
    actions: any,
  ) => Promise<{
    order?: {id: string};
    error?: any;
    message?: string;
  }>;
  captureOrder: (orderID: string) => Promise<any>;
  onPaymentSuccess?: () => any;
  successMessage?: string;
  errorMessage?: string;
  skipSuccessToast?: boolean;
};

export type StripeProps = {
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
  onValidateSession: (params: {stripeSessionId: string}) => Promise<any>;
  onApprove?: (result: any) => void;
  onPaymentSuccess?: () => any;
  skipSuccessToast?: boolean;
  onCreateBankTransferIntent?: () => Promise<
    ErrorResponse | SuccessResponse<BankTransferDetailsType>
  >;
};

export type BankTransferDetailsType = {
  id: string;
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

export type PayboxProps = {
  disabled?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onValidate?: (paymentOption: string) => Promise<boolean>;
  onCreateOrder: ({uri}: {uri: string}) => Promise<any>;
  onValidatePayment: ({
    params,
  }: {
    params: Record<string, string>;
  }) => Promise<any>;
  onPaymentSuccess?: () => void;
  onApprove: (result: any) => void;
  skipSuccessToast?: boolean;
};

export type Up2payProps = {
  disabled?: boolean;
  successMessage?: string;
  errorMessage?: string;
  cancelMessage?: string;
  onValidate?: (paymentOption: string) => Promise<boolean>;
  onCreateOrder: ({uri}: {uri: string}) => Promise<any>;
  skipSuccessToast?: boolean;
};
