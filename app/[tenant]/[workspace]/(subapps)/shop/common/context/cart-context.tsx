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
  /* The order requests this cart has already been emptied for, most recent
   * last. It rides on the cart so it is stored under the cart's own key and
   * written in the same operation, which is what lets the confirmation page
   * empty the cart exactly once per order however often it is reopened — and
   * it is a list rather than one slot because "has this order emptied the
   * cart?" is a property of the order, not of whichever order came last.
   * Absent on carts stored before it existed. */
  clearedFor?: string[];
};

const defaultCart = (): ShopCart => ({
  items: [],
  invoicingAddress: null,
  deliveryAddress: null,
});

const sameProduct = (item: ShopCartItem, productId: Product['id']) =>
  Number(item.product) === Number(productId);

/* How many orders back the cart remembers having been emptied for. Bounded so
 * a long-lived cart cannot grow without limit; far more than the handful of
 * confirmations a buyer could still have open. */
const CLEARED_HISTORY = 10;

/* The one place that decides what `clearedFor` means. It crosses a
 * persistence boundary, so what comes back from storage is whatever an older
 * version of this code wrote, and every reader goes through here. */
const clearedIds = (cart: ShopCart): string[] =>
  Array.isArray(cart?.clearedFor) ? cart.clearedFor : [];

/** Whether this cart has already been emptied for that order request. */
export const hasClearedFor = (
  cart: ShopCart,
  orderRequestId: string,
): boolean => clearedIds(cart).includes(orderRequestId);

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
  const {
    value: cart,
    loaded,
    setValue,
  } = useCartSlice<ShopCart>(SUBAPP_CODES.shop, defaultCart());

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

  /* Emptying for any other reason — a quotation was requested — keeps the
   * record of which orders already emptied it, or reopening their confirmation
   * would empty the cart again. */
  const clearCart = useCallback(
    () => setValue(prev => ({...defaultCart(), clearedFor: clearedIds(prev)})),
    [setValue],
  );

  /* Empties the cart and records the order request it was emptied for, in one
   * write. The confirmation page is a plain GET the buyer can reopen — by
   * Back, a bookmark, a forwarded link or a second tab — and reopening it must
   * not empty a cart they have since refilled. */
  const clearCartForOrder = useCallback(
    (orderRequestId: string) =>
      setValue(prev => ({
        ...defaultCart(),
        clearedFor: [
          ...clearedIds(prev).filter(id => id !== orderRequestId),
          orderRequestId,
        ].slice(-CLEARED_HISTORY),
      })),
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
    /* False until the stored cart has been read. Consumers must gate on this
     * rather than on `cart` being empty: an empty cart and a not-yet-loaded one
     * look identical, and treating the second as the first shows the
     * empty-cart state where a loading state belongs. */
    loaded,
    addItem,
    getProductQuantity,
    updateQuantity,
    removeItem,
    clearCart,
    clearCartForOrder,
    getProductNote,
    setProductNote,
    updateAddress,
  };
}
