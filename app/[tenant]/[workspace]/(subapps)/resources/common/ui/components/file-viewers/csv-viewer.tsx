'use client';

import {useMemo} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {
  detectSeparator,
  parseDelimited,
} from '@/subapps/resources/common/utils/delimited';
import {ViewerMessage} from './viewer-message';
import {useFileText} from './use-file-text';
import {useFileURL} from './use-file-url';
import type {DmsFile} from '@/subapps/resources/common/types';

export function CSVViewer({record}: {record: DmsFile}) {
  const url = useFileURL(record);
  const {text, truncated, loading, failed} = useFileText(url);

  const rows = useMemo(
    () => (text === null ? [] : parseDelimited(text, detectSeparator(text))),
    [text],
  );

  if (loading) {
    return <ViewerMessage>{i18n.t('Loading document…')}</ViewerMessage>;
  }

  if (failed || text === null) {
    return (
      <ViewerMessage>
        {i18n.t('This document could not be shown. You can still download it.')}
      </ViewerMessage>
    );
  }

  if (!rows.length) {
    return <ViewerMessage>{i18n.t('This file is empty.')}</ViewerMessage>;
  }

  const [header, ...body] = rows;

  return (
    <div className="flex flex-col">
      {truncated && (
        <p className="px-4 py-2 text-xs text-ink-500 bg-ink-50 border-b border-ink-100">
          {i18n.t(
            'Only the first rows are shown. Download the file to read it all.',
          )}
        </p>
      )}
      <div className="overflow-auto max-h-[75vh]">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-ink-50 sticky top-0">
            <tr>
              {header.map((cell, index) => (
                <th
                  key={index}
                  scope="col"
                  className="text-start font-semibold px-3 py-2 border-b border-ink-200 whitespace-nowrap">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((cells, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-ink-25">
                {cells.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-3 py-1.5 border-b border-ink-100 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
