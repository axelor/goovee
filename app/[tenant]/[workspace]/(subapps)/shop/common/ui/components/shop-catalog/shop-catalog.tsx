'use client';

import {useCallback, useMemo, useState, useTransition} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {MdSearch} from 'react-icons/md';

import {cn} from '@/utils/css';
import {i18n} from '@/locale';
import type {ComputedProduct} from '@/types';

import {
  ShopProductCard,
  type ShopCategory,
} from '@/subapps/shop/common/ui/components';

export interface ShopLabels {
  categoriesTitle: string;
  allProducts: string;
  availabilityTitle: string;
  inStockOnly: string;
  defaultPageTitle: string;
  productsLabel: string;
  productLabel: string;
  searchPlaceholder: string;
  inStockBadge: string;
  outOfStockBadge: string;
  addToCartLabel: string;
  addedLabel: string;
  emptyTitle: string;
  emptySubtitle: string;
}

export interface ShopSortOption {
  value: string;
  label: string;
}

interface ShopCatalogProps {
  categories: ShopCategory[];
  products: ComputedProduct[];
  labels: ShopLabels;
  sortOptions: ShopSortOption[];
  activeSort?: string;
  defaultSort?: string;
  hidePriceAndPurchase?: boolean;
  displayPrices?: boolean;
}

function productName(product: ComputedProduct): string {
  return i18n.tattr(product?.product?.name ?? '');
}

export function ShopCatalog({
  categories,
  products,
  labels,
  sortOptions,
  activeSort,
  defaultSort,
  hidePriceAndPurchase,
  displayPrices,
}: ShopCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sorting, startTransition] = useTransition();

  const activeCat = searchParams.get('cat') ?? 'all';
  const stockOnly = searchParams.get('stock') === '1';
  const urlSearch = searchParams.get('q') ?? '';

  // Local search input — debounced into URL to avoid a server round-trip per keystroke.
  const [searchInput, setSearchInput] = useState(urlSearch);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '') sp.delete(k);
        else sp.set(k, v);
      }
      const qs = sp.toString();
      startTransition(() => {
        router.replace(qs ? `?${qs}` : '?', {scroll: false});
      });
    },
    [router, searchParams],
  );

  /* Each category mapped to the set of itself and everything under it, walked
     down the `items` the query already nested. Selecting a parent must include
     products that live only in its children, or the parent shows as empty. */
  const descendantsByCat = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const category of categories) {
      const ids = new Set<string>();
      const stack: ShopCategory[] = [category];
      while (stack.length) {
        const current = stack.pop()!;
        const id = String(current.id);
        if (ids.has(id)) continue;
        ids.add(id);
        for (const child of current.items ?? []) stack.push(child);
      }
      map.set(String(category.id), ids);
    }
    return map;
  }, [categories]);

  // Counts per category, rolled up through descendants (each product counted
  // once per subtree), so a parent reflects everything under it.
  const countsByCat = useMemo(() => {
    const map = new Map<string, number>();
    map.set('all', products.length);
    for (const c of categories) {
      const id = String(c.id);
      const desc = descendantsByCat.get(id);
      if (!desc) continue;
      let n = 0;
      for (const p of products) {
        const portal = p?.product?.portalCategorySet ?? [];
        if (portal.some(pc => desc.has(String(pc?.id)))) n++;
      }
      map.set(id, n);
    }
    return map;
  }, [products, categories, descendantsByCat]);

  const categoryById = useMemo(() => {
    const map = new Map<string, ShopCategory>();
    for (const c of categories) map.set(String(c.id), c);
    return map;
  }, [categories]);

  /* The sidebar lists the tree the mobile slide-out already shows, one row per
     category with its rolled-up count. Empty categories drop out with their
     whole subtree — a parent's count includes its descendants, so a parent at
     zero cannot hide a child that has products. A category whose parent is not
     in the list is treated as a root, so filtering out a parent never makes its
     children disappear. */
  const categoryRows = useMemo(() => {
    /* A root is a category whose parent is not in the workspace's set, so a
       parent hidden by access or archiving does not take its children with
       it. Every other category is reached through its parent's `items`. */
    const roots = categories.filter(category => {
      const parentId = category.parent?.id;
      return parentId == null || !categoryById.has(String(parentId));
    });

    const rows: {category: ShopCategory; depth: number}[] = [];
    const addLevel = (level: ShopCategory[], depth: number) => {
      for (const category of level) {
        const id = String(category.id);
        if ((countsByCat.get(id) ?? 0) === 0) continue;
        rows.push({category, depth});
        addLevel(category.items ?? [], depth + 1);
      }
    };
    addLevel(roots, 0);

    return rows;
  }, [categories, categoryById, countsByCat]);

  const filtered = useMemo(() => {
    let out = products;
    if (activeCat !== 'all') {
      const desc = descendantsByCat.get(activeCat) ?? new Set([activeCat]);
      out = out.filter(p => {
        const portal = p?.product?.portalCategorySet ?? [];
        return portal.some(c => desc.has(String(c?.id)));
      });
    }
    if (stockOnly) {
      out = out.filter(p => !p?.product?.outOfStockConfig?.outOfStock);
    }
    if (urlSearch.trim()) {
      const q = urlSearch.trim().toLowerCase();
      out = out.filter(p => productName(p).toLowerCase().includes(q));
    }
    return out;
  }, [products, activeCat, stockOnly, urlSearch, descendantsByCat]);

  const title =
    activeCat === 'all'
      ? labels.defaultPageTitle
      : (categoryById.get(activeCat)?.name ?? labels.defaultPageTitle);

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-ink-25">
      {/* Sidebar — replaced below lg by the slide-out in the mobile menu bar,
          which carries the same categories and availability filter. The column
          itself spans the page so its background and border do, while the
          filters inside it stay put and scroll on their own: a long category
          list would otherwise push the availability filter below the fold and
          scroll out of reach along with the rest of the page. */}
      <aside className="hidden lg:block w-[260px] shrink-0 bg-white border-r border-ink-100">
        {/* Pinned below whatever the header actually occupies, which it
            publishes itself. Before it has, nothing is pinned yet and zero is
            the right answer. */}
        <div className="sticky top-[var(--goovee-sticky-header,0px)] max-h-[calc(100vh-var(--goovee-sticky-header,0px))] px-[18px] py-5 overflow-y-auto">
          <h2 className="m-0 mb-3.5 text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-700">
            {labels.categoriesTitle}
          </h2>
          {/* A list carrying each row's level, so the nesting is not conveyed by
            indentation alone — it has to reach a reader who cannot see it. */}
          {/* role="list" is not redundant: WebKit drops the list role once the
            markers are removed, and with it the levels below. */}
          <ul role="list" className="list-none m-0 p-0">
            <li aria-level={1}>
              <CategoryNavButton
                label={labels.allProducts}
                count={countsByCat.get('all') ?? 0}
                active={activeCat === 'all'}
                onClick={() => setParam({cat: null})}
              />
            </li>
            {categoryRows.map(({category, depth}) => {
              const id = String(category.id);
              return (
                <li key={id} aria-level={depth + 1}>
                  <CategoryNavButton
                    label={category.name ?? '—'}
                    count={countsByCat.get(id) ?? 0}
                    active={activeCat === id}
                    depth={depth}
                    onClick={() => setParam({cat: id})}
                  />
                </li>
              );
            })}
          </ul>

          <h2 className="m-0 mt-7 mb-3 text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-700">
            {labels.availabilityTitle}
          </h2>
          <label className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] hover:bg-ink-25 transition-colors">
            <input
              type="checkbox"
              checked={stockOnly}
              onChange={() => setParam({stock: stockOnly ? null : '1'})}
              className="w-4 h-4 accent-royal cursor-pointer"
            />
            <span className="flex-1 text-ink-800">{labels.inStockOnly}</span>
          </label>
        </div>
      </aside>

      {/* Main pane */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 md:px-8 py-7 pb-14 max-w-[1280px] mx-auto">
          <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="m-0 text-[26px] font-extrabold text-ink-900 tracking-[-0.025em] leading-tight">
                {title}
              </h1>
              <p className="mt-1 text-[13.5px] text-ink-500 tabular-nums">
                {filtered.length}{' '}
                {filtered.length === 1
                  ? labels.productLabel
                  : labels.productsLabel}
              </p>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setParam({q: searchInput.trim() || null});
                }}
                className="flex items-center gap-2 px-3 py-[9px] rounded-[10px] bg-white border border-ink-150 w-[240px]">
                <MdSearch className="text-royal text-sm shrink-0" />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onBlur={() => setParam({q: searchInput.trim() || null})}
                  placeholder={labels.searchPlaceholder}
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] text-ink-800 placeholder:text-ink-400"
                />
              </form>
              {/* Only the orderings the workspace turned on. Choosing the
                  default drops the parameter rather than spelling it out. */}
              {sortOptions.length > 1 && (
                <select
                  value={activeSort ?? ''}
                  aria-label={i18n.t('Sort by')}
                  /* Ordering is done by the query now, so the list only
                     changes once the server answers. */
                  disabled={sorting}
                  onChange={event =>
                    setParam({
                      sort:
                        event.target.value === defaultSort
                          ? null
                          : event.target.value,
                    })
                  }
                  className="px-3 py-[9px] rounded-[10px] bg-white border border-ink-150 text-[13px] font-semibold text-ink-800 cursor-pointer disabled:opacity-60 disabled:cursor-wait">
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </header>

          {filtered.length === 0 ? (
            <div className="bg-white border border-ink-100 rounded-2xl px-6 py-14 text-center shadow-xs">
              <p className="text-[15px] font-semibold text-ink-700">
                {labels.emptyTitle}
              </p>
              <p className="mt-1 text-[13px] text-ink-500">
                {labels.emptySubtitle}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filtered.map(p => {
                // Pick a portal category for the card badge — prefer the
                // currently active filter, otherwise the first one. Fall back
                // to the primary productCategory if portalCategorySet is empty
                // (some products may bypass portal exposure but still appear
                // when no filter is set).
                const portal = p?.product?.portalCategorySet ?? [];
                const portalMatch =
                  activeCat !== 'all'
                    ? portal.find(c => String(c?.id) === activeCat)
                    : portal[0];
                const primary = p?.product?.productCategory;
                const candidate = portalMatch ?? portal[0] ?? primary ?? null;
                const cat = candidate
                  ? (categoryById.get(String(candidate.id)) ?? {
                      id: candidate.id,
                      name: candidate.name ?? null,
                      slug: candidate.slug ?? null,
                    })
                  : null;
                return (
                  <ShopProductCard
                    key={p?.product?.id}
                    product={p}
                    category={cat}
                    inStockLabel={labels.inStockBadge}
                    outOfStockLabel={labels.outOfStockBadge}
                    addToCartLabel={labels.addToCartLabel}
                    addedLabel={labels.addedLabel}
                    hidePriceAndPurchase={hidePriceAndPurchase}
                    displayPrices={displayPrices}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* One step per level of nesting. Spelled out rather than computed so Tailwind
   emits them, and the left padding is never set by a shorthand as well — two
   utilities for the same edge would resolve by emit order, not by depth. */
const CATEGORY_INDENT = ['pl-2.5', 'pl-6', 'pl-10', 'pl-14'] as const;

function CategoryNavButton({
  label,
  count,
  active,
  depth = 0,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  depth?: number;
  onClick: () => void;
}) {
  const indent = CATEGORY_INDENT[Math.min(depth, CATEGORY_INDENT.length - 1)];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 pr-2.5 py-2 rounded-lg mb-0.5 text-left text-[13px] transition-colors',
        indent,
        active
          ? 'bg-royal-pale border border-royal-border text-royal-dark font-semibold'
          : 'bg-transparent border border-transparent text-ink-700 font-medium hover:bg-ink-25',
      )}>
      {/* Indenting eats into the 260px sidebar, so a deep name is truncated
          and would otherwise be unreadable. */}
      <span className="flex-1 min-w-0 truncate" title={label}>
        {label}
      </span>
      <span
        className={cn(
          'text-[11px] tabular-nums shrink-0',
          active ? 'text-royal-dark font-bold' : 'text-ink-500',
        )}>
        {count}
      </span>
    </button>
  );
}
