'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdOutlineContentCopy,
  MdOutlineFileUpload,
  MdOutlineImage,
} from 'react-icons/md';
import * as DialogPrimitive from '@radix-ui/react-dialog';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {formatNumber} from '@/locale/formatters';
import {useToast} from '@/ui/hooks/use-toast';

// ---- LOCAL IMPORTS ---- //
import {
  ALERTNATE_TEXT,
  CLICK_HERE_DRAG_DROP,
  MAX_FORUM_ATTACHMENTS,
  OUT_OF,
  SUPPORTED_FILE_JPG_PNG,
  UPLOAD,
} from '@/subapps/forum/common/constants';
import {ImageViewer} from '@/subapps/forum/common/ui/components';

interface ImageItem {
  file: File;
  altText: string;
  uploadId?: string;
}

interface ImageUploaderProps {
  initialValue?: ImageItem[];
  open: boolean;
  handleClose: () => void;
  onUpload: (images: ImageItem[]) => void;
}

export const ImageUploader = ({
  initialValue,
  open,
  handleClose,
  onUpload,
}: ImageUploaderProps) => {
  const [images, setImages] = useState<ImageItem[]>(initialValue ?? []);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {toast} = useToast();

  // Open the native file picker reliably (a bare <label htmlFor> can be flaky
  // inside a portalled dialog — drive the input imperatively instead).
  const openPicker = () => inputRef.current?.click();

  /*
   * Accept only images, and never more than MAX_FORUM_ATTACHMENTS in total:
   * non-images are rejected with a toast, and any picked beyond the remaining
   * room are dropped with a toast.
   */
  const addImageFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const accepted: ImageItem[] = [];
      Array.from(fileList).forEach(file => {
        if (file.type.startsWith('image/')) {
          accepted.push({file, altText: ''});
        } else {
          toast({
            variant: 'destructive',
            title: i18n.t('{0} could not be added', file.name),
          });
        }
      });
      if (!accepted.length) return;

      const room = Math.max(0, MAX_FORUM_ATTACHMENTS - images.length);
      const toAdd = accepted.slice(0, room);
      if (toAdd.length < accepted.length) {
        toast({
          variant: 'destructive',
          title: i18n.t(
            'You can add up to {0} files',
            String(MAX_FORUM_ATTACHMENTS),
          ),
        });
      }
      if (toAdd.length) setImages(prev => [...prev, ...toAdd]);
    },
    [images, toast],
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addImageFiles(e.target.files);
      e.target.value = '';
    },
    [addImageFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      addImageFiles(e.dataTransfer.files);
      setIsDragging(false);
    },
    [addImageFiles],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleAltChange = (value: string) => {
    setImages(prev =>
      prev.map((img, i) =>
        i === selectedIndex ? {...img, altText: value} : img,
      ),
    );
  };

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    setSelectedIndex(si => Math.max(0, Math.min(si, next.length - 1)));
  };

  const copyImage = (index: number) => {
    if (images.length >= MAX_FORUM_ATTACHMENTS) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          'You can add up to {0} files',
          String(MAX_FORUM_ATTACHMENTS),
        ),
      });
      return;
    }
    setImages(prev => [
      ...prev,
      {file: images[index].file, altText: images[index].altText},
    ]);
  };

  useEffect(() => {
    if (initialValue?.length) {
      setImages(initialValue ?? []);
    }
  }, [initialValue]);

  const confirm = () => {
    onUpload(images);
    handleClose();
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) handleClose();
      }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[60] bg-ink-900/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-0 z-[60] m-auto flex h-fit max-h-[90vh] w-[calc(100%-2rem)] max-w-[720px] flex-col overflow-hidden rounded-[20px] bg-white shadow-xl focus:outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}>
          <DialogPrimitive.Title className="sr-only">
            {i18n.t('Attach images')}
          </DialogPrimitive.Title>

          {/* Header — royal gradient + dots pattern (matches New discussion) */}
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-royal-dark to-royal px-6 py-[22px] text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
            <button
              type="button"
              onClick={handleClose}
              aria-label={i18n.t('Close')}
              className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25">
              <MdClose className="size-4" />
            </button>
            <div className="relative flex items-center gap-3.5">
              <div className="grid size-11 shrink-0 place-items-center rounded-[11px] bg-white/[0.18]">
                <MdOutlineImage className="size-5" />
              </div>
              <div>
                <h2 className="text-[19px] font-extrabold tracking-[-0.015em]">
                  {i18n.t('Attach images')}
                </h2>
                <p className="mt-0.5 text-[13px] text-white/85">
                  {i18n.t('Add images to your discussion')}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div
            className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}>
            {images.length === 0 ? (
              <button
                type="button"
                onClick={openPicker}
                className={cn(
                  'flex w-full flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 transition-colors',
                  isDragging
                    ? 'border-royal bg-royal-pale/40'
                    : 'border-ink-150 hover:border-royal hover:bg-royal-pale/40',
                )}>
                <div className="grid size-14 place-items-center rounded-full bg-royal-pale text-royal">
                  <MdOutlineImage className="size-7" />
                </div>
                <div className="px-4 text-center">
                  <p className="text-sm font-semibold text-ink-800">
                    {i18n.t(CLICK_HERE_DRAG_DROP)}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-500">
                    {i18n.t(SUPPORTED_FILE_JPG_PNG)}
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row">
                {/* Preview + alt text */}
                <div className="flex flex-1 flex-col gap-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-ink-150 bg-ink-25">
                    {images[selectedIndex] && (
                      <ImageViewer file={images[selectedIndex].file} />
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-bold text-ink-800">
                      {i18n.t(ALERTNATE_TEXT)}
                    </label>
                    <input
                      name="altText"
                      value={images[selectedIndex]?.altText || ''}
                      onChange={e => handleAltChange(e.target.value)}
                      placeholder={i18n.t('Alternate Text')}
                      className="h-10 w-full rounded-[10px] border border-ink-150 px-3.5 text-[14px] text-ink-800 outline-none transition-colors focus:border-royal"
                    />
                  </div>
                </div>

                {/* Thumbnails + controls */}
                <div className="flex w-full flex-col rounded-xl border border-ink-150 p-3 lg:w-[280px]">
                  <p className="mb-2 text-[12.5px] text-ink-500">
                    {`${formatNumber(selectedIndex + 1)} ${i18n.t(OUT_OF)} ${formatNumber(images.length)}`}
                  </p>
                  <div className="grid max-h-[320px] grid-cols-3 gap-2 overflow-y-auto">
                    {images.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedIndex(i)}
                        className={cn(
                          'relative aspect-square overflow-hidden rounded-lg border transition-colors',
                          selectedIndex === i
                            ? 'border-royal ring-2 ring-royal/30'
                            : 'border-ink-150 hover:border-royal/50',
                        )}>
                        <ImageViewer file={item.file} />
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 border-t border-ink-100 pt-3">
                    <button
                      type="button"
                      onClick={() => copyImage(selectedIndex)}
                      aria-label={i18n.t('Copy')}
                      className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100">
                      <MdOutlineContentCopy className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(selectedIndex)}
                      aria-label={i18n.t('Remove')}
                      className="grid size-9 place-items-center rounded-lg text-destructive transition-colors hover:bg-destructive/10">
                      <MdDeleteOutline className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={openPicker}
                      aria-label={i18n.t('Add image')}
                      className="grid size-9 place-items-center rounded-lg text-royal transition-colors hover:bg-royal-pale">
                      <MdAdd className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-ink-100 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-[10px] border border-ink-150 bg-white px-[18px] py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-25">
              {i18n.t('Cancel')}
            </button>
            {images.length === 0 ? (
              <button
                type="button"
                onClick={openPicker}
                className="inline-flex items-center gap-2 rounded-[10px] bg-royal px-[22px] py-2.5 text-sm font-bold text-white shadow-[0_1px_2px_rgba(13,30,75,0.15),0_6px_14px_rgba(13,30,75,0.18)] transition-colors hover:bg-royal-dark">
                <MdOutlineFileUpload className="size-4" />
                {i18n.t('Browse files')}
              </button>
            ) : (
              <button
                type="button"
                onClick={confirm}
                className="inline-flex items-center gap-2 rounded-[10px] bg-royal px-[22px] py-2.5 text-sm font-bold text-white shadow-[0_1px_2px_rgba(13,30,75,0.15),0_6px_14px_rgba(13,30,75,0.18)] transition-colors hover:bg-royal-dark">
                <MdOutlineImage className="size-4" />
                {i18n.t(UPLOAD)}
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
