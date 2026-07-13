import {PaymentConfig} from '@/orm/workspace';
import {PaymentOption} from '@/types';

export const isPaymentOptionAvailable = (
  paymentOptions: PaymentConfig['paymentOptionSet'] = [],
  type: PaymentOption,
) => (paymentOptions || []).some(option => option.typeSelect === type);

export const getPaymentModeId = (
  paymentOptions: PaymentConfig['paymentOptionSet'] = [],
  type: PaymentOption,
) =>
  (paymentOptions || [])?.find(option => option.typeSelect === type)
    ?.paymentMode?.id;

export function calculateAdvanceAmount({
  amount,
  percentage,
  payInAdvance,
}: {
  amount: number;
  percentage?: string | number;
  payInAdvance?: boolean;
}): number {
  if (!payInAdvance || !percentage) return amount;

  const amountNum = Number(amount);
  const percent = Number(percentage ?? 0);

  if (isNaN(percent) || percent <= 0) return amount;

  return (amountNum * percent) / 100;
}
