'use client';

import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {formatRelativeTime} from '@/locale/formatters';
import {NO_IMAGE_URL, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Link} from '@/ui/components/link';
import {withBasePath} from '@/lib/core/path/base-path';

type Article = any;

/**
 * Magazine hub body — featured XL + 2 secondaries + grid. The sticky
 * category/search nav lives in the news layout (NewsTopNav) so it persists
 * across hub/category navigations; only this body re-renders.
 */
export function NewsEditorial({
  articles = [],
  heading,
  children,
}: {
  articles?: Article[];
  heading?: string;
  children?: React.ReactNode;
}) {
  const {workspaceURI} = useWorkspace();

  const featured = articles[0];
  const secondaries = articles.slice(1, 3);
  const rest = articles.slice(3);

  const newsBase = `${workspaceURI}/${SUBAPP_CODES.news}`;
  const articleHref = (a: Article) =>
    `${newsBase}/${SUBAPP_PAGE.article}/${a.slug}`;
  const imageURL = (a: Article) =>
    a?.image?.id
      ? withBasePath(`${newsBase}/api/news/${a.slug}/image`)
      : withBasePath(NO_IMAGE_URL);
  const catLabel = (a: Article) => a?.categorySet?.[0]?.name || '';
  const meta = (a: Article) =>
    [a?.author?.simpleFullName, formatRelativeTime(a?.publicationDateTime)]
      .filter(Boolean)
      .join(' · ');

  return (
    <div className="bg-ink-25 min-h-full flex flex-col flex-1">
      <div className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-8 pb-14">
        {/* Hero: featured XL + 2 secondaries */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 mb-8">
          {featured && (
            <Link
              href={articleHref(featured)}
              className="group bg-white border border-ink-100 rounded-[18px] overflow-hidden shadow-md transition-transform hover:-translate-y-0.5">
              <div className="relative h-[300px] lg:h-[360px]">
                <Image
                  src={imageURL(featured)}
                  alt={featured.title}
                  fill
                  className="object-cover"
                  sizes="(min-width:1024px) 760px, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
                {catLabel(featured) && (
                  <span className="absolute top-[18px] left-[18px] px-3 py-[5px] rounded-full bg-white text-royal-dark text-[10.5px] font-extrabold uppercase tracking-[0.06em]">
                    {catLabel(featured)}
                  </span>
                )}
                <div className="absolute left-6 right-6 bottom-[22px] text-white">
                  <h2 className="text-2xl lg:text-[30px] font-extrabold tracking-[-0.025em] leading-[1.15] [text-shadow:0_2px_12px_rgba(0,0,0,0.4)]">
                    {featured.title}
                  </h2>
                  <div className="mt-2.5 text-[13px] text-white/85">
                    {meta(featured)}
                  </div>
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
                  <div className="mt-auto text-[11.5px] text-ink-500">
                    {formatRelativeTime(a.publicationDateTime)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* More news */}
        {rest.length > 0 && (
          <>
            <h2 className="mb-[18px] text-lg font-bold tracking-[-0.015em] text-ink-900">
              {heading || i18n.t('More news')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
              {rest.map(a => (
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
                    <div className="mt-auto pt-2 text-[11.5px] text-ink-500">
                      {meta(a)}
                    </div>
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
