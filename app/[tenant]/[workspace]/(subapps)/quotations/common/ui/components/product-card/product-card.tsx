import React from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  TableCell,
  TableRow,
  Collapsible,
  CollapsibleContent,
  ArrowSwitch,
  Avatar,
  AvatarImage,
} from '@/ui/components';
import {getProductImageURL} from '@/utils/files';

export const ProductCard = ({
  saleOrder,
  tenant,
}: {
  saleOrder: any;
  tenant: any;
}) => {
  const [show, setShow] = React.useState(false);

  const getProductImage = (product: any) => {
    return getProductImageURL(product?.picture?.id, tenant, {noimage: true});
  };

  return (
    <>
      <TableRow key={saleOrder.id} className="text-base">
        <TableCell className="py-4 ps-6 pe-4">
          <div className="flex gap-2">
            <Avatar className="rounded-sm h-6 w-6">
              <AvatarImage src={getProductImage(saleOrder.product)} />
            </Avatar>
            <p className="font-semibold mb-0">{saleOrder.productName}</p>
          </div>
        </TableCell>
        <TableCell className="p-4 whitespace-nowrap">{saleOrder.qty}</TableCell>
        <TableCell className="p-4 font-semibold whitespace-nowrap">
          {saleOrder.inTaxTotal}
        </TableCell>
        <TableCell>
          <ArrowSwitch show={show} onClick={() => setShow(!show)} />
        </TableCell>
      </TableRow>
      {show && (
        <TableRow>
          <TableCell colSpan={4} className={`${show ? 'border-b' : ''}`}>
            <Collapsible open={show}>
              <CollapsibleContent>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between px-4">
                    <p className="text-base font-semibold mb-0">
                      {i18n.t('Unit')}
                    </p>
                    <p className="text-base mb-0">{saleOrder?.unit?.name}</p>
                  </div>
                  <div className="flex justify-between px-4">
                    <p className="text-base font-semibold mb-0">
                      {i18n.t('Unit price WT')}
                    </p>
                    <p className="text-base mb-0">
                      {saleOrder?.priceDiscounted}
                    </p>
                  </div>
                  <div className="flex justify-between px-4">
                    <p className="text-base font-semibold mb-0">
                      {i18n.t('Total WT')}
                    </p>
                    <p className="text-base mb-0">{saleOrder?.exTaxTotal}</p>
                  </div>
                  <div className="flex justify-between px-4">
                    <p className="text-base font-semibold mb-0">
                      {i18n.t('Tax')}
                    </p>
                    <p className="text-base mb-0">
                      {saleOrder?.taxLineSet[0]?.value}%
                    </p>
                  </div>
                  <div className="flex justify-between px-4">
                    <p className="text-base font-semibold mb-0">
                      {i18n.t('Discount')}
                    </p>
                    <p className="text-base mb-0">
                      {saleOrder?.discountAmount}%
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
