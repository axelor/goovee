'use client';

import {useEffect, useState} from 'react';

/**
 * How much of a text document is read to show it.
 *
 * Text documents have no upper size, and one large enough to exhaust the
 * browser is no harder to attach than a small one. The beginning is asked for
 * by itself and the page says when there is more, which costs one request
 * rather than the whole file.
 */
const PREVIEW_BYTES = 512 * 1024;

/**
 * Cut a partial read back to its last whole line.
 *
 * The read stops at a byte count, so it can end part way through a line — and
 * part way through a character, which then shows as `�`. A read with no line
 * break at all is left as it is.
 */
function toWholeLines(text: string): string {
  const lastBreak = text.lastIndexOf('\n');
  return lastBreak === -1 ? text : text.slice(0, lastBreak + 1);
}

export interface FileText {
  text: string | null;
  truncated: boolean;
  loading: boolean;
  failed: boolean;
}

export function useFileText(url: string): FileText {
  const [state, setState] = useState<FileText>({
    text: null,
    truncated: false,
    loading: true,
    failed: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, {
      signal: controller.signal,
      headers: {range: `bytes=0-${PREVIEW_BYTES - 1}`},
    })
      .then(async response => {
        if (!response.ok) throw new Error(String(response.status));

        /* Answered in part means there is more than was asked for. A server
         * that ignored the request sends the whole file instead, which is
         * equally usable and simply not truncated. */
        const total = Number(
          response.headers.get('content-range')?.split('/').pop(),
        );

        const body = await response.text();
        const truncated = response.status === 206 && total > PREVIEW_BYTES;

        setState({
          text: truncated ? toWholeLines(body) : body,
          truncated,
          loading: false,
          failed: false,
        });
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') return;
        console.error('[RESOURCES] failed to read the document:', error);
        setState({text: null, truncated: false, loading: false, failed: true});
      });

    return () => controller.abort();
  }, [url]);

  return state;
}
