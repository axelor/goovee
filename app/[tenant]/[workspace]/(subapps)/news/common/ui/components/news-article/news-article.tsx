'use client';

import Image from 'next/image';
import {MdArrowBack} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {formatDate} from '@/locale/formatters';
import {getPartnerImageURL} from '@/utils/files';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {InnerHTML} from '@/ui/components';
import {Link} from '@/ui/components/link';
import {withBasePath} from '@/lib/core/path/base-path';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {getFormatString} from '@/subapps/news/common/utils';
import type {NewsItem} from '@/subapps/news/common/types';
import type {NewsConfig} from '@/subapps/news/common/orm/config';
import type {Workspace} from '@/orm/workspace';
import type {Cloned} from '@/types/util';

function initials(name?: string) {
  return (name || '')
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function NewsArticleHero({
  article,
  workspace,
}: {
  article: NewsItem;
  workspace: Workspace | Cloned<Workspace>;
}) {
  const {workspaceURI, tenant} = useWorkspace();
  const newsBase = `${workspaceURI}/${SUBAPP_CODES.news}`;
  const {
    isShowPublicationAuthor,
    isShowPublicationDate,
    isShowPublicationTime,
  } = (workspace?.config ?? {}) as Partial<NewsConfig>;

  const src = article?.image?.id
    ? withBasePath(`${newsBase}/api/news/${article.slug}/image?isFullView=true`)
    : withBasePath(NO_IMAGE_URL);
  const cat = article?.categorySet?.[0]?.name;
  const showAuthor = isShowPublicationAuthor && !!article?.author;
  const showDate = isShowPublicationDate && !!article?.publicationDateTime;

  return (
    <div className="relative h-[360px] lg:h-[440px] overflow-hidden">
      <Image
        src={src}
        alt={article?.title || 'News'}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0e1c34]/85" />

      <Link
        href={newsBase}
        className="absolute top-6 left-4 lg:left-8 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/90 text-royal-dark text-[13px] font-bold backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <MdArrowBack className="size-3.5" />
        {i18n.t('Back')}
      </Link>

      <div className="absolute inset-x-0 bottom-0 px-4 lg:px-8 pb-9">
        <div className="max-w-[1000px] mx-auto text-white">
          {cat && (
            <span className="inline-block mb-4 px-3 py-[5px] rounded-full bg-white text-royal-dark text-[11px] font-extrabold uppercase tracking-[0.06em]">
              {cat}
            </span>
          )}
          <h1 className="max-w-[820px] text-3xl lg:text-[42px] font-extrabold tracking-[-0.025em] leading-[1.1] [text-shadow:0_2px_14px_rgba(0,0,0,0.4)]">
            {article?.title}
          </h1>
          {(showAuthor || showDate) && (
            <div className="mt-4 flex items-center gap-3.5 text-[13.5px] text-white/90 flex-wrap">
              {showAuthor && (
                <span className="inline-flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full grid place-items-center text-white text-[11px] font-bold bg-gradient-to-br from-ink-300 to-ink-500 overflow-hidden">
                    {article.author?.picture?.id ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getPartnerImageURL(
                          article.author.picture.id,
                          tenant,
                          {noimage: true},
                        )}
                        alt={article.author.simpleFullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials(article.author?.simpleFullName)
                    )}
                  </span>
                  <strong>{article.author?.simpleFullName}</strong>
                </span>
              )}
              {showAuthor && showDate && (
                <span className="text-white/50">·</span>
              )}
              {showDate && (
                <span>
                  {formatDate(article.publicationDateTime, {
                    dateFormat: getFormatString({
                      dateString: article.publicationDateTime,
                      includeTime: isShowPublicationTime ?? undefined,
                    }),
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewsArticleBody({article}: {article: NewsItem}) {
  const cat = article?.categorySet?.[0];

  return (
    <article className="bg-white border border-ink-100 rounded-2xl shadow-xs p-6 lg:p-[40px_48px]">
      {/* Content */}
      {article?.content && (
        <InnerHTML
          className={cn(
            'text-[16px] leading-[1.75] text-ink-800',
            '[&_h2]:text-[24px] [&_h2]:font-extrabold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink-900 [&_h2]:mt-9 [&_h2]:mb-3.5',
            '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-ink-900 [&_h3]:mt-6 [&_h3]:mb-2',
            '[&_p]:mb-[18px]',
            '[&_a]:text-royal [&_a]:underline',
            '[&_ul]:mb-[22px] [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2.5 [&_ul]:list-none [&_ul]:pl-0',
            '[&_ul>li]:relative [&_ul>li]:pl-[26px]',
            "[&_ul>li]:before:content-['✓'] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[3px] [&_ul>li]:before:grid [&_ul>li]:before:place-items-center [&_ul>li]:before:w-[16px] [&_ul>li]:before:h-[16px] [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-royal-pale [&_ul>li]:before:text-royal [&_ul>li]:before:text-[9px] [&_ul>li]:before:font-extrabold",
            '[&_ol]:mb-[22px] [&_ol]:pl-5 [&_ol]:list-decimal',
            '[&_img]:rounded-xl [&_img]:my-5',
          )}
          content={article.content}
        />
      )}

      {/* Footer */}
      <div className="mt-9 pt-6 border-t border-ink-100 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1.5">
          {cat?.name && (
            <span className="px-2.5 py-1 rounded-md bg-ink-50 text-ink-700 text-[11.5px] font-semibold">
              #{cat.name}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-md bg-ink-50 text-ink-700 text-[11.5px] font-semibold">
            #atlas
          </span>
        </div>
        {article?.author?.simpleFullName && (
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-full grid place-items-center text-white text-xs font-bold bg-gradient-to-br from-ink-300 to-ink-500">
              {initials(article.author.simpleFullName)}
            </span>
            <div>
              <div className="text-[13.5px] font-bold text-ink-900">
                {article.author.simpleFullName}
              </div>
              <div className="text-[11.5px] text-ink-500">
                {i18n.t('Atlas Industries')}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default NewsArticleHero;
