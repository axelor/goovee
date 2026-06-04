'use client';

import Link from 'next/link';
import {useState} from 'react';
import {MdOutlineShoppingCart} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Badge,
  PopoverResponsive,
  PopoverTriggerResponsive,
  PopoverContentResponsive,
} from '@/ui/components';
import {i18n} from '@/locale';
import {RESPONSIVE_SIZES} from '@/constants';
import {useResponsive} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {CART_DESCRIPTORS} from './cart/descriptors';
import {useCartCounts} from './cart/cart-store';
import styles from './styles.module.scss';

const MAX_COUNT_DISPLAY = 99;

/* Shopping-cart glyph with the count badge. The positioned ancestor (the Link
 * or trigger that wraps this) provides `relative` so the badge anchors to it. */
function CartGlyph({count}: {count: number}) {
  return (
    <>
      <MdOutlineShoppingCart className="cursor-pointer text-foreground text-2xl" />
      {count ? (
        <Badge className={`${styles.badge} rounded bg-primary px-2`}>
          {count > MAX_COUNT_DISPLAY ? `${MAX_COUNT_DISPLAY}+` : count}
        </Badge>
      ) : null}
    </>
  );
}

/**
 * Single cart icon for the header / mobile nav. Each app keeps its own separate
 * cart; this only unifies their presentation so a user never sees two identical
 * cart icons. The set of carts is driven by `CART_DESCRIPTORS`, so adding a
 * future app's cart needs no change here.
 *
 * - one cart enabled (or only one holding items) → links straight to that cart
 * - several enabled and not exactly one holds items → a chooser (desktop
 *   popover / mobile bottom drawer) listing each cart with its own count
 */
export default function CartIcon({enabledCodes}: {enabledCodes: string[]}) {
  const {workspaceURI} = useWorkspace();
  const responsive = useResponsive();
  const [open, setOpen] = useState(false);

  const isSmall = RESPONSIVE_SIZES.some(size => responsive[size]);

  const descriptors = CART_DESCRIPTORS.filter(descriptor =>
    enabledCodes.includes(descriptor.code),
  );
  const counts = useCartCounts(descriptors);

  const enabledCarts = descriptors.map(descriptor => ({
    key: descriptor.code,
    label: descriptor.label(),
    href: descriptor.href(workspaceURI),
    count: counts[descriptor.code] ?? 0,
  }));

  if (!enabledCarts.length) return null;

  const totalCount = enabledCarts.reduce(
    (total, cart) => total + cart.count,
    0,
  );
  const cartsWithItems = enabledCarts.filter(cart => cart.count > 0);

  /* Link straight to a single cart only when there's no real choice to make:
   * one cart enabled, or exactly one of the two holds items. When both are
   * enabled and both are empty (or both hold items), show the chooser instead. */
  const directCart =
    enabledCarts.length === 1
      ? enabledCarts[0]
      : cartsWithItems.length === 1
        ? cartsWithItems[0]
        : null;

  if (directCart) {
    return (
      <Link href={directCart.href} className="flex relative">
        <CartGlyph count={totalCount} />
      </Link>
    );
  }

  // Both carts enabled and both hold items → let the user choose.
  return (
    <PopoverResponsive open={open} onOpenChange={setOpen} isSmall={isSmall}>
      <PopoverTriggerResponsive asChild>
        <button
          type="button"
          aria-label={i18n.t('Cart')}
          className="flex relative">
          <CartGlyph count={totalCount} />
        </button>
      </PopoverTriggerResponsive>
      <PopoverContentResponsive className={isSmall ? 'px-5 pb-5' : 'w-56 p-2'}>
        {isSmall && (
          <h3 className="text-xl font-semibold mb-2">{i18n.t('Cart')}</h3>
        )}
        <div className="flex flex-col">
          {enabledCarts.map(cart => (
            <Link
              key={cart.key}
              href={cart.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-between gap-4 rounded-md px-3 py-3 hover:bg-muted">
              <span className="font-medium">{cart.label}</span>
              <span className="text-muted-foreground text-sm">
                {cart.count}{' '}
                {cart.count === 1 ? i18n.t('item') : i18n.t('items')}
              </span>
            </Link>
          ))}
        </div>
      </PopoverContentResponsive>
    </PopoverResponsive>
  );
}
