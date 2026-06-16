'use client';

import Image from 'next/image';
import React, {useCallback, useEffect, useState} from 'react';
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdOutlineContentCopy,
} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Button,
  Input,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/ui/components';
import {formatNumber} from '@/locale/formatters';
import {useToast} from '@/ui/hooks/use-toast';
import {withBasePath} from '@/lib/core/path/base-path';

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

  const {toast} = useToast();

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAltTexts = [...images];
    newAltTexts[selectedIndex].altText = e.target.value;
    setImages(newAltTexts);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    if (index >= images.length - 1) setSelectedIndex(0);
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

  const handleUpload = () => {
    onUpload(images);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`max-w-screen-lg h-fit p-1 lg:p-4`}>
        <DialogTitle className="hidden" />
        <div className="bg-background w-full h-screen lg:h-full z-[100] overflow-y-auto">
          <div className="relative w-full h-full pt-4 xl:pt-8">
            <Button
              className="w-6 h-6 flex items-center justify-center rounded-full p-px absolute top-0 right-1 cursor-pointer bg-white hover:bg-white"
              onClick={() => {
                handleClose();
              }}>
              <MdClose className="h-full w-full text-muted-foreground" />
            </Button>
            <div className="flex flex-col w-full h-full">
              <div
                className={`flex flex-col items-center justify-between gap-2 my-2 xl:mt-4 flex-1 p-2 rounded-md ${isDragging ? 'border-success' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}>
                {images.length === 0 ? (
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col gap-2 md:gap-4 items-center justify-center h-full cursor-pointer border rounded-md w-full p-2">
                    <div className="w-[18.75rem] md:w-[24.063rem] h-[18.313rem] relative my-2">
                      <Image
                        fill
                        src={withBasePath('/images/upload.png')}
                        className="aspect-auto"
                        objectFit="contain"
                        alt="Upload png"
                      />
                    </div>
                    <h2 className="text-base lg:text-xl text-center">
                      {i18n.t(CLICK_HERE_DRAG_DROP)}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {i18n.t(SUPPORTED_FILE_JPG_PNG)}
                    </span>
                  </label>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-2 xl:gap-4 w-full h-full">
                    <div className="flex-1 flex flex-col justify-between h-full m-4 gap-4">
                      <div className="w-full h-full min-h-[15.625rem] max-h-[28.125rem] shadow-sm relative overflow-hidden">
                        {images[selectedIndex] && (
                          <ImageViewer file={images[selectedIndex].file} />
                        )}
                      </div>
                      <div>
                        <span className="text-base font-medium">
                          {i18n.t(ALERTNATE_TEXT)}
                        </span>
                        <Input
                          name="altText"
                          value={images[selectedIndex]?.altText || ''}
                          onChange={handleChange}
                          placeholder={i18n.t('Alternate Text')}
                          className="shadow-none mt-2 h-10 lg:h-12"
                        />
                      </div>
                    </div>
                    <div className="flex-1 border h-full rounded-sm p-2 flex flex-col justify-between m-2 xl:m-4 ">
                      <div>
                        <p className="p-3 text-muted-foreground">
                          {`${formatNumber(selectedIndex + 1)} ${i18n.t(OUT_OF)} ${formatNumber(images.length)}`}
                        </p>
                        <ScrollArea className="h-[22.5rem]">
                          <div className="flex flex-wrap justify-between p-2">
                            {images.map((item, i) => (
                              <div
                                key={i}
                                className={`w-fit h-fit p-1 mb-2 xl:mb-3 ${selectedIndex === i ? 'border border-success' : ''}`}>
                                <div
                                  onClick={() => setSelectedIndex(i)}
                                  className={`w-[9.375rem] h-[9.375rem] relative border overflow-hidden cursor-pointer`}>
                                  <ImageViewer file={item.file} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <div className="flex gap-5 items-center justify-center ">
                        <MdOutlineContentCopy
                          className="w-6 h-6 cursor-pointer text-muted-foreground"
                          onClick={() => copyImage(selectedIndex)}
                        />
                        <MdDeleteOutline
                          className="w-6 h-6 cursor-pointer text-muted-foreground"
                          onClick={() => removeImage(selectedIndex)}
                        />
                        <label
                          htmlFor="image-upload"
                          className="w-20 h-8 lg:h-10 cursor-pointer border flex items-center justify-center border-success rounded-lg">
                          <MdAdd className="w-6 h-6 flex text-muted-foreground" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button
                className="bg-success w-full rounded-md h-10 mt-4 text-base"
                onClick={handleUpload}>
                {i18n.t(UPLOAD)}
              </Button>
            </div>
            <input
              id="image-upload"
              type={'file'}
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
