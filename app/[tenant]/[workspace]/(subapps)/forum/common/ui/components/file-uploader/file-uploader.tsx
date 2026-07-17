'use client';

import React, {useEffect, useRef, useState} from 'react';
import {
  MdClose,
  MdDeleteOutline,
  MdOutlineFileUpload,
  MdOutlineUploadFile,
} from 'react-icons/md';
import * as DialogPrimitive from '@radix-ui/react-dialog';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {FileIcon} from '@/ui/components';
import {useToast} from '@/ui/hooks/use-toast';
import {getFileSizeText} from '@/utils/files';

// ---- LOCAL IMPORTS ---- //
import {
  CLICK_HERE_DRAG_DROP_FILE,
  FILE_TITLE,
  FORUM_ATTACHMENT_DOC_MIMES,
  SUPPORTED_FILE_PDF_DOC,
  UPLOAD,
} from '@/subapps/forum/common/constants';

const DOC_ACCEPT = FORUM_ATTACHMENT_DOC_MIMES.join(',');

interface DocItem {
  file: File;
  title: string;
  uploadId?: string;
}

interface FileUploaderProps {
  open: boolean;
  initialValue: DocItem[];
  onUpload: (docs: DocItem[]) => void;
  handleClose: () => void;
}

export const FileUploader = ({
  open,
  initialValue,
  onUpload,
  handleClose,
}: FileUploaderProps) => {
  const [docs, setDocs] = useState<DocItem[]>(initialValue ?? []);
  const inputRef = useRef<HTMLInputElement>(null);

  const {toast} = useToast();

  useEffect(() => {
    setDocs(initialValue ?? []);
  }, [initialValue]);

  // Open the native file picker reliably (a bare <label htmlFor> can be flaky
  // inside a portalled dialog — drive the input imperatively instead).
  const openPicker = () => inputRef.current?.click();

  // accept only the supported document types; reject the rest at pick time
  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const accepted: DocItem[] = [];
    Array.from(fileList).forEach(file => {
      if (FORUM_ATTACHMENT_DOC_MIMES.includes(file.type)) {
        accepted.push({file, title: file.name});
      } else {
        toast({
          variant: 'destructive',
          title: i18n.t('{0} could not be added', file.name),
        });
      }
    });
    if (accepted.length) setDocs(prev => [...prev, ...accepted]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };

  const handleTitleChange = (index: number, value: string) => {
    setDocs(prev =>
      prev.map((doc, i) => (i === index ? {...doc, title: value} : doc)),
    );
  };

  const removeDoc = (index: number) => {
    setDocs(prev => prev.filter((_, i) => i !== index));
  };

  const confirm = () => {
    onUpload(docs);
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
            'fixed inset-0 z-[60] m-auto flex h-fit max-h-[90vh] w-[calc(100%-2rem)] max-w-[560px] flex-col overflow-hidden rounded-[20px] bg-white shadow-xl focus:outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}>
          <DialogPrimitive.Title className="sr-only">
            {i18n.t('Attach files')}
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
                <MdOutlineUploadFile className="size-5" />
              </div>
              <div>
                <h2 className="text-[19px] font-extrabold tracking-[-0.015em]">
                  {i18n.t('Attach files')}
                </h2>
                <p className="mt-0.5 text-[13px] text-white/85">
                  {i18n.t('Add documents to your discussion')}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6"
            onDrop={handleDrop}
            onDragOver={event => event.preventDefault()}>
            {docs.length === 0 ? (
              <button
                type="button"
                onClick={openPicker}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-150 py-12 transition-colors hover:border-royal hover:bg-royal-pale/40">
                <div className="grid size-14 place-items-center rounded-full bg-royal-pale text-royal">
                  <MdOutlineFileUpload className="size-7" />
                </div>
                <div className="px-4 text-center">
                  <p className="text-sm font-semibold text-ink-800">
                    {i18n.t(CLICK_HERE_DRAG_DROP_FILE)}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-500">
                    {i18n.t(SUPPORTED_FILE_PDF_DOC)}
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {docs.map((doc, index) => (
                  <div
                    key={doc.uploadId ?? `${doc.file.name}-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-ink-150 p-3">
                    <FileIcon
                      fileType={doc.file.type}
                      className="size-7 shrink-0"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="line-clamp-1 text-[12.5px] text-ink-500">
                        {doc.file.name} — {getFileSizeText(doc.file.size)}
                      </span>
                      <input
                        placeholder={i18n.t(FILE_TITLE)}
                        className="h-9 w-full rounded-[8px] border border-ink-150 px-3 text-[13px] text-ink-800 outline-none transition-colors focus:border-royal"
                        value={doc.title}
                        onChange={e => handleTitleChange(index, e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDoc(index)}
                      aria-label={i18n.t('Remove')}
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-destructive transition-colors hover:bg-destructive/10">
                      <MdDeleteOutline className="size-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={openPicker}
                  className="self-start text-[13px] font-semibold text-royal transition-colors hover:text-royal-dark">
                  + {i18n.t('Add more files')}
                </button>
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
            {docs.length === 0 ? (
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
                <MdOutlineUploadFile className="size-4" />
                {i18n.t(UPLOAD)}
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            id="file-upload"
            type="file"
            multiple
            accept={DOC_ACCEPT}
            className="hidden"
            onChange={handleFileUpload}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
