'use client';

import type {Cloned} from '@/types/util';
import type {OfferedGateway} from '@/payment/offer';

// ---- LOCAL IMPORTS ---- //
import type {ShopConfig} from '@/subapps/shop/common/orm/config';
import {ShopCheckout} from '@/subapps/shop/common/ui/components';
import type {ShopCheckoutLabels} from '@/subapps/shop/common/ui/components';

export default function Content({
  config,
  gateways,
  checkoutToken,
  labels,
}: {
  config: ShopConfig | Cloned<ShopConfig>;
  gateways: OfferedGateway[];
  checkoutToken: string;
  labels: ShopCheckoutLabels;
}) {
  return (
    <ShopCheckout
      config={config}
      gateways={gateways}
      checkoutToken={checkoutToken}
      labels={labels}
    />
  );
}
