'use client';

import {useCallback, useEffect, useState} from 'react';
import {
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdDownload,
  MdVisibility,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {Dialog, DialogClose, DialogContent, DialogTitle} from '@/ui/components';

type Image = {id: string; url: string; name?: string | null};

export function AttachmentViewer({images}: {images: Image[]}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  const go = useCallback(
    (delta: number) => {
      setOpenIndex(i =>
        i === null ? i : (i + delta + images.length) % images.length,
      );
    },
    [images.length],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, go]);

  if (!images.length) return null;

  const current = openIndex === null ? null : images[openIndex];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button
            type="button"
            key={img.id}
            onClick={() => setOpenIndex(i)}
            aria-label={i18n.t('View image')}
            className="group relative block overflow-hidden rounded-[10px] border border-ink-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.name ?? ''}
              loading="lazy"
              className="w-full h-32 object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/40 transition-colors">
              <MdVisibility className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={o => !o && setOpenIndex(null)}>
        <DialogContent
          hideClose
          className="max-w-4xl w-fit p-3 bg-black/90 border-none">
          <DialogTitle className="sr-only">
            {current?.name || i18n.t('Image')}
          </DialogTitle>
          {current && (
            <div className="relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt={current.name ?? ''}
                className="max-h-[80vh] max-w-full w-auto object-contain rounded-md"
              />
              {/* Download + close, styled for the dark backdrop */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <a
                  href={current.url}
                  download={current.name ?? ''}
                  aria-label={i18n.t('Download image')}
                  className="grid place-items-center size-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                  <MdDownload className="size-5" />
                </a>
                <DialogClose
                  aria-label={i18n.t('Close')}
                  className="grid place-items-center size-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                  <MdClose className="size-5" />
                </DialogClose>
              </div>
              {images.length > 1 && (
                <>
                  <NavButton side="left" onClick={() => go(-1)} />
                  <NavButton side="right" onClick={() => go(1)} />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[12px] font-medium tabular-nums">
                    {openIndex! + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: 'left' | 'right';
  onClick: () => void;
}) {
  const Icon = side === 'left' ? MdChevronLeft : MdChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={i18n.t(side === 'left' ? 'Previous image' : 'Next image')}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 grid place-items-center size-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors',
        side === 'left' ? 'left-2' : 'right-2',
      )}>
      <Icon className="size-6" />
    </button>
  );
}

export default AttachmentViewer;
