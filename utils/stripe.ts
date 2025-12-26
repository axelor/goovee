export const formatAmountForStripe = (
  amount: number,
  currency: string,
): number => {
  return isZeroDecimalCurrency(amount, currency)
    ? amount
    : Math.round(amount * 100);
};

export const getAmountFromStripe = (
  amount: number,
  currency: string,
): number => {
  return isZeroDecimalCurrency(amount, currency) ? amount : amount / 100;
};

function isZeroDecimalCurrency(amount: number, currency: string): boolean {
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
  return zeroDecimalCurrency;
}
