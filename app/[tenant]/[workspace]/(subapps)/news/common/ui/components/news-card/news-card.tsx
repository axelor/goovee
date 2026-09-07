'use client';

import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {formatRelativeTime} from '@/locale/formatters';
import {BadgeList} from '@/ui/components';
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';
import {Link} from '@/ui/components/link';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import type {NewsItem} from '@/subapps/news/common/types';
import type {NewsConfig} from '@/subapps/news/common/orm/config';
import type {Cloned} from '@/types/util';

export const NewsCard = ({
  news,
  id,
  navigatingPathFrom,
  config,
}: {
  news: NewsItem;
  id: string;
  navigatingPathFrom: string;
  config: NewsConfig | Cloned<NewsConfig>;
}) => {
  const {publicationDateTime, title, image, categorySet, slug} = news;
  const {scope} = useWorkspace();
  const {isShowPublicationDate} = config;

  return (
    <Link
      key={id}
      href={scope.forRouter(
        `/${navigatingPathFrom}/${SUBAPP_PAGE.article}/${slug}`,
      )}
      className="bg-white rounded-xl border border-ink-100 shadow-xs hover:shadow-soft-md transition-shadow flex flex-col cursor-pointer overflow-hidden">
      <div className="w-full aspect-[16/10] relative bg-ink-50">
        <Image
          src={
            image?.id
              ? scope.forBrowser(`/${SUBAPP_CODES.news}/api/news/${slug}/image`)
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
        {/* The title only takes the leftover space when a date follows it;
            without one it would otherwise be pushed to the card's bottom. */}
        <h3
          className={cn(
            'font-bold text-base text-ink-900 leading-snug line-clamp-2',
            isShowPublicationDate && 'mt-auto',
          )}>
          {title}
        </h3>
        {isShowPublicationDate && (
          <p className="font-medium text-xs text-ink-400 mt-auto">
            {formatRelativeTime(publicationDateTime)}
          </p>
        )}
      </div>
    </Link>
  );
};

export default NewsCard;
