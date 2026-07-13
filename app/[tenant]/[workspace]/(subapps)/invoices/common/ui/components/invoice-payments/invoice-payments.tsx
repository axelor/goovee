'use client';

import {useCallback} from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ID} from '@/types';
import {Payments} from '@/ui/components/payment';
import {useToast} from '@/ui/hooks';
import {i18n} from '@/locale';
import {ErrorResponse, SuccessResponse} from '@/types/action';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {PAYMENT_SOURCE} from '@/lib/core/payment/common/type';
import {PaymentUpdateStatus} from '@/lib/core/payment/sse';

// ---- LOCAL IMPORTS ---- //
import {
  createStripeBankTransferIntent,
  createStripeCheckoutSession,
  initiatePispPayment,
  payboxCreateOrder,
  paypalCaptureOrder,
  paypalCreateOrder,
  up2payCreateOrder,
  validatePayboxPayment,
  validateStripePayment,
} from '@/subapps/invoices/common/actions';
import type {InvoicesConfig} from '@/subapps/invoices/common/orm/config';
import {Invoice} from '@/subapps/invoices/common/types/invoices';
import {INVOICE_PAYMENT_OPTIONS} from '@/subapps/invoices/common/constants/invoices';
import {SUBAPP_CODES} from '@/constants';
import {Cloned} from '@/types/util';

export function InvoicePayments({
  config,
  invoice,
  amount,
  paymentType,
  resetPaymentType,
  resetForm,
  token,
  onPaymentUpdate,
}: {
  config: InvoicesConfig | Cloned<InvoicesConfig>;
  invoice: Cloned<Invoice>;
  amount: string;
  paymentType: INVOICE_PAYMENT_OPTIONS | null;
  resetPaymentType: () => void;
  resetForm: () => void;
  token?: string;
  onPaymentUpdate?: (status: PaymentUpdateStatus) => void;
}) {
  const {workspaceURI, workspaceURL} = useWorkspace();

  const router = useRouter();
  const {toast} = useToast();

  const redirectToInvoice = useCallback(
    async (result: SuccessResponse<unknown>) => {
      if (result) {
        if (paymentType === INVOICE_PAYMENT_OPTIONS.PARTIAL) {
          resetPaymentType();
          resetForm();
        }
        router.replace(
          `${workspaceURI}/${SUBAPP_CODES.invoices}/${invoice.id}${token ? `?token=${token}` : ''}`,
        );
      }
    },
    [
      paymentType,
      router,
      resetPaymentType,
      resetForm,
      invoice,
      token,
      workspaceURI,
    ],
  );

  const handleInvoiceValidation = async () => {
    if (!Number(amount)) {
      toast({
        variant: 'destructive',
        title: i18n.t('Amount must be greater than 0'),
      });
      return false;
    }
    return true;
  };

  const handleStripeValidations = async ({
    stripeSessionId,
  }: {
    stripeSessionId: string;
  }): Promise<ErrorResponse | SuccessResponse<{id: ID; version: number}>> => {
    try {
      const response = await validateStripePayment({
        stripeSessionId,
        workspaceURL,
        workspaceURI,
        token,
      });

      return response as
        | ErrorResponse
        | SuccessResponse<{id: ID; version: number}>;
    } catch (error) {
      return {
        error: true,
        message: i18n.t('Unexpected error occurred'),
      };
    }
  };

  const handlePayboxValidations = async ({
    params,
  }: {
    params: Record<string, string>;
  }): Promise<ErrorResponse | SuccessResponse<{id: ID; version: number}>> => {
    try {
      const response = await validatePayboxPayment({
        params,
        workspaceURL,
        workspaceURI,
        token,
      });
      return response as
        | ErrorResponse
        | SuccessResponse<{id: ID; version: number}>;
    } catch (error) {
      return {
        error: true,
        message: i18n.t(
          'Unexpected error occurred while validating paybox payment',
        ),
      };
    }
  };

  return (
    <Payments
      disabled={!Number(amount)}
      config={config}
      onValidate={async () => {
        const isValid = await handleInvoiceValidation();

        return !!isValid;
      }}
      onPaypalCreatedOrder={async () => {
        return await paypalCreateOrder({
          invoice: {id: invoice.id},
          amount,
          workspaceURL,
          token,
        });
      }}
      onPaypalCaptureOrder={async orderID => {
        return await paypalCaptureOrder({
          orderID,
          workspaceURL,
          token,
        });
      }}
      onApprove={redirectToInvoice}
      onStripeCreateCheckOutSession={async () => {
        return await createStripeCheckoutSession({
          invoice: {id: invoice.id},
          amount,
          workspaceURL,
          token,
        });
      }}
      onStripeValidateSession={handleStripeValidations}
      onCreateBankTransferIntent={async () => {
        return await createStripeBankTransferIntent({
          invoice: {id: invoice.id},
          amount,
          workspaceURL,
          token,
        });
      }}
      onPayboxCreateOrder={async ({uri}) => {
        return await payboxCreateOrder({
          invoice: {id: invoice.id},
          amount,
          workspaceURL,
          uri,
          token,
        });
      }}
      onPayboxValidatePayment={handlePayboxValidations}
      onUp2payCreateOrder={async ({uri}) => {
        return await up2payCreateOrder({
          invoice: {id: invoice.id},
          amount,
          workspaceURL,
          uri,
          token,
        });
      }}
      onInitiatePispPayment={async ({uri, localInstrument}) => {
        return await initiatePispPayment({
          invoice: {id: invoice.id},
          amount,
          workspaceURL,
          uri,
          localInstrument,
          token,
        });
      }}
      successMessage="Invoice payment completed successfully."
      errorMessage="Failed to process invoice payment."
      sse={
        onPaymentUpdate
          ? {
              source: PAYMENT_SOURCE.INVOICES,
              entityId: invoice.id,
              onPaymentUpdate,
            }
          : undefined
      }
    />
  );
}

export default InvoicePayments;
