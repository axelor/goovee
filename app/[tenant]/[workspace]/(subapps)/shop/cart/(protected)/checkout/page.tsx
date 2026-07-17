import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {findSubappAccess} from '@/orm/workspace';
import {clone} from '@/utils';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {shouldHidePricesAndPurchase} from '@/orm/product';
import {t} from '@/locale/server';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {
  CheckoutSkeleton,
  type ShopCheckoutLabels,
} from '@/subapps/shop/common/ui/components';
import {getShopConfig} from '@/subapps/shop/common/orm/config';

async function Checkout({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: false,
  });

  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

  const {user} = access;
  const {client} = access.tenant;

  const config = await getShopConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  if (!config?.confirmOrder) {
    redirect(`${workspaceURI}/shop/cart`);
  }

  const [orderSubapp, hidePriceAndPurchase, labels] = await Promise.all([
    findSubappAccess({
      code: SUBAPP_CODES.orders,
      user,
      url: workspaceURL,
      client,
    }),
    shouldHidePricesAndPurchase({user, config, client}),
    buildLabels(),
  ]);

  if (hidePriceAndPurchase) notFound();

  return (
    <Content
      config={clone(config)}
      orderSubapp={clone(orderSubapp)}
      tenant={tenant}
      labels={labels}
    />
  );
}

async function buildLabels(): Promise<ShopCheckoutLabels> {
  const [
    backToCart,
    step1,
    step2,
    step3,
    pageTitle,
    addressCardTitle,
    addressDefaultBadge,
    addressNewAction,
    addressNoneTitle,
    addressLoading,
    shippingCardTitle,
    shippingRegular,
    shippingRegularSubtitle,
    shippingFast,
    shippingFastSubtitle,
    paymentCardTitle,
    summaryTitle,
    qtyPrefix,
    subtotalHtLabel,
    vatLabel,
    shippingLabel,
    totalLabel,
    secureNotice,
    emptyCartTitle,
    loading,
  ] = await Promise.all([
    t('Back to cart'),
    t('1. Cart'),
    t('2. Shipping & payment'),
    t('3. Confirmation'),
    t('Finalise your order'),
    t('Delivery address'),
    t('Default'),
    t('New address'),
    t('No address on file — add one in your profile first.'),
    t('Loading addresses'),
    t('Shipping method'),
    t('Regular shipping'),
    t('5–10 business days'),
    t('Express shipping'),
    t('2–3 business days'),
    t('Payment'),
    t('Your order'),
    t('Qty'),
    t('Subtotal (excl. tax)'),
    t('VAT (20%)'),
    t('Shipping'),
    t('Total (incl. tax)'),
    t('Secure payment. By confirming, you accept the General Terms.'),
    t('Your cart is empty.'),
    t('Loading'),
  ]);

  return {
    backToCart,
    step1,
    step2,
    step3,
    pageTitle,
    addressCardTitle,
    addressDefaultBadge,
    addressNewAction,
    addressNoneTitle,
    addressLoading,
    shippingCardTitle,
    shippingRegular,
    shippingRegularSubtitle,
    shippingFast,
    shippingFastSubtitle,
    paymentCardTitle,
    summaryTitle,
    qtyPrefix,
    subtotalHtLabel,
    vatLabel,
    shippingLabel,
    totalLabel,
    secureNotice,
    emptyCartTitle,
    loading,
  };
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <Checkout params={params} />
    </Suspense>
  );
}
