'use client';

import type {Cloned} from '@/types/util';
import type {Subapp} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import type {ShopConfig} from '@/subapps/shop/common/orm/config';
import {ShopCheckout} from '@/subapps/shop/common/ui/components';
import type {ShopCheckoutLabels} from '@/subapps/shop/common/ui/components';

export default function Content({
  config,
  orderSubapp,
  labels,
}: {
  config: ShopConfig | Cloned<ShopConfig>;
  orderSubapp?: Subapp | null;
  tenant: string;
  labels: ShopCheckoutLabels;
}) {
  return (
    <ShopCheckout config={config} orderSubapp={orderSubapp} labels={labels} />
  );
}
