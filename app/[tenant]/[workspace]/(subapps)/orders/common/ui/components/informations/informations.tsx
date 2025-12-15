'use client';

import React from 'react';
import {MdOutlineFileDownload} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Separator, Button, Chip} from '@/ui/components';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {formatDate} from '@/lib/core/locale/formatters';

// ---- LOCAL IMPORTS ---- //
import {ORDER_TYPE} from '@/subapps/orders/common/constants/orders';

export const Informations = ({
  createdOn,
  shipmentMode,
  status,
  variant,
  orderId,
  orderReport,
  orderType,
}: any) => {
  const {workspaceURL} = useWorkspace();
  const showShippingLink = [ORDER_TYPE.SHIPPED, ORDER_TYPE.DELIVERED].includes(
    status,
  );
  return (
    <>
      <div className="bg-card text-card-foreground flex md:block flex-col rounded-lg px-6 py-4">
        <h4 className="text-xl font-medium mb-0">{i18n.t('Informations')}</h4>
        <Separator className="my-2" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium mb-0">{i18n.t('Status')}:</h5>
            <Chip
              value={i18n.t(status)}
              className="font-normal text-[0.625rem] px-2 py-1"
              variant={variant}
            />
          </div>
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium mb-0">
              {i18n.t('Created on')}:
            </h5>
            <p className="text-sm">{formatDate(createdOn)}</p>
          </div>
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium mb-0">
              {i18n.t('Shipping method')}:
            </h5>
            <p>{shipmentMode?.name}</p>
          </div>
          {showShippingLink && false && (
            <div className="flex items-center gap-2">
              <p className="underline text-palette-blue-dark">
                {i18n.t('Shipping link to follow the delivery path')}
              </p>
            </div>
          )}
          {orderReport && (
            <div className="flex mt-2">
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2 bg-white hover:bg-white text-success hover:text-success border-success !font-medium basis-full md:basis-0">
                <a
                  href={`${workspaceURL}/${SUBAPP_CODES.orders}/api/order/${orderType}/${orderId}/attachment`}>
                  <MdOutlineFileDownload className="text-2xl" />{' '}
                  {i18n.t('Download order')}
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default Informations;
