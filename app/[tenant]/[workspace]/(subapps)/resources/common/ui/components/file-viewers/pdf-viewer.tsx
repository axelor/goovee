'use client';

// ---- CORE IMPORTS ---- //
import {PDFReader} from '@/ui/components/pdf-reader';

// ---- LOCAL IMPORTS ---- //
import {useFileURL} from './use-file-url';
import type {DmsFile} from '@/subapps/resources/common/types';

export function PDFViewer({record}: {record: DmsFile}) {
  const url = useFileURL(record);

  return (
    <PDFReader
      url={url}
      fileName={record.fileName ?? undefined}
      className="h-[75vh]"
    />
  );
}
