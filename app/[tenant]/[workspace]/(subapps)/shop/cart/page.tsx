import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {findSubappAccess} from '@/orm/workspace';
import {SUBAPP_CODES} from '@/constants';
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
  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    allowGuest: true,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

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
      tenant={access.tenant.id}
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
    ttcSuffix,
    addressTitle,
    addressDefaultBadge,
    addressChooseAnother,
    addressNewAction,
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
    t('incl. tax'),
    t('Billing & delivery address'),
    t('Default'),
    t('Choose another'),
    t('New address'),
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
    ttcSuffix,
    addressTitle,
    addressDefaultBadge,
    addressChooseAnother,
    addressNewAction,
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
