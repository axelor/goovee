'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import {PaymentMethods} from '@/ui/components/payment/payment-methods';
import {PAYMENT_SOURCE} from '@/payment/domain/types';
import type {OfferedGateway} from '@/payment/offer';

// ---- LOCAL IMPORTS ---- //
import {Invoice} from '@/subapps/invoices/common/types/invoices';
import {Cloned} from '@/types/util';

/**
 * The payment buttons for an invoice. Starts a payment and nothing else; the
 * outcome is shown by the payment page the gateway sends the browser back to.
 */
export function InvoicePayments({
  invoice,
  amount,
  token,
  gateways,
  checkoutToken,
}: {
  invoice: Cloned<Invoice>;
  amount: string;
  token?: string;
  gateways: OfferedGateway[];
  checkoutToken: string;
}) {
  const {toast} = useToast();

  return (
    <PaymentMethods
      gateways={gateways}
      source={PAYMENT_SOURCE.invoices}
      intent={{invoiceId: invoice.id, amount, token}}
      checkoutToken={checkoutToken}
      disabled={!Number(amount)}
      onValidate={() => {
        if (!Number(amount)) {
          toast({
            variant: 'destructive',
            title: i18n.t('Amount must be greater than 0'),
          });
          return false;
        }
        return true;
      }}
    />
  );
}

export default InvoicePayments;
