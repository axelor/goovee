// ---- CORE IMPORTS ---- //
import {scale} from '@/utils';
import type {Cloned} from '@/types/util';
import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_SCALE,
  DEFAULT_CURRENCY_SYMBOL,
  MAIN_PRICE,
} from '@/constants';
import type {ComputedProduct} from '@/types';
import type {MainPriceConfig} from '@/orm/workspace';
import {formatNumber} from '@/locale/formatters';

export function computeTotal({
  cart,
  config,
  formatNumber: formatNumberProp = formatNumber,
}: {
  cart: {
    items?: Array<{
      quantity?: string | number;
      computedProduct?: ComputedProduct;
    }>;
  };
  config?: MainPriceConfig | Cloned<MainPriceConfig>;
  formatNumber?: typeof formatNumber;
}) {
  let mainPrice: MainPriceConfig['mainPrice'] = MAIN_PRICE.ATI;

  if (config?.mainPrice) {
    mainPrice = config?.mainPrice;
  }

  const {subtotal, tax} = cart?.items?.reduce(
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
  ) ?? {subtotal: 0, tax: 0};

  const firstItem = cart?.items?.[0]?.computedProduct;

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

  const total = scale(subtotal + tax, currencyScale);

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
