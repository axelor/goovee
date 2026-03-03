'use client';

import React from 'react';
import {MdChevronRight} from 'react-icons/md';
import Link from 'next/link';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {BadgeList, Separator, Skeleton} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {formatRelativeTime} from '@/locale/formatters';
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {i18n} from '@/lib/core/locale';

export const FeedList = ({
  title,
  items,
  width,
  navigatingPathFrom,
}: {
  title: string;
  items: any[];
  width?: string;
  navigatingPathFrom: string;
}) => {
  const {workspaceURI} = useWorkspace();
  return (
    <div
      className={`bg-white h-max p-4 rounded-lg ${
        width ? `lg-${width}` : 'lg:w-2/5'
      }`}>
      <div className="font-semibold text-xl mb-[6px]">{title}</div>
      <div>
        {items?.map(
          (
            {id, title, publicationDateTime, categorySet, image, slug},
            index,
          ) => {
            const imageUrl = image?.id
              ? `${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image`
              : NO_IMAGE_URL;

            return (
              <React.Fragment key={id}>
                <Link
                  href={`${workspaceURI}/${navigatingPathFrom}/${SUBAPP_PAGE.article}/${slug}`}
                  className={`w-full flex gap-4 justify-between items-center flex-auto p-2 cursor-pointer`}>
                  <div className="flex w-full gap-4 [overflow-wrap:anywhere]">
                    <Image
                      src={imageUrl}
                      alt={image?.fileName || i18n.t('News image')}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="w-full flex flex-col justify-between">
                      <div className="flex flex-col gap-1">
                        <BadgeList
                          items={categorySet}
                          labelClassName="rounded font-normal text-[0.5rem]"
                          rootClassName="gap-2"
                        />
                        <div className="font-semibold text-base mb-2 line-clamp-1">
                          {title}
                        </div>
                      </div>
                      <div className="font-medium text-[10px] text-zinc-500">
                        {formatRelativeTime(publicationDateTime)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-success/10 rounded-lg w-8 h-8 flex items-center justify-center">
                    <MdChevronRight className="text-success text-2xl" />
                  </div>
                </Link>
                {index < items.length - 1 && (
                  <Separator className="bg-zinc-300" />
                )}
              </React.Fragment>
            );
          },
        )}
      </div>
    </div>
  );
};

export function FeedListSkeleton({
  width = '',
  count = 3,
}: {
  width?: string;
  count?: number;
}) {
  return (
    <div
      className={`bg-white h-max p-4 rounded-lg ${width ? width : 'basis-[40%]'}`}>
      <Skeleton className="h-7 w-32 mb-1.5" />
      {[...Array(count)].map((_, index) => (
        <div key={index}>
          <div className="w-full flex gap-4 justify-between items-center flex-auto p-2">
            <div className="flex w-full gap-4">
              <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />

              <div className="w-full flex flex-col justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-10 rounded-full" />
                  </div>

                  <Skeleton className="h-5 w-3/4 mt-2" />
                </div>

                <Skeleton className="h-3 w-1/4 mt-2" />
              </div>
            </div>

            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>

          {index < count - 1 && <Separator className="bg-zinc-300" />}
        </div>
      ))}
    </div>
  );
}

export default FeedList;
