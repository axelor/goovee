'use client';

import axios from 'axios';
import {memo, useEffect, useMemo, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {DocViewer} from '@/ui/components';

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
    <div className="flex flex-col basis-full">
      <header className="px-6 py-4 border-b border-ink-100 bg-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
          {i18n.t('Document')}
        </p>
        <h2 className="text-lg font-bold text-ink-900">{i18n.t('Invoice')}</h2>
      </header>
      <div className="bg-ink-50 min-h-[600px]">
        {docFile && <DocViewer documents={documents} />}
        {/* BUG: if the DocViewer is re rendered, document is not displayed, memoizing the Invoice component fixes the issue */}
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';
