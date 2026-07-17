'use client';

import Image from 'next/image';
import React from 'react';

// ---- CORE IMPORTS ---- //
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {formatRelativeTime} from '@/locale/formatters';
import {withBasePath} from '@/lib/core/path/base-path';
import {Link} from '@/ui/components/link';

type NewsCategory = {
  id: string;
  name: string;
  label?: string | null;
  color?: string | null;
  parentCategory?: {
    id: string;
    name: string;
    color?: string | null;
    parentCategory?: {
      name: string;
      color?: string | null;
    } | null;
  } | null;
};

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
  image?: {
    id: string;
    fileName?: string | null;
  } | null;
  workspaceURI: string;
  categorySet?: NewsCategory[];
  title: string;
  description?: string;
  publicationDateTime: string;
}): React.JSX.Element {
  const category = Array.isArray(categorySet) ? categorySet[0] : undefined;

  return (
    <Link
      href={`${workspaceURI}/${navigatingPathFrom}/${SUBAPP_PAGE.article}/${slug}`}
      className="group relative flex flex-col rounded-xl cursor-pointer overflow-hidden border border-ink-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-md min-h-[360px]">
      <Image
        src={
          image?.id
            ? withBasePath(
                `${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image?isFullView=true`,
              )
            : withBasePath(NO_IMAGE_URL)
        }
        alt={image?.fileName || 'News image'}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 576px, (min-width: 768px) 991px, 100vw"
      />
      {category && (
        <span
          className="absolute top-3.5 left-3.5 z-10 px-2.5 py-1 rounded-md bg-royal text-white text-[11px] font-bold tracking-[0.04em]"
          style={{lineHeight: 1.4}}>
          {category.name || category.label || ''}
        </span>
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      <div className="relative z-10 mt-auto p-[18px] text-white">
        <h3
          className="m-0 mb-2 text-lg font-bold tracking-[-0.015em] leading-snug line-clamp-2"
          style={{textShadow: '0 1px 4px rgba(0,0,0,0.4)'}}>
          {title}
        </h3>
        {description && (
          <p
            className="m-0 text-[12.5px] text-white/85 line-clamp-2"
            style={{
              lineHeight: 1.5,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}>
            {description}
          </p>
        )}
        <div className="mt-2.5 text-[11px] font-semibold text-white/60">
          {formatRelativeTime(publicationDateTime)}
        </div>
      </div>
    </Link>
  );
}
