'use client';

import React, {Suspense, useCallback, useEffect, useRef, useState} from 'react';
import {MdOutlineRefresh} from 'react-icons/md';
import {useRouter} from 'next/navigation';
import {PayPalScriptProvider, PayPalButtons} from '@paypal/react-paypal-js';

// ---- CORE IMPORTS ---- //
import {useSearchParams, useToast} from '@/ui/hooks';
import {
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from '@/ui/components';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {DEFAULT_CURRENCY_CODE, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {
  isCommentEnabled,
  SORT_TYPE,
  Comments,
  CommentsSkeleton,
} from '@/comments';
import {useEnvironment} from '@/environment';
import {PaymentOption, type PortalWorkspace} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {
  Informations,
  Total,
  ContactDetails,
  ProductsList,
} from '@/subapps/quotations/common/ui/components';
import {QUOTATION_STATUS} from '@/subapps/quotations/common/constants/quotations';
import type {Quotation} from '@/subapps/quotations/common/types/quotations';
import {
  confirmQuotation,
  createStripeCheckoutSession,
  paypalCaptureOrder,
  paypalCreateOrder,
  validateStripePayment,
} from './action';
import {
  fetchComments,
  createComment,
} from '@/subapps/quotations/common/actions';

function Stripe({onApprove, quotation}: any) {
  const {workspaceURL} = useWorkspace();
  const {searchParams} = useSearchParams();
  const validateRef = useRef(false);
  const {toast} = useToast();

  const handleCreateCheckoutSession = async () => {
    try {
      const result = await createStripeCheckoutSession({
        quotation,
        workspaceURL,
      });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: result.message,
        });
      }

      const {url} = result;
      window.location.assign(url as string);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error processing stripe payment, try again.'),
      });
    }
  };

  const handleValidateStripePayment = useCallback(
    async ({stripeSessionId}: {stripeSessionId: string}) => {
      try {
        if (!stripeSessionId) {
          return;
        }

        const result = await validateStripePayment({
          stripeSessionId,
          quotation,
          workspaceURL,
        });

        if (result.error) {
          toast({
            variant: 'destructive',
            title: i18n.t(result.message),
          });
        } else {
          toast({
            variant: 'success',
            title: i18n.t('Quotation paid successfully'),
          });

          onApprove?.(result?.order);
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: i18n.t('Error processing stripe payment, try again.'),
        });
      }
    },
    [toast, onApprove, quotation, workspaceURL],
  );

  useEffect(() => {
    if (validateRef.current) {
      return;
    }

    const stripeSessionId = searchParams.get('stripe_session_id');
    const stripeError = searchParams.get('stripe_error');

    if (!(stripeSessionId && stripeError)) return;

    if (stripeError) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error processing stripe payment, try again.'),
      });
    } else if (stripeSessionId) {
      handleValidateStripePayment({stripeSessionId});
    }
    validateRef.current = true;
  }, [searchParams, toast, handleValidateStripePayment]);

  return (
    <Button
      className="h-[50px] bg-[#635bff] text-lg font-medium"
      onClick={handleCreateCheckoutSession}>
      {i18n.t('Pay with Stripe')}{' '}
    </Button>
  );
}

function Paypal({onApprove, quotation}: any) {
  const {toast} = useToast();
  const {workspaceURL} = useWorkspace();

  const handleCreatePaypalOrder = async (data: any, actions: any) => {
    const result: any = await paypalCreateOrder({quotation, workspaceURL});

    if (result.error) {
      toast({
        variant: 'destructive',
        title: result.message,
      });
    } else {
      return result?.order?.id;
    }
  };

  const handleApprovePaypalOrder = async (data: any, actions: any) => {
    const result = await paypalCaptureOrder({
      orderId: data.orderID,
      workspaceURL,
      quotation,
    });

    if (result?.error) {
      toast({
        variant: 'destructive',
        title: result.message,
      });
    } else {
      toast({
        variant: 'success',
        title: i18n.t('Quotation paid successfully'),
      });

      onApprove?.(result?.order);
    }
  };

  const env = useEnvironment();

  return (
    <PayPalScriptProvider
      options={{
        clientId: env.GOOVEE_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: quotation?.currency?.code || DEFAULT_CURRENCY_CODE,
        intent: 'capture',
        disableFunding: 'card',
      }}>
      <PayPalButtons
        style={{
          color: 'blue',
          shape: 'rect',
          height: 50,
        }}
        createOrder={handleCreatePaypalOrder}
        onApprove={handleApprovePaypalOrder}
      />
    </PayPalScriptProvider>
  );
}

const Content = ({
  quotation,
  workspace,
  orderSubapp,
}: {
  quotation: Quotation;
  workspace: PortalWorkspace;
  orderSubapp?: boolean;
}) => {
  const {
    saleOrderSeq,
    displayExTaxTotal,
    displayInTaxTotal,
    endOfValidityDate,
    mainInvoicingAddress,
    deliveryAddress,
    saleOrderLineList,
    totalDiscount,
    statusSelect,
  } = quotation;

  const [confirmingQuotation, setConfirmingQuotation] = useState(false);
  const {toast} = useToast();
  const router = useRouter();
  const {workspaceURL, workspaceURI, tenant} = useWorkspace();

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.quotations,
    workspace,
  });

  const hideDiscount = saleOrderLineList?.every(
    (item: any) => parseFloat(item.discountAmount) === 0,
  );

  const redirectOrder = (order?: {id: string}) => {
    if (orderSubapp && order) {
      router.replace(`${workspaceURI}/${SUBAPP_CODES.quotations}/${order?.id}`);
    } else {
      router.replace(`${workspaceURI}/shop`);
    }
  };

  const handleConfirmQuotation = async () => {
    setConfirmingQuotation(true);

    try {
      const result = await confirmQuotation({
        workspaceURL,
        quotationId: quotation.id as string,
      });

      setConfirmingQuotation(false);

      if (result.error) {
        toast({
          title: result.message,
          variant: 'destructive',
        });

        return;
      }

      toast({
        title: i18n.t('Quotation confirmed'),
        variant: 'success',
      });

      redirectOrder(result?.order);
    } catch (err) {
      toast({
        title: i18n.t('Error confirming quotation'),
        variant: 'destructive',
      });
    }
  };

  const paymentOptionSet = workspace?.config?.paymentOptionSet;

  const allowPayment = (type: PaymentOption) =>
    paymentOptionSet?.find((o: any) => o?.typeSelect === type);

  const allowPaypal = allowPayment(PaymentOption.paypal);
  const allowStripe = allowPayment(PaymentOption.stripe);

  const renderPaymentOptions = () => {
    if (!(allowPaypal && allowStripe)) {
      return <p>{i18n.t('No payment options available.')}</p>;
    }

    return (
      <>
        {allowPaypal && (
          <Paypal onApprove={redirectOrder} quotation={quotation} />
        )}
        {allowStripe && (
          <Stripe onApprove={redirectOrder} quotation={quotation} />
        )}
      </>
    );
  };

  const handleAddressSelection = () => {
    router.push(
      `${workspaceURI}/${SUBAPP_PAGE.account}/${SUBAPP_PAGE.addresses}?quotation=${quotation.id}`,
    );
  };

  return (
    <>
      <Container title={`${i18n.t('Quotation')} ${saleOrderSeq}`}>
        <Informations
          endOfValidityDate={endOfValidityDate}
          statusSelect={statusSelect}
        />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-4">
          <div className="col-span-12 xl:col-span-9 flex flex-col gap-6 order-2 xl:order-1">
            <div className="flex flex-col gap-4 bg-card text-card-foreground p-6 rounded-lg">
              <ContactDetails
                mainInvoicingAddress={mainInvoicingAddress}
                deliveryAddress={deliveryAddress}
                showAddressSelectionButton={
                  statusSelect === QUOTATION_STATUS.DRAFT_QUOTATION
                }
                onAddressSelection={handleAddressSelection}
              />
              <ProductsList
                saleOrderLineList={saleOrderLineList}
                tenant={tenant}
                hideDiscount={hideDiscount}
              />
            </div>
          </div>

          <div className="col-span-12 xl:col-span-3 flex flex-col gap-6 order-1 xl:order-2">
            <Total
              exTaxTotal={displayExTaxTotal}
              inTaxTotal={displayInTaxTotal}
              statusSelect={statusSelect}
              totalDiscount={totalDiscount}
              workspace={workspace}
              hideDiscount={hideDiscount}
              onConfirmQuotation={handleConfirmQuotation}
              renderPaymentOptions={renderPaymentOptions}
            />
          </div>
        </div>
        {enableComment && (
          <Suspense fallback={<CommentsSkeleton />}>
            <div className="rounded-md border bg-card p-4 mt-5">
              <h4 className="text-xl font-semibold border-b">
                {i18n.t('Comments')}
              </h4>
              <Comments
                recordId={quotation.id}
                subapp={SUBAPP_CODES.quotations}
                sortBy={SORT_TYPE.new}
                showCommentsByDefault
                hideTopBorder
                hideCloseComments
                hideCommentsHeader
                hideSortBy
                showRepliesInMainThread
                createComment={createComment}
                fetchComments={fetchComments}
                attachmentDownloadUrl={`${workspaceURI}/${SUBAPP_CODES.quotations}/api/comments/attachments/${quotation.id}`}
                trackingField="body"
                commentField="body"
                disableReply
              />
            </div>
          </Suspense>
        )}
      </Container>
      <Dialog open={confirmingQuotation}>
        <DialogTitle></DialogTitle>
        <DialogContent className="w-40 flex items-center justify-center">
          <MdOutlineRefresh className="h-6 w-6 animate-spin" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Content;
