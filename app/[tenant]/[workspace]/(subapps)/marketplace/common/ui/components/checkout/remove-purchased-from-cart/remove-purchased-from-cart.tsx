'use client';

import {useEffect} from 'react';

import {useMarketplaceCart} from '../../../../hooks/use-marketplace-cart';

/* The cart lives in the browser and the purchase completes on the payment
 * page, away from any marketplace component, so the success page takes the
 * bought products out of it when it renders. Only those: a later visit to the
 * same page must not empty a cart the buyer has started since. */
export function RemovePurchasedFromCart({productIds}: {productIds: string[]}) {
  const {loaded, cart, removeItem} = useMarketplaceCart();

  useEffect(() => {
    if (!loaded) {
      return;
    }
    for (const productId of productIds) {
      if (cart.items.some(cartItem => cartItem.productId === productId)) {
        void removeItem(productId);
      }
    }
  }, [loaded, cart.items, productIds, removeItem]);

  return null;
}
