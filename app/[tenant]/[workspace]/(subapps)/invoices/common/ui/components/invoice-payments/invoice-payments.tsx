'use client';

import {useCallback} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ID} from '@/types';
import {Payments} from '@/ui/components/payment';
import {useToast} from '@/ui/hooks';
import {i18n} from '@/locale';
import {ErrorResponse, SuccessResponse} from '@/types/action';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {
  createStripeBankTransferIntent,
  createStripeCheckoutSession,
  payboxCreateOrder,
  paypalCaptureOrder,
  paypalCreateOrder,
  up2payCreateOrder,
  validatePayboxPayment,
  validateStripePayment,
} from '@/subapps/invoices/common/actions';
import {Invoice} from '@/subapps/invoices/common/types/invoices';
import {INVOICE_PAYMENT_OPTIONS} from '@/subapps/invoices/common/constants/invoices';
import {SUBAPP_CODES} from '@/constants';

export function InvoicePayments({
  workspace,
  invoice,
  amount,
  paymentType,
  resetPaymentType,
  resetForm,
  token,
}: {
  workspace: any;
  invoice: Invoice;
  amount: string;
  paymentType: INVOICE_PAYMENT_OPTIONS | null;
  resetPaymentType: () => void;
  resetForm: () => void;
  token?: string;
}) {
  const workspaceURL = workspace?.url;
  const {workspaceURI} = useWorkspace();

  const router = useRouter();
  const {toast} = useToast();

  const redirectToInvoice = useCallback(
    async (result: any) => {
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
      const response: any = await validateStripePayment({
        stripeSessionId,
        workspaceURL,
        workspaceURI,
        token,
      });

      return response;
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
    params: any;
  }): Promise<ErrorResponse | SuccessResponse<{id: ID; version: number}>> => {
    try {
      const response: any = await validatePayboxPayment({
        params,
        workspaceURL,
        workspaceURI,
        token,
      });
      return response;
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
      workspace={workspace}
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
      successMessage="Invoice payment completed successfully."
      errorMessage="Failed to process invoice payment."
    />
  );
}

export default InvoicePayments;
