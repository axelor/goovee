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
};

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
