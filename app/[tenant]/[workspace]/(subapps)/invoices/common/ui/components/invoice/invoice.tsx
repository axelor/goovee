'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {PDFReader} from '@/ui/components/pdf-reader';

// ---- LOCAL IMPORTS ---- //
import {InvoiceProps} from '@/subapps/invoices/common/types/invoices';

export function Invoice({invoiceId, downloadURL}: InvoiceProps) {
  return (
    <div className="flex flex-col basis-full">
      <header className="px-6 py-4 border-b border-ink-100 bg-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
          {i18n.t('Document')}
        </p>
        <h2 className="text-lg font-bold text-ink-900">{i18n.t('Invoice')}</h2>
      </header>
      {/* A fixed height, so the reader has something to scroll within: left to
          grow, it shows every page at once and there is nowhere for an
          enlarged page to scroll to. */}
      <div className="bg-ink-50 flex">
        <PDFReader
          url={downloadURL}
          fileName={`invoice-${invoiceId}.pdf`}
          className="flex-1 h-[600px]"
        />
      </div>
    </div>
  );
}
