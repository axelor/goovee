'use client';

// ---- LOCAL IMPORTS ---- //
import {ShopCart} from '@/subapps/shop/common/ui/components';
import type {
  ShopCartLabels,
  ShopQuoteModalLabels,
} from '@/subapps/shop/common/ui/components';

export default function Content({
  labels,
  modalLabels,
  hideRequestQuotation,
  hideCheckout,
  quotationSubapp,
  displayPrices,
}: {
  tenant: string;
  labels: ShopCartLabels;
  modalLabels: ShopQuoteModalLabels;
  hideRequestQuotation: boolean;
  hideCheckout: boolean;
  quotationSubapp: boolean;
  displayPrices?: boolean;
}) {
  return (
    <ShopCart
      labels={labels}
      modalLabels={modalLabels}
      hideRequestQuotation={hideRequestQuotation}
      hideCheckout={hideCheckout}
      quotationSubapp={quotationSubapp}
      displayPrices={displayPrices}
    />
  );
}
