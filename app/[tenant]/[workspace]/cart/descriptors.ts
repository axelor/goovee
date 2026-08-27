'use client';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {cartStorageKey, type CartSummary} from './storage';
import {
  shopCartCount,
  shopCartInit,
} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/context/cart-context';
import {marketplaceCartCount} from '@/app/[tenant]/[workspace]/(subapps)/marketplace/common/hooks/use-marketplace-cart';

/**
 * Every per-app cart the unified icon knows about. Each entry declares its
 * label, cart route, storage key and count semantics — the cart logic itself
 * lives in each app's own hook/context on top of the shared storage core.
 *
 * To add a future app's cart: build its hook on `useCartSlice` (keying with
 * `cartStorageKey('<code>', ...)`) and add one entry here. The
 * icon, header and mobile menu need no changes.
 */
export const CART_DESCRIPTORS: CartSummary[] = [
  {
    code: SUBAPP_CODES.shop,
    label: () => i18n.t('Shop'),
    href: workspaceURI => `${workspaceURI}/shop/cart`,
    storageKey: (workspaceURL, userId) =>
      cartStorageKey(SUBAPP_CODES.shop, workspaceURL, userId),
    getCount: shopCartCount,
    init: shopCartInit,
  },
  {
    code: SUBAPP_CODES.marketplace,
    label: () => i18n.t('Marketplace'),
    href: workspaceURI => `${workspaceURI}/${SUBAPP_CODES.marketplace}/cart`,
    storageKey: (workspaceURL, userId) =>
      cartStorageKey(SUBAPP_CODES.marketplace, workspaceURL, userId),
    getCount: marketplaceCartCount,
  },
];
