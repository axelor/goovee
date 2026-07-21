'use client';

import {usePathname, useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {Search} from '@/ui/components';
import {Link} from '@/ui/components/link';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {SearchItem} from '../search-item';
import {findSearchNews} from '@/subapps/news/common/actions/action';

type Category = {id: string; name: string; slug: string};

/**
 * Sticky category-pills + search nav. Lives in the news layout so it stays
 * mounted across hub <-> category navigations — only the article list (the
 * page) re-renders. Hidden on the article detail (which has its own hero).
 */
export function NewsTopNav({categories = []}: {categories?: Category[]}) {
  const router = useRouter();
  const pathname = usePathname();
  const {workspaceURI, workspaceURL} = useWorkspace();

  const newsBase = `${workspaceURI}/${SUBAPP_CODES.news}`;
  const segments = pathname.split('/').filter(Boolean);

  // Hide on the article detail page.
  if (segments.includes(SUBAPP_PAGE.article)) return null;

  const activeSlug = categories.find(c => segments.includes(c.slug))?.slug;

  const onSearchClick = (slug: string) =>
    router.push(`${newsBase}/${SUBAPP_PAGE.article}/${slug}`);

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-ink-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Pill href={newsBase} active={!activeSlug}>
            {i18n.t('All')}
          </Pill>
          {categories.map(c => (
            <Pill
              key={c.id}
              href={`${newsBase}/${c.slug}`}
              active={activeSlug === c.slug}>
              {c.name}
            </Pill>
          ))}
        </div>
        <div className="hidden md:block w-[260px] shrink-0">
          <Search
            variant="compact"
            placeholder={i18n.t('Search an article…')}
            searchKey="title"
            findQuery={() =>
              findSearchNews({workspaceURL})
                .then(r => ('error' in r ? [] : r))
                .catch(() => [])
            }
            renderItem={SearchItem}
            onItemClick={onSearchClick}
          />
        </div>
      </div>
    </div>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors',
        active
          ? 'bg-royal text-white'
          : 'border border-ink-150 text-ink-700 hover:bg-ink-25',
      )}>
      {children}
    </Link>
  );
}

export default NewsTopNav;
