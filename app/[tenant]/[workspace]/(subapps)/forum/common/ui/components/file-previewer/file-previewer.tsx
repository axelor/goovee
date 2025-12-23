'use client';
import React, {useMemo} from 'react';

// ---- CORE IMPORTS ---- //
import {DocViewer, FileIcon} from '@/ui/components';

export const FilePreviewer = React.memo(({file}: {file: any}) => {
  const url = useMemo(
    () =>
      file instanceof Blob || file instanceof File
        ? URL.createObjectURL(file)
        : file.url,
    [file],
  );

  return (
    <div className="w-full">
      {file?.type === 'application/pdf' ? (
        <DocViewer documents={[{uri: url}]} className="overflow-x-hidden" />
      ) : (
        <div className="px-2 border h-10 xl:h-12 flex items-center font-xl mb-2 rounded-md gap-2">
          <div className="w-6 h-6 rounded-lg relative">
            <FileIcon
              fileType={file?.type}
              className={'h-6 w-6 shrink-0'}
            />
          </div>

          <a
            href={file.url}
            download
            className="text-blue-600 underline cursor-pointer marker:text-black">
            {file?.name}
          </a>
        </div>
      )}
    </div>
  );
});
FilePreviewer.displayName = 'FilePreviewer';
export default FilePreviewer;
