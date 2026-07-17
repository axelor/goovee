'use client';

import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {formatRelativeTime} from '@/locale/formatters';
import {BadgeList, Skeleton} from '@/ui/components';
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import type {NewsItem} from '@/subapps/news/common/types';

export const NewsCard = ({
  news,
  id,
  navigatingPathFrom,
}: {
  news: NewsItem;
  id: string;
  navigatingPathFrom: string;
}) => {
  const {publicationDateTime, title, image, categorySet, slug} = news;
  const {workspaceURI} = useWorkspace();

  return (
    <Link
      key={id}
      href={`${workspaceURI}/${navigatingPathFrom}/${SUBAPP_PAGE.article}/${slug}`}
      className="bg-white rounded-xl border border-ink-100 shadow-xs hover:shadow-soft-md transition-shadow flex flex-col cursor-pointer overflow-hidden">
      <div className="w-full aspect-[16/10] relative bg-ink-50">
        <Image
          src={
            image?.id
              ? withBasePath(
                  `${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image`,
                )
              : withBasePath(NO_IMAGE_URL)
          }
          alt={image?.fileName || 'News image'}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 320px, (min-width: 768px) 480px, 100vw"
        />
      </div>
      <div className="p-4 flex flex-col gap-3 flex-grow">
        <BadgeList
          items={categorySet}
          labelClassName="rounded-full font-semibold text-[10px] px-2 py-0.5"
          rootClassName="gap-1.5"
        />
        <h3 className="font-bold text-base text-ink-900 leading-snug line-clamp-2 mt-auto">
          {title}
        </h3>
        <p className="font-medium text-xs text-ink-400 mt-auto">
          {formatRelativeTime(publicationDateTime)}
        </p>
      </div>
    </Link>
  );
};

export const NewsCardSkeleton = ({count = 3}: {count?: number}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-5 !shadow-none">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg flex flex-col">
          <Skeleton className="w-full h-[150px] rounded-t-lg" />

          <div className="py-2 px-4 flex flex-col justify-between flex-grow gap-2">
            <div className="flex gap-2">
              <Skeleton className="h-3 w-10 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-full" />
            </div>

            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />

            <Skeleton className="h-3 w-1/4 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsCard;
