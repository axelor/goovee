'use client';

import {useCallback, useMemo} from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ID} from '@/types';
import {Payments} from '@/ui/components/payment';
import {SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {useToast} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {ErrorResponse, SuccessResponse} from '@/types/action';

// ---- LOCAL IMPORTS ---- //
import {
  createStripeCheckoutSession,
  payboxCreateOrder,
  paypalCaptureOrder,
  paypalCreateOrder,
  validatePayboxPayment,
  validateStripePayment,
} from '@/subapps/invoices/common/actions';
import {Invoice} from '@/subapps/invoices/common/types/invoices';
import {INVOICE_PAYMENT_OPTIONS} from '@/subapps/invoices/common/constants/invoices';

export function InvoicePayments({
  workspace,
  invoice,
  amount,
  paymentType,
  resetPaymentType,
  resetForm,
}: {
  workspace: any;
  invoice: Invoice;
  amount: string;
  paymentType: INVOICE_PAYMENT_OPTIONS | null;
  resetPaymentType: () => void;
  resetForm: () => void;
}) {
  const workspaceURL = workspace?.url;

  const router = useRouter();
  const {workspaceURI} = useWorkspace();
  const {toast} = useToast();

  const redirectionPath = useMemo(() => {
    if (paymentType === INVOICE_PAYMENT_OPTIONS.PARTIAL) {
      return `${workspaceURI}/${SUBAPP_CODES.invoices}/${SUBAPP_PAGE.unpaid}/${invoice.id}`;
    } else {
      return `${workspaceURI}/${SUBAPP_CODES.invoices}/${SUBAPP_PAGE.paid}/${invoice.id}`;
    }
  }, [invoice.id, paymentType, workspaceURI]);

  const redirectToInvoice = useCallback(
    async (result: any) => {
      if (result) {
        if (paymentType === INVOICE_PAYMENT_OPTIONS.PARTIAL) {
          resetPaymentType();
          resetForm();
        }
        router.replace(redirectionPath);
      }
    },
    [paymentType, router, resetPaymentType, resetForm, redirectionPath],
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
        invalidatePath: redirectionPath,
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
        invalidatePath: redirectionPath,
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
        });
      }}
      onPaypalCaptureOrder={async orderID => {
        return await paypalCaptureOrder({
          orderID,
          workspaceURL,
        });
      }}
      onApprove={redirectToInvoice}
      onStripeCreateCheckOutSession={async () => {
        return await createStripeCheckoutSession({
          invoice: {id: invoice.id},
          amount,
          workspaceURL,
        });
      }}
      onStripeValidateSession={handleStripeValidations}
      onPayboxCreateOrder={async ({uri}) => {
        return await payboxCreateOrder({
          invoice: {id: invoice.id},
          amount,
          workspaceURL,
          uri,
        });
      }}
      onPayboxValidatePayment={handlePayboxValidations}
      successMessage="Invoice payment completed successfully."
      errorMessage="Failed to process invoice payment."
    />
  );
}

export default InvoicePayments;
