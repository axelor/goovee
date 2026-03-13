'use client';

// ---- CORE IMPPRTS ---- //
import {ID, PaymentOption, PortalWorkspace} from '@/types';
import {ErrorResponse, SuccessResponse} from '@/types/action';
import {Paybox, Paypal, Stripe, Up2pay, HubPISP} from '@/ui/components/payment';
import {isPaymentOptionAvailable} from '@/utils/payment';
import type {PaymentSSEProps} from '@/ui/components/payment/types';

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
  onInitiatePispPayment,
  successMessage = '',
  errorMessage = '',
  skipSuccessToast,
  onCreateBankTransferIntent,
  sse,
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
  onInitiatePispPayment?: ({
    uri,
    localInstrument,
  }: {
    uri: string;
    localInstrument?: import('@/payment/hubpisp/constants').HubPispLocalInstrument;
  }) => Promise<any>;
  successMessage?: string;
  errorMessage?: string;
  skipSuccessToast?: boolean;
  onCreateBankTransferIntent?: () => Promise<any>;
  sse?: PaymentSSEProps;
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

  const allowHubPisp = isPaymentOptionAvailable(
    paymentOptionSet,
    PaymentOption.hubpisp,
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
          sse={sse}
        />
      )}
      {allowHubPisp && onInitiatePispPayment && (
        <HubPISP
          disabled={disabled}
          onValidate={() => onValidate(PaymentOption.hubpisp)}
          onCreateOrder={onInitiatePispPayment}
          errorMessage={errorMessage}
          sse={sse}
        />
      )}
    </div>
  );
}

export default Payments;
