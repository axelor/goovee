'use client';

import axios from 'axios';
import {memo, useEffect, useMemo, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {DocViewer, Separator} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {InvoiceProps} from '@/subapps/invoices/common/types/invoices';
import type {IDocument} from '@cyntler/react-doc-viewer';

export const Invoice = memo(({invoiceId, downloadURL}: InvoiceProps) => {
  const [docFile, setDocFile] = useState<IDocument | null>(null);

  useEffect(() => {
    let flag = true;
    let blobURL: string | null = null;

    const fetchInvoice = async () => {
      try {
        const response = await axios.get(downloadURL, {
          responseType: 'blob',
        });

        let fileName = `invoice-${invoiceId}.pdf`;

        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+?)"?$/);
          if (match?.[1]) {
            fileName = match[1];
          }
        }

        if (flag) {
          blobURL = URL.createObjectURL(response.data);
          setDocFile({
            uri: blobURL,
            fileType: 'pdf',
            fileName,
          });
        }
      } catch (error) {
        console.error('Error loading invoice file:', error);
      }
    };

    fetchInvoice();

    return () => {
      flag = false;
      if (blobURL) {
        URL.revokeObjectURL(blobURL);
      }
    };
  }, [invoiceId, downloadURL]);

  const documents = useMemo(() => {
    if (!docFile) return [];
    return [docFile];
  }, [docFile]);

  return (
    <div className="flex flex-col basis-full bg-card text-card-foreground px-6 py-4 gap-4 rounded-lg">
      <h4 className="text-xl font-medium mb-0">{i18n.t('Invoice')}</h4>
      <Separator />
      {
        docFile && <DocViewer documents={documents} />
        // BUG: if the DocViewer is re rendered, document is not displayed, memoizing the Invoice component fixes the issue
      }
    </div>
  );
});

Invoice.displayName = 'Invoice';
