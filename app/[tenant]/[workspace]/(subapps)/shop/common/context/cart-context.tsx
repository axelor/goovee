'use client';

import {useCallback} from 'react';

// ---- CORE IMPORTS ---- //
import {PREFIX_CART_KEY, SUBAPP_CODES} from '@/constants';
import {getitem, setitem, removeitem} from '@/storage/local';
import {cartStorageKey} from '@/app/[tenant]/[workspace]/cart/storage';
import {useCartSlice} from '@/app/[tenant]/[workspace]/cart/cart-store';
import type {ComputedProduct, Product} from '@/types';

export type ShopCartItem = {
  product: Product['id'];
  quantity: number | string;
  images?: string[];
  computedProduct?: ComputedProduct;
  note?: string;
};

export type ShopCart = {
  items: ShopCartItem[];
  invoicingAddress: unknown;
  deliveryAddress: unknown;
};

const defaultCart = (): ShopCart => ({
  items: [],
  invoicingAddress: null,
  deliveryAddress: null,
});

const sameProduct = (item: ShopCartItem, productId: Product['id']) =>
  Number(item.product) === Number(productId);

/** Count semantics for the unified cart icon: sum of item quantities. */
export const shopCartCount = (stored: unknown): number => {
  const cart = stored as ShopCart | null;
  return (
    cart?.items?.reduce((total, item) => total + Number(item.quantity), 0) ?? 0
  );
};

/* One-time migration of a pre-namespacing cart key. Reads the new key first;
 * if empty, copies any cart from the legacy `ct-` key into it and deletes the
 * old one so existing carts survive the move to `cart:shop:<ws>`. */
async function migrateLegacyKey(
  newKey: string,
  oldKey: string,
): Promise<ShopCart | null> {
  const existing = await getitem<ShopCart>(newKey);
  if (existing) return existing;
  const old = await getitem<ShopCart>(oldKey).catch(() => null);
  if (old) {
    await setitem(newKey, old);
    await removeitem(oldKey);
  }
  return old ?? null;
}

/* Union two carts by product, taking the larger quantity — used to fold a
 * guest cart into the user cart on login. */
function mergeCarts(userCart: ShopCart, guestCart: ShopCart | null): ShopCart {
  if (!guestCart) return userCart;
  const find = (cart: ShopCart, productId: Product['id']) =>
    cart.items.find(item => String(item.product) === String(productId));
  const productIds = new Set(
    [...userCart.items, ...guestCart.items].map(item => item.product),
  );
  const items: ShopCartItem[] = [];
  productIds.forEach(productId => {
    const userItem = find(userCart, productId);
    const guestItem = find(guestCart, productId);
    const quantity = Math.max(
      Number(userItem?.quantity || 0),
      Number(guestItem?.quantity || 0),
    );
    const product = userItem || guestItem;
    if (product) items.push({...product, quantity});
  });
  return {...userCart, items};
}

/**
 * One-time lifecycle run by the CartProvider when it loads the shop cart:
 * migrate legacy `ct-` keys and, when signed in, merge the guest cart into the
 * user cart (then empty the guest cart so it can't double-count).
 */
export async function shopCartInit(
  raw: unknown,
  {workspaceURL, userId}: {workspaceURL: string; userId?: string},
): Promise<ShopCart> {
  const guestKey = cartStorageKey(SUBAPP_CODES.shop, workspaceURL);
  const legacyGuestKey = `${PREFIX_CART_KEY}-${workspaceURL}`;

  if (!userId) {
    const guest =
      (raw as ShopCart | null) ??
      (await migrateLegacyKey(guestKey, legacyGuestKey));
    return guest ?? defaultCart();
  }

  const userKey = cartStorageKey(SUBAPP_CODES.shop, workspaceURL, userId);
  const legacyUserKey = `${userId}-${PREFIX_CART_KEY}-${workspaceURL}`;

  const userCart =
    (raw as ShopCart | null) ??
    (await migrateLegacyKey(userKey, legacyUserKey)) ??
    defaultCart();
  const guestCart =
    (await getitem<ShopCart>(guestKey)) ??
    (await migrateLegacyKey(guestKey, legacyGuestKey));

  const merged = mergeCarts(userCart, guestCart);
  await setitem(userKey, merged);
  await setitem(guestKey, defaultCart());
  return merged;
}

/**
 * Shop cart API. State lives in the shared CartProvider; this hook owns the
 * shop-specific shape and mutators (quantity, notes, addresses).
 */
export function useCart() {
  const {value: cart, setValue} = useCartSlice<ShopCart>(
    SUBAPP_CODES.shop,
    defaultCart(),
  );

  const getProductQuantity = useCallback(
    async (productId: Product['id']) =>
      Number(cart.items.find(item => sameProduct(item, productId))?.quantity) ||
      0,
    [cart],
  );

  const getProductNote = useCallback(
    async (productId: Product['id']) =>
      cart.items.find(item => sameProduct(item, productId))?.note || '',
    [cart],
  );

  const setProductNote = useCallback(
    (productId: Product['id'], note: string) =>
      setValue(prev => ({
        ...prev,
        items: prev.items.map(item =>
          sameProduct(item, productId) ? {...item, note} : item,
        ),
      })),
    [setValue],
  );

  const addItem = useCallback(
    ({
      productId,
      quantity,
      images,
      computedProduct,
    }: {
      productId: Product['id'];
      quantity: string | number;
      images: string[];
      computedProduct: ComputedProduct;
    }) =>
      setValue(prev => {
        const exists = prev.items.some(item => sameProduct(item, productId));
        if (!exists) {
          return {
            ...prev,
            items: [
              ...prev.items,
              {product: productId, quantity, images, computedProduct},
            ],
          };
        }
        return {
          ...prev,
          items: prev.items.map(item =>
            sameProduct(item, productId)
              ? {...item, quantity: Number(item.quantity) + Number(quantity)}
              : item,
          ),
        };
      }),
    [setValue],
  );

  const updateQuantity = useCallback(
    ({
      productId,
      quantity,
      computedProduct,
      images,
    }: {
      productId: Product['id'];
      quantity: string | number;
      computedProduct: ComputedProduct;
      images: string[];
    }) =>
      setValue(prev => {
        const exists = prev.items.some(item => sameProduct(item, productId));
        if (!exists) {
          return {
            ...prev,
            items: [
              ...prev.items,
              {product: productId, quantity, images, computedProduct},
            ],
          };
        }
        return {
          ...prev,
          items: prev.items.map(item =>
            sameProduct(item, productId)
              ? {...item, quantity: Number(quantity)}
              : item,
          ),
        };
      }),
    [setValue],
  );

  const removeItem = useCallback(
    (productId: Product['id']) =>
      setValue(prev => ({
        ...prev,
        items: prev.items.filter(item => !sameProduct(item, productId)),
      })),
    [setValue],
  );

  const clearCart = useCallback(
    () => setValue(() => defaultCart()),
    [setValue],
  );

  const updateAddress = useCallback(
    ({
      addressType,
      address,
    }: {
      addressType: 'invoicing' | 'delivery';
      address: unknown;
    }) => setValue(prev => ({...prev, [`${addressType}Address`]: address})),
    [setValue],
  );

  return {
    /* Exposed loosely (as it always was) — shop consumers pass the cart into
     * richer enriched/checkout cart shapes, so the boundary stays `any`; the
     * mutators above remain strongly typed against ShopCart. */
    cart: cart as any,
    addItem,
    getProductQuantity,
    updateQuantity,
    removeItem,
    clearCart,
    getProductNote,
    setProductNote,
    updateAddress,
  };
}
