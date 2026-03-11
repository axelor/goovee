'use client';

// ---- CORE IMPPRTS ---- //
import {ID, PaymentOption, PortalWorkspace} from '@/types';
import {ErrorResponse, SuccessResponse} from '@/types/action';
import {Paybox, Paypal, Stripe, Up2pay} from '@/ui/components/payment';
import {isPaymentOptionAvailable} from '@/utils/payment';

export function Payments({
  workspace,
  disabled,
  onValidate,
  onPaypalCreatedOrder,
  onPaypalCaptureOrder,
  onApprove,
  onStripeCreateCheckOutSession,
  onStripeValidateSession,
  onPaymentSuccess,
  onPayboxCreateOrder,
  onPayboxValidatePayment,
  onUp2payCreateOrder,
  successMessage = '',
  errorMessage = '',
  skipSuccessToast,
  onCreateBankTransferIntent,
}: {
  workspace: PortalWorkspace;
  disabled?: boolean;
  onValidate: (paymentOption?: PaymentOption) => Promise<boolean>;
  onPaypalCreatedOrder: (data: any, actions: any) => Promise<any>;
  onPaypalCaptureOrder: (orderID: string) => Promise<any>;
  onApprove: (result: any) => Promise<void>;
  onStripeCreateCheckOutSession: () => Promise<any>;
  onStripeValidateSession: (params: {
    stripeSessionId: string;
  }) => Promise<ErrorResponse | SuccessResponse<{id: ID; version: number}>>;
  onPaymentSuccess?: () => Promise<void> | void;
  onPayboxCreateOrder: ({uri}: {uri: string}) => Promise<any>;
  onPayboxValidatePayment: (params: {
    params: any;
  }) => Promise<ErrorResponse | SuccessResponse<{id: ID; version: number}>>;
  onUp2payCreateOrder?: ({uri}: {uri: string}) => Promise<any>;
  successMessage?: string;
  errorMessage?: string;
  skipSuccessToast?: boolean;
  onCreateBankTransferIntent?: () => Promise<any>;
}) {
  const config = workspace?.config;
  const allowOnlinePayment = config?.allowOnlinePaymentForEcommerce;
  const paymentOptionSet = config?.paymentOptionSet;

  const allowStripe = isPaymentOptionAvailable(
    paymentOptionSet,
    PaymentOption.stripe,
  );

  const allowPaypal = isPaymentOptionAvailable(
    paymentOptionSet,
    PaymentOption.paypal,
  );

  const allowPaybox = isPaymentOptionAvailable(
    paymentOptionSet,
    PaymentOption.paybox,
  );

  const allowUp2pay = isPaymentOptionAvailable(
    paymentOptionSet,
    PaymentOption.up2pay,
  );

  if (!allowOnlinePayment) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {allowPaypal && (
        <Paypal
          disabled={disabled}
          onValidate={() => onValidate()}
          createOrder={onPaypalCreatedOrder}
          captureOrder={onPaypalCaptureOrder}
          onApprove={onApprove}
          successMessage={successMessage}
          errorMessage={errorMessage}
          onPaymentSuccess={onPaymentSuccess}
          skipSuccessToast={skipSuccessToast}
        />
      )}
      {allowStripe && (
        <Stripe
          disabled={disabled}
          onValidate={() => onValidate(PaymentOption.stripe)}
          onCreateCheckOutSession={onStripeCreateCheckOutSession}
          onValidateSession={stripeSessionId =>
            onStripeValidateSession(stripeSessionId)
          }
          onPaymentSuccess={onPaymentSuccess}
          onApprove={onApprove}
          successMessage={successMessage}
          errorMessage={errorMessage}
          skipSuccessToast={skipSuccessToast}
          onCreateBankTransferIntent={onCreateBankTransferIntent}
        />
      )}
      {allowPaybox && (
        <Paybox
          disabled={disabled}
          onValidate={() => onValidate(PaymentOption.paybox)}
          onCreateOrder={onPayboxCreateOrder}
          onValidatePayment={onPayboxValidatePayment}
          onPaymentSuccess={onPaymentSuccess}
          onApprove={onApprove}
          successMessage={successMessage}
          errorMessage={errorMessage}
          skipSuccessToast={skipSuccessToast}
        />
      )}
      {allowUp2pay && onUp2payCreateOrder && (
        <Up2pay
          disabled={disabled}
          onValidate={() => onValidate(PaymentOption.up2pay)}
          onCreateOrder={onUp2payCreateOrder}
          errorMessage={errorMessage}
        />
      )}
    </div>
  );
}

export default Payments;
