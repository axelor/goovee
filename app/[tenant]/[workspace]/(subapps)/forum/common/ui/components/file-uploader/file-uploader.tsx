'use client';

import React, {useEffect, useState} from 'react';
import {MdClose, MdDeleteOutline} from 'react-icons/md';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Button,
  FileIcon,
  Input,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/ui/components';
import {useToast} from '@/ui/hooks/use-toast';
import {getFileSizeText} from '@/utils/files';
import {withBasePath} from '@/lib/core/path/base-path';

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

  const {toast} = useToast();

  useEffect(() => {
    setDocs(initialValue ?? []);
  }, [initialValue]);

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`max-w-screen-lg h-fit p-1 lg:p-4`}>
        <DialogTitle className="hidden" />
        <div className="bg-white w-full h-screen lg:h-full z-[100]">
          <ScrollArea className="relative w-full h-fit max-h-[90vh] pt-8">
            <Button
              className="w-6 h-6 flex items-center justify-center rounded-full p-px absolute top-0 right-0 cursor-pointer bg-white hover:bg-white"
              onClick={handleClose}>
              <MdClose className="h-full w-full text-muted-foreground" />
            </Button>
            <div
              className="flex flex-col w-full h-full gap-4"
              onDrop={handleDrop}
              onDragOver={event => event.preventDefault()}>
              {docs.length === 0 ? (
                <label
                  htmlFor="file-upload"
                  className="w-full rounded-sm border flex flex-col gap-2 md:gap-4 items-center justify-center h-full cursor-pointer p-2">
                  <div className="w-[24.063rem] h-[18.313rem] relative my-2">
                    <Image
                      fill
                      src={withBasePath('/images/upload.png')}
                      className="aspect-auto"
                      objectFit="contain"
                      alt="Upload png"
                    />
                  </div>
                  <h2>{i18n.t(CLICK_HERE_DRAG_DROP_FILE)}</h2>
                  <span className="text-muted-foreground">
                    {i18n.t(SUPPORTED_FILE_PDF_DOC)}
                  </span>
                </label>
              ) : (
                <div className="flex flex-col gap-3 p-2">
                  {docs.map((doc, index) => (
                    <div
                      key={doc.uploadId ?? `${doc.file.name}-${index}`}
                      className="flex items-center gap-2 border rounded-md p-2">
                      <FileIcon
                        fileType={doc.file.type}
                        className="h-6 w-6 shrink-0"
                      />
                      <div className="flex flex-col flex-1 gap-1">
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {doc.file.name} - {getFileSizeText(doc.file.size)}
                        </span>
                        <Input
                          placeholder={i18n.t(FILE_TITLE)}
                          className="h-9 shadow-none"
                          value={doc.title}
                          onChange={e =>
                            handleTitleChange(index, e.target.value)
                          }
                        />
                      </div>
                      <MdDeleteOutline
                        className="w-6 h-6 text-destructive cursor-pointer shrink-0"
                        onClick={() => removeDoc(index)}
                      />
                    </div>
                  ))}
                  <label
                    htmlFor="file-upload"
                    className="self-start text-sm text-success cursor-pointer underline">
                    {i18n.t('Add more files')}
                  </label>
                </div>
              )}
              <Button
                variant="success"
                className="w-full rounded-md h-10 mt-4"
                onClick={() => {
                  onUpload(docs);
                  handleClose();
                }}>
                {i18n.t(UPLOAD)}
              </Button>
            </div>
            <input
              id="file-upload"
              type="file"
              multiple
              accept={DOC_ACCEPT}
              className="hidden"
              onChange={handleFileUpload}
            />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
