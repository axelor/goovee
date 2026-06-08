'use client';

import React, {useEffect, useState} from 'react';
import {MdClose} from 'react-icons/md';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Button,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/ui/components';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {FileDesc} from '@/subapps/forum/common/ui/components';
import {
  CLICK_HERE_DRAG_DROP_FILE,
  SUPPORTED_FILE_PDF_DOC,
  UPLOAD,
} from '@/subapps/forum/common/constants';

interface FileUploaderProps {
  open: boolean;
  initialValue: FileDetails;
  onUpload: (file: FileDetails) => void;
  handleClose: () => void;
}

interface FileDetails {
  file?: File;
  title?: string;
  fileTitle?: string;
}
export const FileUploader = ({
  open,
  initialValue,
  onUpload,
  handleClose,
}: FileUploaderProps) => {
  const [fileDetails, setFileDetails] = useState<FileDetails>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setFileDetails(prevDetails => ({
        ...prevDetails,
        file: file,
      }));
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = event.target;
    setFileDetails(prevDetails => ({
      ...prevDetails,
      [name]: value,
    }));
  };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) {
      setFileDetails(prevDetails => ({
        ...prevDetails,
        file: droppedFiles[0],
      }));
    }
  };

  useEffect(() => {
    if (initialValue) {
      setFileDetails(initialValue);
    }
  }, [initialValue]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`max-w-screen-lg h-fit p-1 lg:p-4`}>
        <DialogTitle className="hidden" />
        <div className="bg-white w-full h-screen lg:h-full z-[100]">
          <ScrollArea
            className={`relative w-full ${fileDetails?.file?.type === 'application/pdf' ? 'h-[90vh]' : 'h-fit'} pt-8`}>
            <Button
              className="w-6 h-6 flex items-center justify-center rounded-full p-px absolute top-0 right-0 cursor-pointer bg-white hover:bg-white"
              onClick={() => {
                onUpload({});
                handleClose();
              }}>
              <MdClose className="h-full w-full text-muted-foreground" />
            </Button>
            <div className="flex flex-col w-full h-full">
              <div
                className={`flex flex-col items-center gap-2 my-4 flex-1 p-2 justify-between`}
                onDrop={handleDrop}
                onDragOver={event => event.preventDefault()}>
                {!fileDetails.file ? (
                  <label
                    htmlFor="file-upload"
                    className="w-full rounded-sm  border flex flex-col gap-2 md:gap-4 items-center justify-center h-full cursor-pointer p-2">
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
                  <div className="flex flex-col gap-2 w-full px-2">
                    <FileDesc
                      fileDetails={fileDetails}
                      onChange={handleChange}
                      handleFileUpload={handleFileUpload}
                    />
                  </div>
                )}
                <Button
                  variant="success"
                  className="w-full rounded-md h-10 mt-4"
                  onClick={() => {
                    onUpload(fileDetails);
                    handleClose();
                  }}>
                  {i18n.t(UPLOAD)}
                </Button>
              </div>
            </div>
            <input
              id="file-upload"
              type="file"
              accept="application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileUpload}
            />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
