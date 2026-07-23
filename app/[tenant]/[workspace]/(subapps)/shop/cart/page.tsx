import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {findSubappAccess} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {shouldHidePricesAndPurchase} from '@/orm/product';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import {
  CartSkeleton,
  type ShopCartLabels,
  type ShopQuoteModalLabels,
} from '@/subapps/shop/common/ui/components';
import {getShopConfig} from '@/subapps/shop/common/orm/config';

async function CartView({
  params,
}: {
  params: {tenant: string; workspace: string};
}) {
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
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

  const [hidePriceAndPurchase, quotationSubapp, labels, modalLabels] =
    await Promise.all([
      shouldHidePricesAndPurchase({user, config, client}),
      findSubappAccess({
        code: SUBAPP_CODES.quotations,
        user,
        url: workspaceURL,
        client,
      }),
      buildLabels(),
      buildModalLabels(),
    ]);

  if (hidePriceAndPurchase) notFound();

  return (
    <Content
      tenant={tenant}
      labels={labels}
      modalLabels={modalLabels}
      hideRequestQuotation={!config?.requestQuotation}
      hideCheckout={!config?.confirmOrder}
      quotationSubapp={Boolean(quotationSubapp)}
      displayPrices={Boolean(config?.displayPrices)}
    />
  );
}

async function buildLabels(): Promise<ShopCartLabels> {
  const [
    breadcrumbRoot,
    breadcrumbCurrent,
    pageTitle,
    itemsLabelOne,
    itemsLabel,
    unitSuffix,
    emptyTitle,
    emptyCta,
    summaryTitle,
    subtotalHtLabel,
    vatLabel,
    shippingLabel,
    shippingTbdValue,
    totalLabel,
    proceedToCheckout,
    continueShopping,
    quoteBannerTitle,
    quoteBannerCta,
    removeLabel,
    loginToCheckout,
    loading,
  ] = await Promise.all([
    t('Catalogue'),
    t('Cart'),
    t('My cart'),
    t('item'),
    t('items'),
    t('/ u.'),
    t('Your cart is empty'),
    t('Browse the catalogue'),
    t('Summary'),
    t('Subtotal (excl. tax)'),
    t('VAT (20%)'),
    t('Shipping'),
    t('Calculated at next step'),
    t('Total (incl. tax)'),
    t('Proceed to checkout'),
    t('Continue shopping'),
    t('Need a tailored offer?'),
    t('Request a quote'),
    t('Remove'),
    t('Login to checkout'),
    t('Loading'),
  ]);

  return {
    breadcrumbRoot,
    breadcrumbCurrent,
    pageTitle,
    itemsLabelOne,
    itemsLabel,
    unitSuffix,
    emptyTitle,
    emptyCta,
    summaryTitle,
    subtotalHtLabel,
    vatLabel,
    shippingLabel,
    shippingTbdValue,
    totalLabel,
    proceedToCheckout,
    continueShopping,
    quoteBannerTitle,
    quoteBannerCta,
    removeLabel,
    loginToCheckout,
    loading,
  };
}

async function buildModalLabels(): Promise<ShopQuoteModalLabels> {
  const [
    headerTitle,
    headerSubtitle,
    itemsTitle,
    moreItemsPrefix,
    moreItemsSuffix,
    estimatedTotalLabel,
    htSuffix,
    addressTitle,
    addressDefaultBadge,
    addressChooseAnother,
    addressNoneTitle,
    addressLoading,
    cancel,
    submit,
    closeLabel,
    addressMissing,
    successTitle,
    errorTitle,
    submitting,
  ] = await Promise.all([
    t('Request a quote'),
    t('Reply within 24 business hours'),
    t('Items in your request'),
    t('+'),
    t('more item(s)'),
    t('Estimated total'),
    t('excl. tax'),
    t('Billing & delivery address'),
    t('Default'),
    t('Choose another'),
    t('No address on file — add one in your profile first.'),
    t('Loading addresses'),
    t('Cancel'),
    t('Send quote request'),
    t('Close'),
    t('Add an invoicing and delivery address to your profile first.'),
    t('Quotation requested successfully'),
    t('Error requesting quotation, try again!'),
    t('Sending…'),
  ]);

  return {
    headerTitle,
    headerSubtitle,
    itemsTitle,
    moreItemsPrefix,
    moreItemsSuffix,
    estimatedTotalLabel,
    htSuffix,
    addressTitle,
    addressDefaultBadge,
    addressChooseAnother,
    addressNoneTitle,
    addressLoading,
    cancel,
    submit,
    closeLabel,
    addressMissing,
    successTitle,
    errorTitle,
    submitting,
  };
}

export default async function Cart(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CartView params={params} />
    </Suspense>
  );
}
