'use client';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {PAYMENT_SOURCE} from '@/payment/domain/types';
import type {OfferedGateway} from '@/payment/offer';
import {Button} from '@/ui/components';
import {Link} from '@/ui/components/link';
import {PaymentMethods} from '@/ui/components/payment/payment-methods';
import {useMarketplaceCart} from '../../../../hooks/use-marketplace-cart';
import {CartItemCard} from '../../cart/cart-item-card';

type Props = {
  gateways: OfferedGateway[];
  checkoutToken: string;
};

function formatPrice(
  value: number,
  scale = 2,
  currencySymbol: string | null = null,
) {
  const amount = value.toLocaleString(undefined, {
    minimumFractionDigits: scale,
    maximumFractionDigits: scale,
  });
  return currencySymbol ? `${amount} ${currencySymbol}` : amount;
}

/* Checkout content. Reads the browser-persisted cart, renders the line items
 * for visual confirmation, and mounts the payment buttons. Only product ids
 * are sent: the server revalidates the cart and prices it again, so the buyer
 * cannot influence what is charged. The outcome is shown by the payment page
 * the gateway sends the browser back to. */
export function CheckoutContent({gateways, checkoutToken}: Props) {
  const {scope} = useWorkspace();
  const marketplaceBase = scope.forRouter(`/${SUBAPP_CODES.marketplace}`);
  const {cart, loaded} = useMarketplaceCart();
  const productIds = cart.items.map(item => item.productId);

  if (!loaded) {
    return <div className="h-32 rounded-lg bg-ink-50/40 animate-pulse" />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-ink-100 bg-white p-8 text-center">
        <p className="text-ink-500 mb-4">{i18n.t('Your cart is empty.')}</p>
        <Button variant="royal" asChild>
          <Link href={`${marketplaceBase}`}>
            {i18n.t('Browse marketplace')}
          </Link>
        </Button>
      </div>
    );
  }

  const firstSymbol = cart.items[0]?.currencySymbol ?? undefined;
  const firstScale = cart.items[0]?.scale ?? 2;
  const subtotal = cart.items.reduce((sum, item) => sum + item.priceAti, 0);

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {cart.items.map(item => {
          const productHref = `${marketplaceBase}/products/${item.productSlug}`;
          return (
            <li key={item.productId}>
              <CartItemCard
                item={item}
                productHref={productHref}
                formatPrice={formatPrice}
              />
            </li>
          );
        })}
      </ul>
      <div className="rounded-lg border border-ink-100 bg-white px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-ink-500">{i18n.t('Total')}</span>
        <span className="text-lg font-semibold">
          {formatPrice(subtotal, firstScale, firstSymbol)}
        </span>
      </div>

      {gateways.length === 0 ? (
        <p className="text-sm text-ink-500">
          {i18n.t('Online payment is not available.')}
        </p>
      ) : (
        <PaymentMethods
          gateways={gateways}
          source={PAYMENT_SOURCE.marketplace}
          intent={{productIds}}
          checkoutToken={checkoutToken}
        />
      )}
    </div>
  );
}
