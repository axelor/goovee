'use client';

import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {formatRelativeTime} from '@/locale/formatters';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {NewsItem} from '@/subapps/news/common/types';

function highlight(text: string, query?: string) {
  const t = text || '';
  const q = (query || '').trim();
  if (!q) return t;
  const i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return t;
  return (
    <>
      {t.slice(0, i)}
      <mark className="bg-[#fff1c2] text-inherit rounded-[2px] p-0">
        {t.slice(i, i + q.length)}
      </mark>
      {t.slice(i + q.length)}
    </>
  );
}

export function SearchItem({
  result,
  onClick,
  query,
}: {
  result: NewsItem;
  onClick: (slug: string) => void;
  query?: string;
}) {
  const {slug, title, categorySet, image, publicationDateTime} = result;
  const {workspaceURI} = useWorkspace();

  const src = image?.id
    ? withBasePath(`${workspaceURI}/${SUBAPP_CODES.news}/api/news/${slug}/image`)
    : withBasePath(NO_IMAGE_URL);
  const cat = categorySet?.[0]?.name;

  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={() => onClick(slug)}>
      <div className="relative w-[52px] h-10 shrink-0 rounded-lg overflow-hidden bg-ink-50">
        <Image
          src={src}
          alt={title || 'News'}
          fill
          className="object-cover"
          sizes="52px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink-900 leading-snug line-clamp-2">
          {highlight(title, query)}
        </div>
        {publicationDateTime && (
          <div className="text-[11px] text-ink-400 mt-0.5">
            {formatRelativeTime(publicationDateTime)}
          </div>
        )}
      </div>
      {cat && (
        <span className="shrink-0 px-2 py-0.5 rounded-md bg-royal-pale text-royal-dark text-[10px] font-bold">
          {cat}
        </span>
      )}
    </div>
  );
}

export default SearchItem;
