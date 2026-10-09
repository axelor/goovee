'use client';

import {MdOutlineFileDownload} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Separator, Skeleton} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import type {Attachment} from '@/subapps/news/common/types';

export const AttachmentList = ({
  slug,
  title,
  items,
  width,
}: {
  slug: string;
  title: string;
  items: Attachment[];
  width?: string;
}) => {
  const {scope} = useWorkspace();

  return (
    <div
      className={`bg-white h-max p-4 rounded-lg ${
        width ? `lg-${width}` : 'lg:w-2/5'
      }`}>
      <div className="font-semibold text-xl mb-4">{title}</div>
      <Separator />
      <div className="mt-4">
        {items?.map((item, i) => {
          const label = item?.title || item?.metaFile?.fileName;
          return (
            <div
              key={item.id}
              className="mb-4 grid grid-cols-[4fr_2fr_1fr] gap-2 shrink-0 items-center">
              <p
                className="text-[16px] font-medium overflow-hidden"
                title={label}>
                {label}
              </p>
              <div className="text-end">{item?.metaFile?.sizeText}</div>
              <div className="flex justify-end">
                {item?.metaFile?.id && (
                  <a
                    href={scope.forBrowser(
                      `/${SUBAPP_CODES.news}/api/news/${slug}/attachment/${item.metaFile.id}`,
                    )}
                    download={item.metaFile.fileName ?? ''}
                    aria-label={`${i18n.t('Download')} ${label ?? ''}`}>
                    <MdOutlineFileDownload className="text-2xl font-semibold" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AttachmentListSkeleton = () => {
  return (
    <div className="bg-white h-max p-4 rounded-lg">
      <div className="font-semibold text-xl mb-4">
        <Skeleton className="w-1/3 h-6" />
      </div>
      <Separator />
      <div className="mt-4 flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[4fr_2fr_1fr] gap-2 items-center">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentList;
