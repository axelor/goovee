'use client';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import type {MarketplaceConfig} from '../../../../orm/config';
import {PaymentOption} from '@/types';
import type {SuccessResponse} from '@/types/action';
import type {Cloned} from '@/types/util';
import {Button} from '@/ui/components';
import {Payments} from '@/ui/components/payment';
import {useToast} from '@/ui/hooks';
import {Link} from '@/ui/components/link';
import {useRouter} from 'next/navigation';
import {
  checkout,
  createStripeCheckoutSession,
  payboxCreateOrder,
  paypalCreateOrder,
} from '../../../../actions';
import {useMarketplaceCart} from '../../../../hooks/use-marketplace-cart';
import {CartItemCard} from '../../cart/cart-item-card';

type Props = {
  config: Cloned<MarketplaceConfig>;
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

/* Checkout content. Reads the localStorage cart, renders the line items
 * for visual confirmation, and mounts <Payments> wired to our per-
 * provider session actions. Server-side guards (auth, drift, paid-only,
 * not-owned) run inside each action so the buyer can't tamper with the
 * cart between this page and the provider redirect. */
export function CheckoutContent({config}: Props) {
  const router = useRouter();
  const {workspaceURI, workspaceURL} = useWorkspace();
  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;
  const {cart, loaded, clearCart} = useMarketplaceCart();
  const {toast} = useToast();
  const productIds = cart.items.map(item => item.productId);

  const onApprove = async (result: SuccessResponse<{orderId: string}>) => {
    await clearCart();
    if (result.message) {
      toast({variant: 'destructive', title: result.message});
    }
    const orderId = result.data?.orderId;
    const query = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
    router.push(`${marketplaceBase}/cart/checkout/success${query}`);
  };

  if (!loaded) {
    return <div className="h-32 rounded-lg bg-muted/40 animate-pulse" />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground mb-4">
          {i18n.t('Your cart is empty.')}
        </p>
        <Button asChild>
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
      <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{i18n.t('Total')}</span>
        <span className="text-lg font-semibold">
          {formatPrice(subtotal, firstScale, firstSymbol)}
        </span>
      </div>

      <Payments
        config={config}
        disabled={false}
        onValidate={async () => true}
        onApprove={onApprove}
        onPaypalCreatedOrder={async () =>
          paypalCreateOrder({productIds, workspaceURL})
        }
        onPaypalCaptureOrder={async orderID =>
          checkout({
            payment: {data: {id: orderID}, mode: PaymentOption.paypal},
            workspaceURL,
          })
        }
        onStripeCreateCheckOutSession={async () =>
          createStripeCheckoutSession({productIds, workspaceURL})
        }
        onStripeValidateSession={async ({stripeSessionId}) =>
          checkout({
            payment: {data: {id: stripeSessionId}, mode: PaymentOption.stripe},
            workspaceURL,
          })
        }
        onPayboxCreateOrder={async ({uri}) =>
          payboxCreateOrder({
            productIds,
            workspaceURL,
            uri,
          })
        }
        onPayboxValidatePayment={async ({params}) =>
          checkout({
            payment: {data: {params}, mode: PaymentOption.paybox},
            workspaceURL,
          })
        }
        successMessage="Purchase completed successfully."
        errorMessage="Failed to complete purchase."
      />
    </div>
  );
}
