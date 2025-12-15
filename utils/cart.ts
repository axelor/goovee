// ---- CORE IMPORTS ---- //
import {scale} from '@/utils';
import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  MAIN_PRICE,
} from '@/constants';
import type {
  Cart,
  ComputedProduct,
  PortalAppConfig,
  PortalWorkspace,
} from '@/types';
import {formatNumber} from '@/locale/formatters';

export function computeTotal({
  cart,
  workspace,
  formatNumber: formatNumberProp = formatNumber,
}: {
  cart: Cart;
  workspace?: PortalWorkspace;
  formatNumber?: any;
}) {
  let mainPrice: PortalAppConfig['mainPrice'] = MAIN_PRICE.ATI;

  if (workspace?.config?.mainPrice) {
    mainPrice = workspace?.config?.mainPrice;
  }

  let {subtotal, tax} = cart?.items?.reduce(
    (acc, i) => {
      const {computedProduct, quantity} = i as unknown as {
        computedProduct: ComputedProduct;
        quantity: string | number;
      };

      if (!computedProduct) return acc;

      const {
        price,
        scale: {currency: currencyScale},
      } = computedProduct;
      const {ati = 0, wt = 0} = price;
      const tax = Number(ati) - Number(wt);

      acc.tax += Number(scale(Number(tax) * Number(quantity), currencyScale));
      acc.subtotal += Number(
        scale(Number(wt) * Number(quantity), currencyScale),
      );

      return acc;
    },
    {
      subtotal: 0,
      tax: 0,
    } as {subtotal: number; tax: number},
  );

  const firstItem = (cart?.items?.[0] as any)?.computedProduct;

  const {
    scale: {currency: currencyScale},
    currency: {symbol, code},
  } = firstItem || {
    scale: {
      currency: DEFAULT_CURRENCY_SCALE,
    },
    currency: {
      code: DEFAULT_CURRENCY_CODE,
      symbol: DEFAULT_CURRENCY_SYMBOL,
    },
  };

  let total = scale(subtotal + tax, currencyScale);

  return {
    total,
    displayTotal: `${formatNumberProp(total, {scale: currencyScale, currency: symbol, type: 'DECIMAL'})} ATI`,
    scale: {
      currency: currencyScale,
    },
    currency: {
      symbol,
      code,
    },
  };
}
