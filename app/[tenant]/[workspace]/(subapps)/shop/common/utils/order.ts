// ---- CORE IMPORTS ---- //
import {calculateAdvanceAmount} from '@/utils/payment';
import type {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import type {ShopConfig} from '@/subapps/shop/common/orm/config';

export const formatNumber = (n: number | string) => n;

export function computeExpectedAmount({
  total,
  config,
}: {
  total: number | string;
  config: ShopConfig | Cloned<ShopConfig>;
}): string {
  const payInAdvance = config?.payInAdvance;
  const advancePaymentPercentage = config?.advancePaymentPercentage;

  if (
    payInAdvance &&
    advancePaymentPercentage &&
    Number(advancePaymentPercentage) > 0
  ) {
    return calculateAdvanceAmount({
      amount: Number(total),
      percentage: Number(advancePaymentPercentage),
      payInAdvance,
    }).toString();
  }

  return total.toString();
}
