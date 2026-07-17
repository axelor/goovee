'use client';

import {Link} from '@/ui/components/link';

import {SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';

import type {ShopCategory} from '../shop-product-card';

export interface ShopSidebarLabels {
  categoriesTitle: string;
  allProducts: string;
}

export function ShopSidebar({
  categories,
  countsByCat,
  totalCount,
  activeCategoryId,
  workspaceURI,
  labels,
}: {
  categories: ShopCategory[];
  countsByCat: Record<string, number>;
  totalCount: number;
  activeCategoryId?: string | null;
  workspaceURI: string;
  labels: ShopSidebarLabels;
}) {
  const catalogHref = `${workspaceURI}/${SUBAPP_CODES.shop}`;
  const categoryHref = (id: string) =>
    `${catalogHref}?cat=${encodeURIComponent(id)}`;

  return (
    <aside className="w-[260px] shrink-0 bg-white border-r border-ink-100 px-[18px] py-5 overflow-y-auto">
      <h2 className="m-0 mb-3.5 text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-700">
        {labels.categoriesTitle}
      </h2>
      <NavLink
        href={catalogHref}
        label={labels.allProducts}
        count={totalCount}
        active={false}
      />
      {categories.map(c => {
        const id = String(c.id);
        const active =
          activeCategoryId != null && String(activeCategoryId) === id;
        return (
          <NavLink
            key={c.id}
            href={categoryHref(id)}
            label={c.name ?? '—'}
            count={countsByCat[id] ?? 0}
            active={active}
          />
        );
      })}
    </aside>
  );
}

function NavLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-left text-[13px] transition-colors',
        active
          ? 'bg-royal-pale border border-royal-border text-royal-dark font-semibold'
          : 'bg-transparent border border-transparent text-ink-700 font-medium hover:bg-ink-25',
      )}>
      <span className="flex-1 min-w-0 truncate">{label}</span>
      <span
        className={cn(
          'text-[11px] tabular-nums shrink-0',
          active ? 'text-royal-dark font-bold' : 'text-ink-500',
        )}>
        {count}
      </span>
    </Link>
  );
}
