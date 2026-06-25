// ---- CORE IMPORTS ---- //
import {PortalAppConfig} from '@/orm/workspace';
import {calculateAdvanceAmount} from '@/utils/payment';
import type {Cloned} from '@/types/util';

export const formatNumber = (n: number | string) => n;

export function computeExpectedAmount({
  total,
  config,
}: {
  total: number | string;
  config: PortalAppConfig | Cloned<PortalAppConfig>;
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
