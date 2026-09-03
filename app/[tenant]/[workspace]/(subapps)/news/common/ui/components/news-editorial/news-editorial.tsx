'use client';

import Image from 'next/image';
import {MdOutlineNewspaper} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {formatRelativeTime} from '@/locale/formatters';
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Link} from '@/ui/components/link';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import {NewsFeatured} from '@/subapps/news/common/ui/components/news-featured';
import type {NewsItem} from '@/subapps/news/common/types';
import type {NewsConfig} from '@/subapps/news/common/orm/config';
import type {Cloned} from '@/types/util';

type Article = NewsItem;

/**
 * Magazine hub body — featured XL + 2 secondaries + grid. The sticky
 * category/search nav lives in the news layout (NewsTopNav) so it persists
 * across hub/category navigations; only this body re-renders.
 */
export function NewsEditorial({
  articles = [],
  heading,
  config,
  children,
  publisher,
  featured,
  page,
}: {
  articles?: Article[];
  heading?: string;
  config: NewsConfig | Cloned<NewsConfig>;
  children?: React.ReactNode;
  /* Publisher name woven into the empty-state sentence — the workspace's own
     name, so the copy reads right whichever portal is being browsed. */
  publisher?: string;
  /* Passing this (even as an empty array) switches the body into hub mode: the
     "Featured" rail stands in for the asymmetric hero and every article flows
     into the grid below. Category pages leave it undefined and keep the hero. */
  featured?: Article[];
  /* Category pagination — the hero only makes sense on the first page, so later
     pages drop it and lay every article out in the grid. */
  page?: number;
}) {
  const {scope} = useWorkspace();
  const {isShowPublicationAuthor, isShowPublicationDate} = config;

  const hubMode = featured !== undefined;
  const hasFeatured = !!featured?.length;
  // The asymmetric hero belongs to the first page of a category only.
  const showHero = !hubMode && (page ?? 1) <= 1;

  /* Hub-only empty state: a category listing that happens to be empty passes its
     own heading and children (its "No news available." message), so leave those
     alone and only stand in for the bare hub with nothing published. */
  if (!articles.length && !hasFeatured && !heading && children == null) {
    return (
      <div className="bg-ink-25 min-h-full">
        <div className="mx-auto max-w-[560px] px-8 pb-20 pt-24 text-center">
          <div className="mx-auto mb-[26px] grid size-24 place-items-center rounded-[20px] border border-ink-150 bg-white shadow-[0_2px_8px_rgba(15,19,25,0.04)]">
            <MdOutlineNewspaper className="size-[34px] text-[#c6d8f1]" />
          </div>
          <h1 className="text-2xl font-bold leading-[1.3] tracking-[-0.02em] text-ink-900">
            {i18n.t('No news yet')}
          </h1>
          <p className="mx-auto mt-2.5 max-w-[420px] text-[14.5px] leading-[1.65] text-ink-500">
            {publisher
              ? i18n.t(
                  'Upcoming posts from {0} will appear here as soon as they are published.',
                  publisher,
                )
              : i18n.t(
                  'Upcoming posts will appear here as soon as they are published.',
                )}
          </p>
        </div>
      </div>
    );
  }

  const heroArticle = articles[0];
  const secondaries = articles.slice(1, 3);
  const rest = articles.slice(3);
  // The hero (page 1 of a category) skims off the first three; without it — the
  // hub, or a later category page — every article flows into the grid.
  const gridArticles = showHero ? rest : articles;

  const newsBase = scope.forRouter(`/${SUBAPP_CODES.news}`);
  const articleHref = (a: Article) =>
    `${newsBase}/${SUBAPP_PAGE.article}/${a.slug}`;
  const imageURL = (a: Article) =>
    a?.image?.id
      ? scope.forBrowser(`/${SUBAPP_CODES.news}/api/news/${a.slug}/image`)
      : withBasePath(NO_IMAGE_URL);
  const catLabel = (a: Article) => a?.categorySet?.[0]?.name || '';
  const meta = (a: Article) =>
    [
      isShowPublicationAuthor ? a?.author?.simpleFullName : null,
      isShowPublicationDate ? formatRelativeTime(a?.publicationDateTime) : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <div className="bg-ink-25 min-h-full flex flex-col flex-1">
      <div className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-8 pb-14">
        {!hubMode && heading && (
          <h1 className="mb-6 text-[26px] font-extrabold tracking-[-0.025em] text-ink-900">
            {heading}
          </h1>
        )}
        {hubMode ? (
          <NewsFeatured articles={featured} config={config} />
        ) : showHero ? (
          /* Hero: featured XL + 2 secondaries */
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 mb-8">
            {heroArticle && (
              <Link
                href={articleHref(heroArticle)}
                className="group bg-white border border-ink-100 rounded-[18px] overflow-hidden shadow-md transition-transform hover:-translate-y-0.5">
                <div className="relative h-[300px] lg:h-[360px]">
                  <Image
                    src={imageURL(heroArticle)}
                    alt={heroArticle.title}
                    fill
                    className="object-cover"
                    sizes="(min-width:1024px) 760px, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
                  {catLabel(heroArticle) && (
                    <span className="absolute top-[18px] left-[18px] px-3 py-[5px] rounded-full bg-white text-royal-dark text-[10.5px] font-extrabold uppercase tracking-[0.06em]">
                      {catLabel(heroArticle)}
                    </span>
                  )}
                  <div className="absolute left-6 right-6 bottom-[22px] text-white">
                    <h2 className="text-2xl lg:text-[30px] font-extrabold tracking-[-0.025em] leading-[1.15] [text-shadow:0_2px_12px_rgba(0,0,0,0.4)]">
                      {heroArticle.title}
                    </h2>
                    {meta(heroArticle) && (
                      <div className="mt-2.5 text-[13px] text-white/85">
                        {meta(heroArticle)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )}

            <div className="flex flex-col gap-4">
              {secondaries.map(a => (
                <Link
                  key={a.slug}
                  href={articleHref(a)}
                  className="group bg-white border border-ink-100 rounded-[14px] overflow-hidden grid grid-cols-2 flex-1 transition-transform hover:-translate-y-0.5 min-h-[150px]">
                  <div className="relative">
                    <Image
                      src={imageURL(a)}
                      alt={a.title}
                      fill
                      className="object-cover"
                      sizes="240px"
                    />
                  </div>
                  <div className="p-[18px] flex flex-col gap-2">
                    {catLabel(a) && (
                      <span className="self-start px-2 py-0.5 rounded bg-royal-pale text-royal-dark text-[10px] font-extrabold tracking-[0.04em]">
                        {catLabel(a)}
                      </span>
                    )}
                    <h3 className="text-[15px] font-bold text-ink-900 leading-snug line-clamp-3">
                      {a.title}
                    </h3>
                    {isShowPublicationDate && (
                      <div className="mt-auto text-[11.5px] text-ink-500">
                        {formatRelativeTime(a.publicationDateTime)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* More news */}
        {gridArticles.length > 0 && (
          <>
            {hubMode && (
              <h2 className="mb-[18px] text-lg font-bold tracking-[-0.015em] text-ink-900">
                {i18n.t('More news')}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
              {gridArticles.map(a => (
                <Link
                  key={a.slug}
                  href={articleHref(a)}
                  className="group bg-white border border-ink-100 rounded-[14px] overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative h-[170px]">
                    <Image
                      src={imageURL(a)}
                      alt={a.title}
                      fill
                      className="object-cover"
                      sizes="(min-width:1024px) 400px, 100vw"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    {catLabel(a) && (
                      <span className="self-start px-2 py-0.5 rounded bg-royal-pale text-royal-dark text-[10px] font-extrabold tracking-[0.04em]">
                        {catLabel(a)}
                      </span>
                    )}
                    <h3 className="text-[15px] font-bold text-ink-900 leading-snug line-clamp-2">
                      {a.title}
                    </h3>
                    {a.description && (
                      <p className="text-[12.5px] text-ink-600 leading-[1.55] line-clamp-2">
                        {a.description}
                      </p>
                    )}
                    {meta(a) && (
                      <div className="mt-auto pt-2 text-[11.5px] text-ink-500">
                        {meta(a)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {children}
      </div>
    </div>
  );
}

export default NewsEditorial;
