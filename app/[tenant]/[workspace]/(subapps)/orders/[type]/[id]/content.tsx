'use client';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {Container} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {
  CUSTOMER_DELIVERY,
  DOWNLOAD_PDF,
  INVOICE,
  ORDER_NUMBER,
} from '@/subapps/orders/common/constants/orders';
import {
  Contact,
  DownloadButton,
  ExpandableCard,
  History,
  Informations,
  PaymentMethod,
  ProductsList,
  Total,
} from '@/subapps/orders/common/ui/components';
import {getStatus} from '@/subapps/orders/common/utils/orders';
import {formatDate} from '@/lib/core/locale/formatters';
import {OrderType} from '@/subapps/orders/common/types/orders';

const Content = ({order, orderType}: {order: any; orderType: OrderType}) => {
  const {
    saleOrderSeq,
    exTaxTotal,
    inTaxTotal,
    createdOn,
    shipmentMode,
    statusSelect,
    deliveryState,
    mainInvoicingAddress,
    deliveryAddress,
    saleOrderLineList,
    totalDiscount,
    id,
    invoices = [],
    customerDeliveries = [],
    orderReport,
  } = order;
  const {status, variant} = getStatus(statusSelect, deliveryState);

  const {workspaceURL, tenant} = useWorkspace();

  const hideDiscount = saleOrderLineList?.every(
    (item: any) => parseFloat(item.discountAmount) === 0,
  );

  return (
    <Container title={`${i18n.t(ORDER_NUMBER)} ${saleOrderSeq}`}>
      <Informations
        createdOn={createdOn}
        shipmentMode={shipmentMode}
        status={status}
        variant={variant}
        orderId={id}
        orderReport={orderReport}
        orderType={orderType}
      />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-4">
        <div className="col-span-12 xl:col-span-9 flex flex-col gap-6">
          <div className="flex flex-col gap-4  bg-card text-card-foreground p-6 rounded-lg">
            <Contact
              mainInvoicingAddress={mainInvoicingAddress}
              deliveryAddress={deliveryAddress}
            />
            <ProductsList
              saleOrderLineList={saleOrderLineList}
              tenant={tenant}
              hideDiscount={hideDiscount}
            />
            {false && <PaymentMethod />}
          </div>
          {false && <History />}
        </div>
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-6">
          <Total
            exTaxTotal={exTaxTotal}
            inTaxTotal={inTaxTotal}
            totalDiscount={totalDiscount}
            hideDiscount={hideDiscount}
          />

          {invoices?.length ? (
            <ExpandableCard title={i18n.t(INVOICE)} initialState={true}>
              <div className="flex flex-col divide-y divide-border">
                {invoices.map((record: any) => (
                  <div key={record.id} className="flex flex-col gap-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 truncate">{record.invoiceId}</div>
                      <div className="flex-1">
                        {formatDate(record.createdOn)}
                      </div>
                      <div className="flex justify-end">
                        <DownloadButton
                          downloadURL={`${workspaceURL}/${SUBAPP_CODES.orders}/api/order/${orderType}/${id}/invoice/${record.id}`}
                          title={i18n.t(DOWNLOAD_PDF)}
                          className="border-none p-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          ) : null}

          {customerDeliveries?.length ? (
            <ExpandableCard
              title={i18n.t(CUSTOMER_DELIVERY)}
              initialState={true}>
              <div className="flex flex-col divide-y divide-border">
                {customerDeliveries.map((record: any) => (
                  <div key={record.id} className="flex flex-col gap-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 truncate">
                        {record.stockMoveSeq}
                      </div>
                      <div className="flex-1">
                        {formatDate(record.createdOn)}
                      </div>
                      <div className="flex justify-end">
                        <DownloadButton
                          title={i18n.t(DOWNLOAD_PDF)}
                          downloadURL={`${workspaceURL}/${SUBAPP_CODES.orders}/api/order/${orderType}/${id}/customer-delivery/${record.id}`}
                          className="border-none p-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          ) : null}
        </div>
      </div>
    </Container>
  );
};

export default Content;
