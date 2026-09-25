'use client';

import {useEffect} from 'react';
import {MdCheck} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components';
import {Link} from '@/ui/components/link';
import {
  hasClearedFor,
  useCart,
} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/context/cart-context';

/* The cart lives in the browser and the purchase completes on the payment
 * page, away from any shop component, so this page empties it. Which order
 * request it was emptied for is recorded on the cart itself, in the same
 * write, so reopening this page — by Back, a bookmark, a forwarded link or a
 * second tab — leaves whatever is in the cart by then alone. */
export function OrderConfirmation({
  orderRequestId,
  heading,
  body,
  orderHref,
  orderLabel,
  shopHref,
  shopLabel,
}: {
  orderRequestId: string;
  heading: string;
  body: string;
  orderHref: string | null;
  orderLabel: string;
  shopHref: string;
  shopLabel: string;
}) {
  const {cart, loaded, clearCartForOrder} = useCart();
  const alreadyCleared = hasClearedFor(cart, orderRequestId);

  useEffect(() => {
    if (!loaded || alreadyCleared) {
      return;
    }
    void clearCartForOrder(orderRequestId);
  }, [loaded, alreadyCleared, clearCartForOrder, orderRequestId]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-xs">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-mint-50 text-mint-700">
          <MdCheck className="text-3xl" />
        </span>
        <h1 className="text-2xl font-semibold text-ink-900">{heading}</h1>
        <p className="mt-2 text-ink-500">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {orderHref && (
            <Button variant="royal" asChild>
              <Link href={orderHref}>{orderLabel}</Link>
            </Button>
          )}
          <Button variant={orderHref ? 'ink-outline' : 'royal'} asChild>
            <Link href={shopHref}>{shopLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
