'use client';

import React from 'react';

// ---- CORE IMPORTS ---- //
import {Separator, Container, Chip} from '@/ui/components';
import {i18n} from '@/locale';
import {PortalWorkspace} from '@/types';
import {formatDate} from '@/lib/core/locale/formatters';

// ---- LOCAL IMPORTS ---- //
import {Invoice, Total} from '@/subapps/invoices/common/ui/components';
import {INVOICE_TYPE} from '@/subapps/invoices/common/constants/invoices';
import type {Invoice as InvoiceType} from '@/subapps/invoices/common/types/invoices';

interface ContentProps {
  invoice: InvoiceType;
  workspace: PortalWorkspace;
  invoiceType: string;
}

export default function Content({
  invoice,
  workspace,
  invoiceType,
}: ContentProps) {
  const {invoiceId, dueDate, invoiceDate, isUnpaid} = invoice;

  const status = isUnpaid ? INVOICE_TYPE.UNPAID : INVOICE_TYPE.PAID;

  return (
    <Container title={`${i18n.t('Invoice number')} ${invoiceId}`}>
      <div className="bg-card text-card-foreground flex md:block flex-col md:flex-row px-6 py-4 rounded-lg">
        <h4 className="text-xl font-medium mb-0">{i18n.t('Informations')}</h4>
        <Separator className="my-2" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium mb-0">{i18n.t('Status')}:</h5>
            <Chip
              value={i18n.t(status)}
              className="font-normal text-[0.625rem] px-2 py-1"
              variant={isUnpaid ? 'destructive' : 'success'}
            />
          </div>
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium mb-0">
              {isUnpaid ? `${i18n.t('Due date:')}` : `${i18n.t('Paid on:')}`}
            </h5>
            <p className="text-sm">
              {formatDate(isUnpaid ? dueDate : invoiceDate)}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-12 gap-4 mb-6 rounded-lg">
        <div className="col-span-12 lg:col-span-9">
          <Invoice invoice={invoice} invoiceType={invoiceType} />
        </div>

        <div className="col-span-12 lg:col-span-3">
          <Total
            invoice={invoice}
            invoiceType={invoiceType}
            isUnpaid={isUnpaid}
            workspace={workspace}
          />
        </div>
      </div>
    </Container>
  );
}
