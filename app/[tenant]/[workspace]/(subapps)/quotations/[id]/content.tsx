'use client';

import {Suspense} from 'react';
import type {Cloned} from '@/types/util';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Container} from '@/ui/components';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {
  isCommentEnabled,
  SORT_TYPE,
  Comments,
  CommentsSkeleton,
} from '@/comments';
import {type PortalWorkspace} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import {
  Informations,
  Total,
  ContactDetails,
  ProductsList,
} from '@/subapps/quotations/common/ui/components';
import {QUOTATION_STATUS} from '@/subapps/quotations/common/constants/quotations';
import type {QuotationDetail} from '@/subapps/quotations/common/types/quotations';
import {
  fetchComments,
  createComment,
} from '@/subapps/quotations/common/actions';
import {withBasePath} from '@/lib/core/path/base-path';

const Content = ({
  quotation,
  workspace,
}: {
  quotation: QuotationDetail;
  workspace: PortalWorkspace | Cloned<PortalWorkspace>;
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

  const router = useRouter();
  const {workspaceURI, tenant} = useWorkspace();

  const enableComment = isCommentEnabled({
    subapp: SUBAPP_CODES.quotations,
    config: workspace.config,
  });

  const hideDiscount = saleOrderLineList?.every(
    item => parseFloat(String(item.discountAmount)) === 0,
  );

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
              hideDiscount={hideDiscount}
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
                attachmentDownloadUrl={withBasePath(
                  `${workspaceURI}/${SUBAPP_CODES.quotations}/api/comments/attachments/${quotation.id}`,
                )}
                trackingField="body"
                commentField="body"
                disableReply
              />
            </div>
          </Suspense>
        )}
      </Container>
    </>
  );
};

export default Content;
