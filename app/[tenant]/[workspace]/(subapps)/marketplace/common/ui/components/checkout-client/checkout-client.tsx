'use client';

import {useRouter} from 'next/navigation';
import Link from 'next/link';

import {i18n} from '@/locale';
import {Button} from '@/ui/components';
import {Payments} from '@/ui/components/payment';
import {PaymentOption} from '@/types';
import type {PortalWorkspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';

import {useMarketplaceCart} from '../../../hooks/use-marketplace-cart';
import {
  createStripeCheckoutSession,
  paypalCreateOrder,
  payboxCreateOrder,
} from '../../../actions/payments';
import {checkout} from '../../../actions/actions';
import {CartItemCard} from '../cart-item-card';

type Props = {
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
  workspaceURL: string;
  marketplaceBase: string;
};

function formatPrice(value: number, scale = 2, currencySymbol?: string | null) {
  const amount = value.toLocaleString(undefined, {
    minimumFractionDigits: scale,
    maximumFractionDigits: scale,
  });
  return currencySymbol ? `${amount} ${currencySymbol}` : amount;
}

/* Checkout client. Reads the localStorage cart, renders the line items
 * for visual confirmation, and mounts <Payments> wired to our per-
 * provider session actions. Server-side guards (auth, drift, paid-only,
 * not-owned) run inside each action so the buyer can't tamper with the
 * cart between this page and the provider redirect. */
export function CheckoutClient({
  workspace,
  workspaceURL,
  marketplaceBase,
}: Props) {
  const router = useRouter();
  const {cart, loaded, clearCart} = useMarketplaceCart(workspaceURL);
  const productIds = cart.items.map(item => item.productId);

  /* Path used by Paybox to build success/failure return URLs. The host
   * is added by the server-side action. */
  const payboxReturnPath = `${marketplaceBase.replace(/^\//, '')}/cart/checkout`;

  const onApprove = async () => {
    await clearCart();
    router.push(`${marketplaceBase}/cart/checkout/success`);
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
        workspace={workspace}
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
            uri: uri ?? payboxReturnPath,
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
