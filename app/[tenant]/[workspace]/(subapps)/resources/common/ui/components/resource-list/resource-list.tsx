'use client';

import {useRouter} from 'next/navigation';
import React from 'react';
import {MdOutlineFileDownload} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {download, getFileTypeIcon, getIconColor} from '@/utils/files';
import {formatDate} from '@/locale/formatters';

import {SUBAPP_CODES} from '@/constants';
// ---- LOCAL IMPORTS ---- //
import {DynamicIcon} from '@/subapps/resources/common/ui/components/dynamic-icon';

export function ResourceList({resources}: any) {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const handleRedirection = (resource: any) => () => {
    router.push(`${workspaceURI}/resources/${resource.id}`);
  };

  const handleDownload = (record: any) => (event: React.MouseEvent) => {
    event.stopPropagation();
    const href = `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${record?.id}`;
    download(record, href);
  };

  return (
    <div className="rounded-lg bg-white py-2">
      {resources?.length ? (
        resources?.map((resource: any, index: number) => {
          const author = resource.createdBy?.name || '--';
          const date = formatDate(resource?.createdOn) || '--';
          const size = resource?.metaFile?.sizeText || '--';
          const parent = resource?.parent?.fileName || '--';

          const icon = getFileTypeIcon(resource.metaFile?.fileType);
          const iconColor = getIconColor(icon);
          const isLast = index === resources.length - 1;

          return (
            <div
              className={cn('py-2 px-4 space-y-2 cursor-pointer', {
                'border-b': !isLast,
              })}
              key={resource.id}
              onClick={handleRedirection(resource)}>
              <div className="leading-5 text-sm space-y-2">
                <div className="grid grid-cols-[1fr_30px] lg:grid-cols-[1fr_60%] items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <DynamicIcon
                      icon={icon}
                      className={'h-6 w-6 shrink-0'}
                      {...(iconColor
                        ? {
                            style: {
                              color: iconColor,
                            },
                          }
                        : {})}
                    />
                    <h3 className="font-semibold truncate min-w-0 flex-1">
                      {resource.fileName}
                    </h3>
                  </div>
                  <div className="grid lg:grid-cols-[2fr_1fr_1fr_1fr_30px] gap-x-2 lg:gap-x-4">
                    <p className="hidden lg:inline-block truncate whitespace-nowrap min-w-0">
                      {parent}
                    </p>
                    <p className="hidden lg:inline-block whitespace-nowrap">
                      {author}
                    </p>
                    <p className="hidden lg:inline-block whitespace-nowrap">
                      {date}
                    </p>
                    <p className="hidden lg:inline-block whitespace-nowrap text-end">
                      {size}
                    </p>
                    <MdOutlineFileDownload
                      className="shrink-0 h-6 w-6 bg-success-light text-success cursor-pointer ms-auto lg:ms-0"
                      onClick={handleDownload(resource)}
                    />
                  </div>
                </div>
                <div className="lg:hidden flex gap-4 items-center justify-between">
                  <p className="truncate whitespace-nowrap">{parent}</p>
                  <p className="whitespace-nowrap">{author}</p>
                  <p className="whitespace-nowrap">{date}</p>
                  <p className="whitespace-nowrap">{size}</p>
                </div>
              </div>
              {resource?.metaFile?.description && (
                <p className="leading-4 text-xs line-clamp-2">
                  {i18n.t('Description')}: {resource?.metaFile?.description}
                </p>
              )}
            </div>
          );
        })
      ) : (
        <p className="py-2 px-4">{i18n.t('No resources available.')}</p>
      )}
    </div>
  );
}

export default ResourceList;
