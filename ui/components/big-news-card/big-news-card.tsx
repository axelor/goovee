'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

// ---- CORE IMPORTS ---- //
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {formatRelativeTime} from '@/locale/formatters';
import {BadgeList} from '@/ui/components';

export function BigNewsCard({
  navigatingPathFrom,
  slug,
  image,
  workspaceURI,
  categorySet,
  title,
  description,
  publicationDateTime,
}: {
  navigatingPathFrom: string;
  slug: string;
  image: {
    id: string | number;
    fileName?: string;
  } | null;
  workspaceURI: string;
  categorySet: any;
  title: string;
  description: string;
  publicationDateTime: string;
}): React.JSX.Element {
  return (
    <Link
      href={`${workspaceURI}/${navigatingPathFrom}/${SUBAPP_PAGE.article}/${slug}`}
      className="relative lg:h-full p-4 flex flex-col rounded-lg cursor-pointer">
      <Image
        src={
          image?.id
            ? `${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image?isFullView=true`
            : NO_IMAGE_URL
        }
        alt={image?.fileName || 'News image'}
        fill
        className="object-cover rounded-lg"
        sizes="(min-width: 1024px) 576px, (min-width: 768px) 991px, 100vw"
      />
      <div
        className="absolute inset-0 rounded-md"
        style={{
          background: `linear-gradient(76deg, rgba(0, 0, 0, 0.40) 1.1%, rgba(0, 0, 0, 0.08) 100%)`,
        }}></div>
      <div className="flex gap-2 z-10 h-[172px]">
        <BadgeList
          items={categorySet}
          rootClassName="z-10"
          labelClassName="rounded font-normal text-[8px] h-max"
        />
      </div>
      <div className="flex flex-col flex-1 justify-between gap-2 text-white z-10">
        <div className="flex flex-col justify-between flex-1">
          <div className="font-semibold text-base line-clamp-3 h-[72px] drop-shadow-md">
            {title}
          </div>
          <div className="font-medium text-xs line-clamp-3 drop-shadow-md">
            {description}
          </div>
        </div>
        <div className="font-medium text-[10px]">
          {formatRelativeTime(publicationDateTime)}
        </div>
      </div>
    </Link>
  );
}
