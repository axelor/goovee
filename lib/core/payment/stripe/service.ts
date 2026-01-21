// ---- CORE IMPORTS ---- //
import {formatNumber} from '@/locale/server/formatters';
import {findStripePaymentIntent} from '@/lib/core/payment/stripe/actions';
import {getAmountFromStripe} from '@/utils/stripe';
import {getBankDetailsFromInstructions} from '@/lib/core/payment/stripe/utils';
import type {BankTransferDetailsType} from '@/ui/components/payment/types';

type HasPaymentIntent = {
  paymentIntent?: string;
};

type BuildPendingStripeBankTransferIntentsArgs<T extends HasPaymentIntent> = {
  resolvedContexts: Array<{
    id: string;
    data: T | null;
  }>;
  currencyCode: string;
  currencySymbol: string;
  scale: number;
};

export const buildPendingStripeBankTransferIntents = async <
  T extends HasPaymentIntent,
>({
  resolvedContexts,
  currencyCode,
  currencySymbol,
  scale,
}: BuildPendingStripeBankTransferIntentsArgs<T>): Promise<
  BankTransferDetailsType[]
> => {
  const results = await Promise.all(
    (resolvedContexts || []).map(async res => {
      try {
        const paymentIntentId = res.data?.paymentIntent;
        if (!paymentIntentId) return null;

        const paymentIntent = await findStripePaymentIntent(paymentIntentId);
        if (!paymentIntent?.next_action) return null;

        const instructions =
          paymentIntent.next_action.display_bank_transfer_instructions;
        if (!instructions) return null;

        const bankDetails = getBankDetailsFromInstructions(instructions);
        if (!bankDetails) return null;

        const amount = getAmountFromStripe(
          instructions.amount_remaining!,
          currencyCode,
        );

        const formattedAmount = await formatNumber(amount, {
          scale,
          currency: currencySymbol,
          type: 'DECIMAL',
        });

        return {
          id: paymentIntent.id,
          amount,
          currency: instructions.currency!,
          reference: instructions.reference!,
          bankDetails,
          contextId: res.id,
          formattedAmount: String(formattedAmount),
          initiatedDate: new Date(paymentIntent.created * 1000), // Stripe timestamps are in seconds; JS Date expects milliseconds
        };
      } catch (error) {
        console.error(
          `Error retrieving payment intent ${res.data?.paymentIntent}:`,
          error,
        );
        return null;
      }
    }),
  );

  return results.filter(Boolean) as BankTransferDetailsType[];
};
