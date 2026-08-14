'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Document, Page, pdfjs} from 'react-pdf';
import {
  MdErrorOutline,
  MdOutlineZoomIn,
  MdOutlineZoomOut,
  MdRefresh,
} from 'react-icons/md';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ---- CORE IMPORTS ---- //
import {withBasePath} from '@/lib/core/path/base-path';
import {i18n} from '@/locale';
import {cn} from '@/utils/css';

/*
 * Everything the reader fetches for itself is served from this installation.
 * The worker does the parsing away from the main thread; the rest is looked up
 * only when a document turns out to need it. Naming them all keeps reading a
 * document from depending on reaching anything outside the installation, and
 * keeps the address of a document from being handed to anything outside it.
 *
 * Addressed by the reader's own version, which is also how they are filed when
 * they are copied out. The worker has to match the page that starts it, so an
 * address that stayed the same across an upgrade would let a browser go on
 * using the copy it had kept and leave every document unreadable.
 */
const ASSETS = withBasePath(`/pdfjs/${pdfjs.version}`);

pdfjs.GlobalWorkerOptions.workerSrc = `${ASSETS}/build/pdf.worker.min.mjs`;

const READER_OPTIONS = {
  cMapUrl: `${ASSETS}/cmaps/`,
  iccUrl: `${ASSETS}/iccs/`,
  standardFontDataUrl: `${ASSETS}/standard_fonts/`,
  wasmUrl: `${ASSETS}/wasm/`,
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

/** Space left either side of a page so it is not flush against the frame. */
const PAGE_MARGIN = 32;

/** Proportions a page is assumed to have until it has been drawn. */
const PAGE_RATIO = 1.414;

/*
 * How far outside the visible area a page is prepared. Drawing every page of a
 * long document at once costs more than fetching it does, so a page is drawn as
 * it comes into reach and its place is held by a box of the right size until
 * then — which is also what lets the first page appear while the rest of the
 * document is still arriving.
 */
const PAGE_LOOKAHEAD = '150% 0px';

export function PDFReader({
  url,
  fileName,
  className,
}: {
  url: string;
  fileName?: string;
  className?: string;
}) {
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const outer = useRef<HTMLDivElement>(null);

  /*
   * Pages are drawn to the width they are shown at, so the document stays
   * legible on a narrow screen. Measured on the frame rather than on the part
   * that scrolls: that one loses width to its own scroll bar the moment the
   * document is long enough to need one, which would set every page redrawing
   * at a new size the instant the first one appeared.
   */
  useEffect(() => {
    const element = outer.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const onLoad = useCallback(({numPages}: {numPages: number}) => {
    setPageCount(numPages);
    setFailed(false);
  }, []);

  const onFail = useCallback((error: Error) => {
    console.error('[PDF] failed to open the document:', error);
    setFailed(true);
  }, []);

  const file = useMemo(() => ({url}), [url]);

  const pageWidth = width ? Math.max(1, width - PAGE_MARGIN) * zoom : null;

  return (
    /*
     * Kept from growing to fit its contents. Pages are drawn to the width
     * measured here, and the frame below sizes itself to its widest page, so
     * anywhere the two are free to push each other outwards they will: every
     * page is redrawn wider, which widens the frame, on every pass.
     */
    <div ref={outer} className={cn('flex flex-col min-w-0', className)}>
      <Toolbar
        pageCount={pageCount}
        zoom={zoom}
        onZoom={setZoom}
        disabled={failed}
      />

      <div
        ref={setScroller}
        tabIndex={0}
        role="region"
        aria-label={fileName ?? i18n.t('Document')}
        className="flex-1 overflow-auto bg-ink-100">
        <Document
          file={file}
          options={READER_OPTIONS}
          onLoadSuccess={onLoad}
          onLoadError={onFail}
          onSourceError={onFail}
          loading={<Notice>{i18n.t('Loading document…')}</Notice>}
          error={<Failure />}
          /* Sized to its widest page rather than to the frame, so a page
           * enlarged past the frame is reachable at both edges. Centred
           * content that simply overflows can only be scrolled towards one of
           * them. Only once there are pages: applied to a message instead, it
           * pushes the message off-centre on a narrow screen. */
          className={cn(
            'flex flex-col items-center gap-2 py-2',
            pageCount > 0 && 'w-max min-w-full',
          )}>
          {pageWidth !== null &&
            Array.from({length: pageCount}, (_, index) => (
              <LazyPage
                key={index}
                pageNumber={index + 1}
                width={pageWidth}
                fileName={fileName}
                root={scroller}
              />
            ))}
        </Document>
      </div>
    </div>
  );
}

/**
 * A page that is drawn once it comes within reach of the visible area, and
 * holds its place with a box of the same proportions until it has been.
 */
function LazyPage({
  pageNumber,
  width,
  fileName,
  root,
}: {
  pageNumber: number;
  width: number;
  fileName?: string;
  root: HTMLElement | null;
}) {
  const [reached, setReached] = useState(pageNumber === 1);
  const [drawn, setDrawn] = useState(false);
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = slot.current;
    if (!element || reached) return;

    /* Measured against the part that scrolls. Left to the window instead, the
     * frame clips the page out of view before the allowance below is applied
     * and nothing is ever prepared in advance. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setReached(true);
      },
      {root, rootMargin: PAGE_LOOKAHEAD},
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reached, root]);

  const label = fileName
    ? i18n.t('{0}, page {1}', fileName, String(pageNumber))
    : i18n.t('Page {0}', String(pageNumber));

  return (
    <div
      ref={slot}
      /* Not `img`: that tells a screen reader the whole thing is one picture
       * and to ignore what is inside it, which is where the page's text is. */
      role="group"
      aria-label={label}
      className="shadow-soft-md bg-white"
      /* The place is kept until the page has actually been drawn, not merely
       * asked for: the reader answers one page at a time, and releasing the
       * space at the point of asking moves everything below it up and away
       * from whoever is reading. */
      style={drawn ? undefined : {width, height: width * PAGE_RATIO}}>
      {reached && (
        <Page
          pageNumber={pageNumber}
          width={width}
          onLoadSuccess={() => setDrawn(true)}
          loading={<Notice>{i18n.t('Loading page…')}</Notice>}
          error={<Notice>{i18n.t('This page could not be shown.')}</Notice>}
        />
      )}
    </div>
  );
}

function Toolbar({
  pageCount,
  zoom,
  onZoom,
  disabled,
}: {
  pageCount: number;
  zoom: number;
  onZoom: (zoom: number) => void;
  disabled: boolean;
}) {
  const step = (by: number) =>
    onZoom(
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((zoom + by).toFixed(2)))),
    );

  return (
    <div className="flex items-center justify-end gap-1 px-3 py-2 bg-ink-50 border-b border-ink-100">
      {pageCount > 0 && (
        <span className="me-auto text-xs text-ink-500">
          {pageCount === 1
            ? i18n.t('1 page')
            : i18n.t('{0} pages', String(pageCount))}
        </span>
      )}
      <ToolbarButton
        label={i18n.t('Zoom out')}
        disabled={disabled || zoom <= MIN_ZOOM}
        onClick={() => step(-ZOOM_STEP)}>
        <MdOutlineZoomOut />
      </ToolbarButton>
      <span className="w-12 text-center text-xs text-ink-500 tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <ToolbarButton
        label={i18n.t('Zoom in')}
        disabled={disabled || zoom >= MAX_ZOOM}
        onClick={() => step(ZOOM_STEP)}>
        <MdOutlineZoomIn />
      </ToolbarButton>
      <ToolbarButton
        label={i18n.t('Reset zoom')}
        disabled={disabled || zoom === 1}
        onClick={() => onZoom(1)}>
        <MdRefresh />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid place-items-center w-8 h-8 rounded-lg text-ink-600 hover:bg-ink-100 disabled:opacity-40 disabled:hover:bg-transparent">
      {children}
    </button>
  );
}

function Notice({children}: {children: React.ReactNode}) {
  return <div className="p-8 text-center text-sm text-ink-500">{children}</div>;
}

function Failure() {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-ink-500">
      <MdErrorOutline className="text-2xl" />
      {i18n.t('This document could not be shown. You can still download it.')}
    </div>
  );
}
