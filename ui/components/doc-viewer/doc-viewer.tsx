'use client';

import CyntlerDocViewer, {DocViewerRenderers} from '@cyntler/react-doc-viewer';
import '@cyntler/react-doc-viewer/dist/index.css';
import type {IDocument} from '@cyntler/react-doc-viewer';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';

import styles from './doc-viewer.module.scss';

export function DocViewer({
  documents,
  className,
}: {
  documents: IDocument[];
  className?: string;
}) {
  if (!documents?.length) return;
  return (
    <div className={cn('overflow-auto', className)}>
      <CyntlerDocViewer
        documents={documents}
        pluginRenderers={DocViewerRenderers}
        config={{
          header: {
            disableHeader: true,
          },
        }}
        className={styles['doc-viewer']}
      />
    </div>
  );
}

export default DocViewer;
