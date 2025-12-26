import {
  JSON_MANY_TO_MANY,
  JSON_MANY_TO_ONE,
  MANY_T0_MANY,
  MANY_TO_ONE,
} from '../constants';

export const formatAmountForStripe = (
  amount: number,
  currency: string,
): number => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency: boolean = true;
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
};

export const isRelationalType = (type: string) => {
  return (
    type === JSON_MANY_TO_MANY ||
    type === JSON_MANY_TO_ONE ||
    type === MANY_T0_MANY ||
    type === MANY_TO_ONE
  );
};
