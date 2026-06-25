'use client';

// ---- CORE IMPPRTS ---- //
import {PaymentOption} from '@/types';
import type {Cloned} from '@/types/util';
import {PortalAppConfig} from '@/orm/workspace';
import {ActionResponse, SuccessResponse} from '@/types/action';
import {Paybox, Paypal, Stripe, Up2pay, HubPISP} from '@/ui/components/payment';
import {isPaymentOptionAvailable} from '@/utils/payment';
import {getHubPispTransferTypes} from '@/payment/hubpisp/utils';
import type {PaymentSSEProps} from '@/ui/components/payment/types';

export function Payments<TData>({
  config,
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
  config: PortalAppConfig | Cloned<PortalAppConfig>;
  disabled?: boolean;
  onValidate: (paymentOption?: PaymentOption) => Promise<boolean>;
  onPaypalCreatedOrder: () => Promise<any>;
  onPaypalCaptureOrder: (orderID: string) => ActionResponse<TData>;
  onApprove: (result: SuccessResponse<TData>) => Promise<void>;
  onStripeCreateCheckOutSession: () => Promise<any>;
  onStripeValidateSession: (params: {
    stripeSessionId: string;
  }) => ActionResponse<TData>;
  onPaymentSuccess?: () => Promise<void> | void;
  onPayboxCreateOrder: ({uri}: {uri: string}) => Promise<any>;
  onPayboxValidatePayment: (params: {params: any}) => ActionResponse<TData>;
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
  const allowOnlinePayment = config.allowOnlinePaymentForEcommerce;
  const paymentOptionSet = config.paymentOptionSet;

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

  const hubPispTransferTypes = getHubPispTransferTypes(paymentOptionSet);

  const allowHubPisp =
    isPaymentOptionAvailable(paymentOptionSet, PaymentOption.hubpisp) &&
    hubPispTransferTypes.length > 0;

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
          sse={sse}
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
          transferTypes={hubPispTransferTypes}
        />
      )}
    </div>
  );
}

export default Payments;
