'use client';

import {MdOutlineForum} from 'react-icons/md';

import type {SearchResult} from '@/subapps/forum/common/types/forum';

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
  result: SearchResult;
  onClick: (result: {id: string; title: string}) => void;
  query?: string;
}) {
  const {title} = result;

  return (
    <div
      className="flex items-center gap-2.5 cursor-pointer py-0.5"
      onClick={() => onClick(result)}>
      <MdOutlineForum className="size-4 shrink-0 text-royal" />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-800">
        {highlight(title, query)}
      </span>
    </div>
  );
}

export default SearchItem;
