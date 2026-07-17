'use client';

import {MdChevronRight} from 'react-icons/md';
import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {BadgeList, Separator, Skeleton} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {formatRelativeTime} from '@/locale/formatters';
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {i18n} from '@/lib/core/locale';
import {withBasePath} from '@/lib/core/path/base-path';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import type {NewsItem} from '@/subapps/news/common/types';

export const FeedList = ({
  title,
  items,
  width,
  navigatingPathFrom,
}: {
  title: string;
  items: NewsItem[];
  width?: string;
  navigatingPathFrom: string;
}) => {
  const {workspaceURI} = useWorkspace();
  return (
    <div
      className={`bg-white p-4 rounded-xl border border-ink-100 shadow-xs h-max ${
        width ? `lg-${width}` : 'lg:w-2/5'
      }`}>
      <h2 className="font-bold text-lg text-ink-900 mb-3 tracking-[-0.015em]">
        {title}
      </h2>
      <div className="divide-y divide-ink-100">
        {items?.map(
          ({id, title, publicationDateTime, categorySet, image, slug}) => {
            const imageUrl = image?.id
              ? withBasePath(
                  `${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image`,
                )
              : withBasePath(NO_IMAGE_URL);

            return (
              <Link
                key={id}
                href={`${workspaceURI}/${navigatingPathFrom}/${SUBAPP_PAGE.article}/${slug}`}
                className="group w-full flex gap-3 items-center py-3 px-1 -mx-1 first:pt-0 last:pb-0 cursor-pointer rounded-lg transition-colors hover:bg-ink-25">
                <Image
                  src={imageUrl}
                  alt={image?.fileName || i18n.t('News image')}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-ink-50"
                />
                <div className="w-full min-w-0 flex flex-col gap-1.5 [overflow-wrap:anywhere]">
                  <BadgeList
                    items={categorySet}
                    labelClassName="rounded-full font-semibold text-[10px] px-2 py-0.5"
                    rootClassName="gap-1.5"
                  />
                  <div className="font-bold text-sm text-ink-900 leading-snug line-clamp-1">
                    {title}
                  </div>
                  <div className="font-medium text-[11px] text-ink-400">
                    {formatRelativeTime(publicationDateTime)}
                  </div>
                </div>
                <div className="bg-royal-pale group-hover:bg-royal rounded-lg w-8 h-8 flex items-center justify-center shrink-0 transition-colors">
                  <MdChevronRight className="text-royal group-hover:text-white text-lg transition-colors" />
                </div>
              </Link>
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
