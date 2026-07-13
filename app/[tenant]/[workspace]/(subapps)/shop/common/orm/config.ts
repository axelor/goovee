import {cache} from 'react';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {AOSPortalAppConfig} from '@/goovee/.generated/models';
import type {Payload, SelectOptions} from '@goovee/orm';
import {
  paymentConfigSelect,
  priceVisibilityConfigSelect,
  mainPriceConfigSelect,
} from '@/orm/workspace';

const shopConfigSelect = {
  advancePaymentPercentage: true,
  byAToZ: true,
  byFeature: true,
  byLessExpensive: true,
  byMostExpensive: true,
  byNewest: true,
  byZToA: true,
  carouselList: {
    select: {
      title: true,
      subTitle: true,
      href: true,
      image: {id: true},
    },
  },
  company: {id: true},
  confirmOrder: true,
  defaultStockLocation: {id: true},
  displayPrices: true,
  displayTwoPrices: true,
  noMoreStockSelect: true,
  outOfStockQty: true,
  payInAdvance: true,
  priceAfterLogin: true,
  requestQuotation: true,
  ...paymentConfigSelect,
  ...priceVisibilityConfigSelect,
  ...mainPriceConfigSelect,
} as const satisfies SelectOptions<AOSPortalAppConfig>;

export type ShopConfig = Payload<
  AOSPortalAppConfig,
  {select: typeof shopConfigSelect}
>;

export const getShopConfig = cache(
  async (configId: string, client: Client): Promise<ShopConfig | null> => {
    if (!configId) return null;

    return client.aOSPortalAppConfig.findOne({
      where: {id: configId},
      select: shopConfigSelect,
    });
  },
);
