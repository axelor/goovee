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
  sortRelevance: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortName: string;
  inStockBadge: string;
  outOfStockBadge: string;
  addToCartLabel: string;
  addedLabel: string;
  emptyTitle: string;
  emptySubtitle: string;
}

interface ShopCatalogProps {
  categories: ShopCategory[];
  products: ComputedProduct[];
  labels: ShopLabels;
  hidePriceAndPurchase?: boolean;
}

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name';

function priceNumber(product: ComputedProduct): number {
  const raw = product?.price?.displayPrimary ?? '';
  if (typeof raw !== 'string') return 0;
  // Strip non-digit / non-decimal chars (handles "1 234,56 €" or "1234.56€")
  const cleaned = raw.replace(/[^\d.,-]/g, '').replace(/\s/g, '');
  const normalised = cleaned
    .replace(/\.(?=\d{3}(?:[^\d]|$))/g, '')
    .replace(',', '.');
  const n = Number(normalised);
  return Number.isFinite(n) ? n : 0;
}

function productName(product: ComputedProduct): string {
  return i18n.tattr(product?.product?.name ?? '');
}

export function ShopCatalog({
  categories,
  products,
  labels,
  hidePriceAndPurchase,
}: ShopCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCat = searchParams.get('cat') ?? 'all';
  const stockOnly = searchParams.get('stock') === '1';
  const urlSort = (searchParams.get('sort') as SortKey) || 'featured';
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

  // Compute counts per category from the full product list (unfiltered).
  // The portal exposes products via product.portalCategorySet (many-to-many),
  // not via the primary productCategory — we mirror that here so counts and
  // the filter stay consistent with the ORM where clause.
  const countsByCat = useMemo(() => {
    const map = new Map<string, number>();
    map.set('all', products.length);
    for (const p of products) {
      const portal = p?.product?.portalCategorySet ?? [];
      const seen = new Set<string>();
      for (const c of portal) {
        const id = String(c?.id ?? '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return map;
  }, [products]);

  const categoryById = useMemo(() => {
    const map = new Map<string, ShopCategory>();
    for (const c of categories) map.set(String(c.id), c);
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    let out = products;
    if (activeCat !== 'all') {
      out = out.filter(p => {
        const portal = p?.product?.portalCategorySet ?? [];
        return portal.some(c => String(c?.id) === activeCat);
      });
    }
    if (stockOnly) {
      out = out.filter(p => !p?.product?.outOfStockConfig?.outOfStock);
    }
    if (urlSearch.trim()) {
      const q = urlSearch.trim().toLowerCase();
      out = out.filter(p => productName(p).toLowerCase().includes(q));
    }
    switch (urlSort) {
      case 'price-asc':
        out = [...out].sort((a, b) => priceNumber(a) - priceNumber(b));
        break;
      case 'price-desc':
        out = [...out].sort((a, b) => priceNumber(b) - priceNumber(a));
        break;
      case 'name':
        out = [...out].sort((a, b) =>
          productName(a).localeCompare(productName(b)),
        );
        break;
      default:
        // featured / relevance — keep server order
        break;
    }
    return out;
  }, [products, activeCat, stockOnly, urlSearch, urlSort]);

  const title =
    activeCat === 'all'
      ? labels.defaultPageTitle
      : (categoryById.get(activeCat)?.name ?? labels.defaultPageTitle);

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-ink-25">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 bg-white border-r border-ink-100 px-[18px] py-5 overflow-y-auto">
        <h2 className="m-0 mb-3.5 text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-700">
          {labels.categoriesTitle}
        </h2>
        <CategoryNavButton
          label={labels.allProducts}
          count={countsByCat.get('all') ?? 0}
          active={activeCat === 'all'}
          onClick={() => setParam({cat: null})}
        />
        {categories.map(c => {
          const active = activeCat === String(c.id);
          return (
            <CategoryNavButton
              key={c.id}
              label={c.name ?? '—'}
              count={countsByCat.get(String(c.id)) ?? 0}
              active={active}
              onClick={() => setParam({cat: String(c.id)})}
            />
          );
        })}

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
              <select
                value={urlSort}
                onChange={e =>
                  setParam({
                    sort: e.target.value === 'featured' ? null : e.target.value,
                  })
                }
                className="px-3 py-[9px] rounded-[10px] bg-white border border-ink-150 text-[13px] font-semibold text-ink-800 cursor-pointer">
                <option value="featured">{labels.sortRelevance}</option>
                <option value="price-asc">{labels.sortPriceAsc}</option>
                <option value="price-desc">{labels.sortPriceDesc}</option>
                <option value="name">{labels.sortName}</option>
              </select>
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

function CategoryNavButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
    </button>
  );
}
