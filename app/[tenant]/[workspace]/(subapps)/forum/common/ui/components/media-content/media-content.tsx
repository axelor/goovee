'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {MetaFile} from '@/types';
import {FileIcon} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {findMedia} from '@/subapps/forum/common/action/action';

export const MediaContent = ({groupId = ''}: {groupId: string}) => {
  const [media, setMedia] = useState<any>([]);
  const [attachmentList, setAttachmentList] = useState<{metaFile: MetaFile}[]>(
    [],
  );

  const {tenant, workspaceURL} = useWorkspace();

  useEffect(() => {
    findMedia({id: groupId, workspaceURL}).then(setMedia);
  }, [groupId, workspaceURL]);

  useEffect(() => {
    media.forEach(
      (item: {
        attachmentList: {
          metaFile: MetaFile;
        }[];
      }) => {
        setAttachmentList(prev => [...prev, ...item.attachmentList]);
      },
    );
  }, [media]);

  return (
    <div className="w-full bg-white rounded-lg p-4 grid grid-cols-3 gap-3 mt-6">
      {attachmentList.map((item, i) => {
        return (
          <div key={i} className="w-full h-[9.375rem] relative">
            {item.metaFile.fileType?.startsWith('image') ? (
              <Image
                fill
                //src={/* add it later */}
                alt={item.metaFile.fileName}
              />
            ) : (
              <div className="absolute top-0 left-0 w-full h-full bg-muted flex items-end">
                <div className="px-2 border h-10 xl:h-12 flex items-center font-xl  rounded-md gap-2 w-full bg-background">
                  <FileIcon
                    fileType={item?.metaFile?.fileType || ''}
                    className={'h-6 w-6 shrink-0'}
                  />
                  {item.metaFile?.fileName}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MediaContent;
