'use client';

import {usePathname, useRouter} from 'next/navigation';
import {MdKeyboardArrowDown} from 'react-icons/md';

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
import type {NewsItem} from '@/subapps/news/common/types';
import type {NewsConfig} from '@/subapps/news/common/orm/config';
import type {Cloned} from '@/types/util';

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
};

type SearchItemProps = {
  result: NewsItem;
  onClick: (slug: string) => void;
  query?: string;
};

/**
 * Sticky category-pills + search nav. Lives in the news layout so it stays
 * mounted across hub <-> category navigations — only the article list (the
 * page) re-renders. Hidden on the article detail (which has its own hero).
 *
 * Desktop shows top categories as pills; when the active one has children, a
 * second contextual row reveals its subcategories. Mobile keeps the full tree
 * in the floating MobileMenuCategory, so nothing is duplicated here.
 */
export function NewsTopNav({
  categories = [],
  config,
}: {
  categories?: Category[];
  config: NewsConfig | Cloned<NewsConfig> | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {workspaceURI, workspaceURL} = useWorkspace();

  const newsBase = `${workspaceURI}/${SUBAPP_CODES.news}`;
  const segments = pathname.split('/').filter(Boolean);

  // Hide on the article detail page.
  if (segments.includes(SUBAPP_PAGE.article)) return null;

  // Resolve the active category across both levels: a top pill stays lit when
  // one of its children is active, so the subcategory row keeps its context.
  const activeTop = categories.find(c => segments.includes(c.slug));
  const activeChild = categories
    .flatMap(c => c.children ?? [])
    .find(ch => segments.includes(ch.slug));
  const activeParent =
    activeTop ??
    categories.find(c => c.children?.some(ch => ch.slug === activeChild?.slug));
  const subcategories = activeParent?.children ?? [];

  const onSearchClick = (slug: string) =>
    router.push(`${newsBase}/${SUBAPP_PAGE.article}/${slug}`);

  /* Search renders the item component itself, so the workspace's publication
     flags have to be bound here rather than passed through Search. */
  const renderSearchItem = (props: SearchItemProps) => (
    <SearchItem {...props} config={config} />
  );

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-ink-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="py-3.5 flex items-center justify-between gap-4">
          {/* Category pills — desktop only; on mobile they live in the floating
              MobileMenuCategory, so we don't duplicate them here. */}
          <div className="hidden lg:flex gap-2 overflow-x-auto no-scrollbar">
            <Pill href={newsBase} active={!activeParent}>
              {i18n.t('All')}
            </Pill>
            {categories.map(c => (
              <Pill
                key={c.id}
                href={`${newsBase}/${c.slug}`}
                active={activeParent?.id === c.id}
                hasChildren={!!c.children?.length}>
                {c.name}
              </Pill>
            ))}
          </div>
          <div className="w-full lg:w-[260px] shrink-0">
            <Search
              variant="compact"
              placeholder={i18n.t('Search an article…')}
              searchKey="title"
              findQuery={({query}: {query: string}) =>
                findSearchNews({workspaceURL, search: query})
                  .then(r => ('error' in r ? [] : r))
                  .catch(() => [])
              }
              renderItem={renderSearchItem}
              onItemClick={onSearchClick}
            />
          </div>
        </div>

        {/* Contextual subcategory row — only when the active category has one. */}
        {subcategories.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 -mt-0.5">
            {subcategories.map(sub => (
              <SubPill
                key={sub.id}
                href={`${newsBase}/${sub.slug}`}
                active={activeChild?.slug === sub.slug}>
                {sub.name}
              </SubPill>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({
  href,
  active,
  hasChildren,
  children,
}: {
  href: string;
  active?: boolean;
  hasChildren?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors',
        active
          ? 'bg-royal text-white'
          : 'border border-ink-150 text-ink-700 hover:bg-ink-25',
      )}>
      {children}
      {hasChildren && (
        <MdKeyboardArrowDown
          className={cn('size-4', active ? 'text-white/80' : 'text-ink-400')}
        />
      )}
    </Link>
  );
}

function SubPill({
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
        'shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors',
        active
          ? 'bg-royal-pale text-royal-dark'
          : 'text-ink-600 hover:bg-ink-25',
      )}>
      {children}
    </Link>
  );
}

export default NewsTopNav;
