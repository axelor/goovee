'use client';

import {useRef} from 'react';
import Image from 'next/image';
import {MdChevronLeft, MdChevronRight} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {formatRelativeTime} from '@/locale/formatters';
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Link} from '@/ui/components/link';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {NewsItem} from '@/subapps/news/common/types';
import type {NewsConfig} from '@/subapps/news/common/orm/config';
import type {Cloned} from '@/types/util';

type Article = NewsItem;

// The arrows nudge the rail by a little over one card so the next one snaps
// into view rather than sitting half-off the edge.
const SCROLL_STEP = 560;

/**
 * "Featured" (À la une) rail for the news hub: a horizontal, scroll-snapped
 * band of editor-flagged articles that replaces the old asymmetric hero.
 * Renders nothing when nothing is flagged, so the hub falls back to its grid.
 */
export function NewsFeatured({
  articles = [],
  config,
}: {
  articles?: Article[];
  config: NewsConfig | Cloned<NewsConfig>;
}) {
  const {workspaceURI} = useWorkspace();
  const {isShowPublicationAuthor, isShowPublicationDate} = config;
  const railRef = useRef<HTMLDivElement>(null);

  if (!articles.length) return null;

  const newsBase = `${workspaceURI}/${SUBAPP_CODES.news}`;
  const articleHref = (a: Article) =>
    `${newsBase}/${SUBAPP_PAGE.article}/${a.slug}`;
  const imageURL = (a: Article) =>
    a?.image?.id
      ? withBasePath(`${newsBase}/api/news/${a.slug}/image`)
      : withBasePath(NO_IMAGE_URL);
  const catLabel = (a: Article) => a?.categorySet?.[0]?.name || '';
  const meta = (a: Article) =>
    [
      isShowPublicationAuthor ? a?.author?.simpleFullName : null,
      isShowPublicationDate ? formatRelativeTime(a?.publicationDateTime) : null,
    ]
      .filter(Boolean)
      .join(' · ');

  const scrollBy = (direction: -1 | 1) =>
    railRef.current?.scrollBy({
      left: direction * SCROLL_STEP,
      behavior: 'smooth',
    });

  return (
    <section className="mb-10">
      <div className="mb-[18px] flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-[-0.015em] text-ink-900">
          <span className="h-[22px] w-[3px] rounded-full bg-[#1554b5]" />
          {i18n.t('Featured')}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={i18n.t('Previous')}
            onClick={() => scrollBy(-1)}
            className="grid size-[34px] place-items-center rounded-full border border-ink-150 text-ink-700 transition-colors hover:bg-royal-pale hover:text-royal-dark">
            <MdChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label={i18n.t('Next')}
            onClick={() => scrollBy(1)}
            className="grid size-[34px] place-items-center rounded-full border border-ink-150 text-ink-700 transition-colors hover:bg-royal-pale hover:text-royal-dark">
            <MdChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {articles.map(a => (
          <Link
            key={a.slug}
            href={articleHref(a)}
            className="group block shrink-0 basis-[540px] snap-start overflow-hidden rounded-[18px] border border-ink-100 bg-white shadow-md transition-transform hover:-translate-y-0.5">
            <div className="relative h-[300px]">
              <Image
                src={imageURL(a)}
                alt={a.title}
                fill
                className="object-cover"
                sizes="540px"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
              {catLabel(a) && (
                <span className="absolute left-[18px] top-[18px] rounded-full bg-white px-3 py-[5px] text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-royal-dark">
                  {catLabel(a)}
                </span>
              )}
              <div className="absolute inset-x-6 bottom-[22px] text-white">
                <h3 className="line-clamp-2 text-2xl font-extrabold leading-[1.15] tracking-[-0.025em] [text-shadow:0_2px_12px_rgba(0,0,0,0.4)]">
                  {a.title}
                </h3>
                {meta(a) && (
                  <div className="mt-2.5 text-[13px] text-white/85">
                    {meta(a)}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default NewsFeatured;
