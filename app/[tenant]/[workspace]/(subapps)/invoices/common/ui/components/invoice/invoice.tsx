'use client';

import {useEffect, useState} from 'react';
import axios from 'axios';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {DocViewer, Separator} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {InvoiceProps} from '@/subapps/invoices/common/types/invoices';

export function Invoice({invoice, invoiceType}: InvoiceProps) {
  const {workspaceURI} = useWorkspace();
  const [docFile, setDocFile] = useState<any>(null);

  useEffect(() => {
    let blobURL: string | null = null;

    const fetchInvoice = async () => {
      try {
        const response = await axios.get(
          `${workspaceURI}/${SUBAPP_CODES.invoices}/api/invoice/${invoiceType}/${invoice.id}`,
          {
            responseType: 'blob',
          },
        );

        let fileName = `invoice-${invoice.id}.pdf`;

        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+?)"?$/);
          if (match?.[1]) {
            fileName = match[1];
          }
        }

        blobURL = URL.createObjectURL(response.data);

        setDocFile({
          uri: blobURL,
          fileType: 'pdf',
          fileName,
        });
      } catch (error) {
        console.error('Error loading invoice file:', error);
      }
    };

    fetchInvoice();

    return () => {
      if (blobURL) {
        URL.revokeObjectURL(blobURL);
      }
    };
  }, [invoice.id, invoiceType, workspaceURI]);

  return (
    <div className="flex flex-col basis-full bg-card text-card-foreground px-6 py-4 gap-4 rounded-lg">
      <h4 className="text-xl font-medium mb-0">{i18n.t('Invoice')}</h4>
      <Separator />
      {docFile && <DocViewer documents={[docFile]} />}
    </div>
  );
}

export default Invoice;
