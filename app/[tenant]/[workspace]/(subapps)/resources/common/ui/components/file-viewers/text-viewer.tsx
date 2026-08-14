'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {ViewerMessage} from './viewer-message';
import {useFileText} from './use-file-text';
import {useFileURL} from './use-file-url';
import type {DmsFile} from '@/subapps/resources/common/types';

export function TextViewer({record}: {record: DmsFile}) {
  const url = useFileURL(record);
  const {text, truncated, loading, failed} = useFileText(url);

  if (loading)
    return <ViewerMessage>{i18n.t('Loading document…')}</ViewerMessage>;
  if (failed || text === null) {
    return (
      <ViewerMessage>
        {i18n.t('This document could not be shown. You can still download it.')}
      </ViewerMessage>
    );
  }

  return (
    <div className="flex flex-col">
      {truncated && (
        <p className="px-4 py-2 text-xs text-ink-500 bg-ink-50 border-b border-ink-100">
          {i18n.t(
            'Only the beginning is shown. Download the file to read it all.',
          )}
        </p>
      )}
      <pre className="p-4 overflow-auto max-h-[75vh] text-sm whitespace-pre-wrap break-words font-mono">
        {text}
      </pre>
    </div>
  );
}
