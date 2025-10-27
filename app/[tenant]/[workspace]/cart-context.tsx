'use client';

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useSession} from 'next-auth/react';

// ---- CORE IMPORTS ---- //
import {PREFIX_CART_KEY} from '@/constants';
import {getitem, setitem} from '@/storage/local';
import {useWorkspace} from './workspace-context';
import type {ComputedProduct, Product} from '@/types';

type CartContextType = {
  cart: any;
  addItem: ({
    productId,
    quantity,
    images,
    computedProduct,
  }: {
    productId: Product['id'];
    quantity: string | number;
    images: string[];
    computedProduct: ComputedProduct;
  }) => Promise<void>;
  getProductQuantity: (productId: Product['id']) => Promise<any>;
  updateQuantity: ({
    productId,
    quantity,
    computedProduct,
    images,
  }: {
    productId: Product['id'];
    quantity: string | number;
    computedProduct: ComputedProduct;
    images: string[];
  }) => Promise<void>;
  removeItem: (productId: Product['id']) => Promise<void>;
  clearCart: () => Promise<void>;
  getProductNote: (productId: Product['id']) => Promise<any>;
  setProductNote: (productId: Product['id'], note: string) => Promise<void>;
  updateAddress: ({
    addressType,
    address,
  }: {
    addressType: 'invoicing' | 'delivery';
    address: any;
  }) => void;
};

const CartContext = React.createContext<CartContextType | null>(null);

const defaultcart = () => ({
  items: [],
  invoicingAddress: null,
  deliveryAddress: null,
});

export default function CartContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const {workspaceURL} = useWorkspace();
  const shouldUpdateLocalStorage = useRef<boolean>(false);

  const {data: session} = useSession();
  const user = session?.user;

  const cartKey = useMemo(
    () => PREFIX_CART_KEY + '-' + workspaceURL,
    [workspaceURL],
  );

  const clearCart = useCallback(async () => {
    setCart({
      items: [],
      invoicingAddress: null,
      deliveryAddress: null,
    });
  }, []);

  const getProductQuantity = useCallback(
    async (productId: Product['id']) => {
      return (
        cart?.items.find((i: any) => Number(i?.product) === Number(productId))
          ?.quantity || 0
      );
    },
    [cart?.items],
  );

  const getProductNote = useCallback(
    async (productId: Product['id']) => {
      return (
        cart?.items.find((i: any) => Number(i?.product) === Number(productId))
          ?.note || ''
      );
    },
    [cart?.items],
  );

  const setProductNote = useCallback(
    async (productId: Product['id'], note: string) => {
      setCart((cart: any) => {
        return {
          ...cart,
          items: cart.items.map((i: any) => {
            if (Number(i.product) === Number(productId)) {
              i.note = note;
            }

            return i;
          }),
        };
      });
    },
    [],
  );

  const addItem = useCallback(
    async ({
      productId,
      quantity,
      images,
      computedProduct,
    }: {
      productId: Product['id'];
      quantity: string | number;
      images: string[];
      computedProduct: ComputedProduct;
    }) => {
      const existing = await getProductQuantity(productId);

      if (!existing) {
        setCart((cart: any) => ({
          ...cart,
          items: [
            ...cart?.items,
            {
              product: productId,
              quantity,
              images,
              computedProduct,
            },
          ],
        }));
      } else {
        setCart((cart: any) => ({
          ...cart,
          items: cart.items.map((i: any) => {
            if (Number(i.product) === Number(productId)) {
              i.quantity = Number(i.quantity) + Number(quantity);
            }

            return i;
          }),
        }));
      }
    },
    [getProductQuantity],
  );

  const decrementQuantity = useCallback(
    async ({
      productId,
      quantity,
    }: {
      productId: Product['id'];
      quantity: string | number;
    }) => {
      const existing = await getProductQuantity(productId);

      if (existing) {
        setCart((cart: any) => {
          return {
            ...cart,
            items: cart.items.map((i: any) => {
              if (Number(i.product) === Number(productId)) {
                i.quantity = Number(i.quantity) - Number(quantity);
              }

              return i;
            }),
          };
        });
      }
    },
    [getProductQuantity],
  );

  const updateQuantity = useCallback(
    async ({
      productId,
      quantity,
      computedProduct,
      images,
    }: {
      productId: Product['id'];
      quantity: string | number;
      computedProduct: ComputedProduct;
      images: string[];
    }) => {
      const existing = await getProductQuantity(productId);

      if (!existing) {
        return await addItem({productId, quantity, computedProduct, images});
      }

      setCart((cart: any) => {
        return {
          ...cart,
          items: cart.items.map((i: any) => {
            if (Number(i.product) === Number(productId)) {
              i.quantity = Number(quantity);
            }

            return i;
          }),
        };
      });
    },
    [addItem, getProductQuantity],
  );

  const removeItem = useCallback(
    async (productId: Product['id']) => {
      const existing = await getProductQuantity(productId);

      if (existing) {
        setCart((cart: any) => {
          return {
            ...cart,
            items: cart.items.filter(
              (i: any) => Number(i.product) !== Number(productId),
            ),
          };
        });
      }
    },
    [getProductQuantity],
  );

  const updateAddress = useCallback(
    ({
      addressType,
      address,
    }: {
      addressType: 'invoicing' | 'delivery';
      address: any;
    }) => {
      setCart((cart: any) => ({
        ...cart,
        [`${addressType}Address`]: address,
      }));
    },
    [],
  );

  const mergeCart = useCallback(async (cartA: any, cartB: any) => {
    if (cartA && cartB) {
      const getProducts = (cart: any) => cart?.items.map((i: any) => i.product);

      const cartAProducts = getProducts(cartA);
      const cartBProducts = getProducts(cartB);

      const getproduct = (id: any, cart: any) =>
        cart?.items.find((i: any) => String(i.product) === String(id));

      const cart = {
        ...cartA,
        items: [],
      };

      Array.from(new Set([...cartAProducts, ...cartBProducts])).forEach(id => {
        const cartAProduct = getproduct(id, cartA);
        const cartBProduct = getproduct(id, cartB);
        const cartAQuantity = cartAProduct?.quantity || 0;
        const cartBQuantiy = cartBProduct?.quantity || 0;

        const quantity = Math.max(Number(cartAQuantity), Number(cartBQuantiy));
        const product = cartAProduct || cartBProduct;

        if (product) {
          cart.items.push({
            ...product,
            quantity,
          });
        }
      });

      return cart;
    } else {
      return cartA || cartB;
    }
  }, []);

  const userId = user?.id;

  const initialise = useCallback(async () => {
    shouldUpdateLocalStorage.current = false;
    setLoading(true);

    let cart;

    const localCart = await getitem(cartKey).catch(() => {});

    if (userId) {
      const userCartKey = userId + '-' + cartKey;
      let usercart = await getitem(userCartKey).catch(err => {
        console.log(err);
      });

      if (!usercart) {
        usercart = defaultcart();
      }

      usercart = await mergeCart(usercart, localCart);

      await setitem(userCartKey, usercart).catch(() => {});
      await setitem(cartKey, defaultcart()).catch(() => {});
      cart = usercart;
    } else {
      cart = localCart;
    }

    if (!cart) {
      cart = defaultcart();
    }

    setCart(cart);
    shouldUpdateLocalStorage.current = true;
    setLoading(false);
  }, [userId, cartKey, mergeCart]);

  useEffect(() => {
    initialise();
  }, [initialise]);

  useEffect(() => {
    if (!shouldUpdateLocalStorage.current) return;

    const updateCart = async () => {
      let key: string = cartKey;
      if (userId) {
        key = userId + '-' + cartKey;
      }
      await setitem(key, cart);
    };

    const timer = setTimeout(() => {
      updateCart();
    }, 100);

    return () => clearTimeout(timer);
  }, [cartKey, cart, userId, loading]);

  const value = useMemo(
    () => ({
      cart,
      addItem,
      getProductQuantity,
      updateQuantity,
      removeItem,
      clearCart,
      getProductNote,
      setProductNote,
      updateAddress,
    }),
    [
      cart,
      addItem,
      getProductQuantity,
      updateQuantity,
      removeItem,
      clearCart,
      getProductNote,
      setProductNote,
      updateAddress,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('CartContext must be used within a CartProvider');
  }
  return context;
}
