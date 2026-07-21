'use client';

import {useEffect, useMemo, useState} from 'react';
import Image from 'next/image';
import {Link} from '@/ui/components/link';
import {MdChevronRight, MdShoppingCart} from 'react-icons/md';

import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {useToast} from '@/ui/hooks';
import {i18n} from '@/locale';
import {InnerHTML} from '@/ui/components';
import {getProductImageURL} from '@/utils/files';
import {cn} from '@/utils/css';

import {
  getCategoryGradient,
  getCategoryHue,
} from '@/subapps/shop/common/utils/category-style';
import type {ShopCategory} from '@/subapps/shop/common/ui/components';
import type {ComputedProduct} from '@/types';

export interface ShopProductDetailLabels {
  categoriesTitle: string;
  allProducts: string;
  breadcrumbRoot: string;
  refLabel: string;
  inStockBadge: string;
  inStockRemainingPrefix: string;
  outOfStockBadge: string;
  htSuffix: string;
  ttcSuffix: string;
  quantityLabel: string;
  addToCart: string;
  reassuranceDelivery: string;
  reassuranceWarranty: string;
  reassuranceInvoice: string;
  tabDescription: string;
  tabSpecs: string;
  specRef: string;
  specCategory: string;
  specWarranty: string;
  specDelivery: string;
  warrantyValue: string;
  deliveryInStock: string;
  deliveryOnOrder: string;
  relatedTitle: string;
}

interface ShopProductDetailProps {
  product: ComputedProduct;
  categories: ShopCategory[];
  countsByCat: Record<string, number>;
  totalCount: number;
  relatedProducts: ComputedProduct[];
  labels: ShopProductDetailLabels;
  hidePriceAndPurchase?: boolean;
}

export function ShopProductDetail({
  product: computedProduct,
  categories,
  countsByCat,
  totalCount,
  relatedProducts,
  labels,
  hidePriceAndPurchase = false,
}: ShopProductDetailProps) {
  const {workspaceURI, tenant} = useWorkspace();
  const {updateQuantity, getProductQuantity} = useCart();
  const {toast} = useToast();

  const product = computedProduct?.product;
  const price = computedProduct?.price;

  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<'desc' | 'specs'>('desc');
  const [activeImg, setActiveImg] = useState(0);

  // Pick the portal category to highlight in the sidebar + breadcrumb.
  // The portal exposes products via portalCategorySet (many-to-many) — that's
  // the set the catalog actually filters on. Falls back to the primary
  // productCategory for products that bypass portal exposure.
  const portalCategories = product?.portalCategorySet ?? [];
  const cat = portalCategories[0] ?? product?.productCategory ?? null;
  const catName = cat?.name ?? null;
  const hue = getCategoryHue(catName);

  // Only surface the rupture badge when the workspace policy asks to notify the
  // user (showMessage); the "allow buy, no message" policy must keep showing
  // "in stock" even when the item is technically unavailable.
  const outOfStock =
    !!product?.outOfStockConfig?.outOfStock &&
    !!product?.outOfStockConfig?.showMessage;
  const inStock = !outOfStock;
  const canBuy = !!product?.outOfStockConfig?.canBuy;

  // Sync initial qty with any pre-existing cart quantity for this product.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!product?.id) return;
      const existing = await getProductQuantity(product.id);
      if (!cancelled) setQty(existing > 0 ? existing : 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [product?.id, getProductQuantity]);

  const images = useMemo(() => {
    const ids: string[] = [];
    if (product?.thumbnailImage?.id)
      ids.push(String(product.thumbnailImage.id));
    if (product?.picture?.id) ids.push(String(product.picture.id));
    if (Array.isArray(product?.portalImageList)) {
      for (const item of product.portalImageList) {
        if (item?.picture?.id) ids.push(String(item.picture.id));
      }
    }
    if (Array.isArray(product?.images)) {
      for (const i of product.images) ids.push(String(i));
    }
    // De-duplicate while preserving order
    return Array.from(new Set(ids));
  }, [product]);

  const handleAdd = async () => {
    if (!canBuy) return;
    if (qty < 1) {
      toast({
        variant: 'destructive',
        description: i18n.t('Enter valid quantity'),
      });
      return;
    }
    setAdding(true);
    try {
      await updateQuantity({
        productId: product.id,
        quantity: qty,
        computedProduct,
        images: (product.images ?? []).map(String),
      });
      toast({title: i18n.t('Added to cart')});
    } finally {
      setAdding(false);
    }
  };

  const catalogHref = `${workspaceURI}/${SUBAPP_CODES.shop}`;
  const categoryHref = (id: string) =>
    `${catalogHref}?cat=${encodeURIComponent(id)}`;

  const specs: {label: string; value: string}[] = [
    {label: labels.specRef, value: product?.code ?? '—'},
    {label: labels.specCategory, value: catName ?? '—'},
  ];

  const productHref = (slug: string, categorySlug?: string | null) =>
    categorySlug
      ? `${workspaceURI}/${SUBAPP_CODES.shop}/category/${categorySlug}/product/${slug}`
      : `${workspaceURI}/${SUBAPP_CODES.shop}/product/${slug}`;

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] bg-ink-25">
      {/* Sidebar — continuité V3 */}
      <aside className="w-[260px] shrink-0 bg-white border-r border-ink-100 px-[18px] py-5 overflow-y-auto">
        <h2 className="m-0 mb-3.5 text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-700">
          {labels.categoriesTitle}
        </h2>
        <CategoryNavLink
          href={catalogHref}
          label={labels.allProducts}
          count={totalCount}
          active={false}
        />
        {categories.map(c => {
          const active = portalCategories.some(
            pc => String(pc?.id) === String(c.id),
          );
          return (
            <CategoryNavLink
              key={c.id}
              href={categoryHref(String(c.id))}
              label={c.name ?? '—'}
              count={countsByCat[String(c.id)] ?? 0}
              active={active}
            />
          );
        })}
      </aside>

      {/* Main pane */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 md:px-8 py-6 pb-14 max-w-[1280px] mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-ink-500 mb-[18px] flex-wrap">
            <Link
              href={catalogHref}
              className="hover:text-ink-700 transition-colors">
              {labels.breadcrumbRoot}
            </Link>
            {cat && (
              <>
                <MdChevronRight className="text-ink-300 text-xs" />
                <Link
                  href={categoryHref(String(cat.id))}
                  className="hover:text-ink-700 transition-colors truncate max-w-[220px]">
                  {cat.name}
                </Link>
              </>
            )}
            <MdChevronRight className="text-ink-300 text-xs" />
            <span className="text-ink-900 font-semibold truncate">
              {i18n.tattr(product?.name ?? '')}
            </span>
          </nav>

          {/* Gallery + Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-9">
            {/* Gallery */}
            <div>
              <GalleryFrame
                images={images}
                tenant={tenant}
                activeIndex={activeImg}
                fallbackHue={hue}
                categoryName={catName}
              />
              {images.length > 1 && (
                <div className="flex gap-2.5 mt-3">
                  {images.slice(0, 4).map((id, i) => (
                    <button
                      key={id + i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        'w-[72px] h-[72px] rounded-[10px] overflow-hidden grid place-items-center relative',
                        i === activeImg
                          ? 'border-2 border-royal'
                          : 'border-2 border-ink-100',
                      )}>
                      <Image
                        src={getProductImageURL(id, tenant)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h1 className="m-0 text-[28px] font-extrabold text-ink-900 tracking-[-0.02em] leading-[1.2]">
                {i18n.tattr(product?.name ?? '')}
              </h1>
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                {product?.code && (
                  <span className="text-[12.5px] text-ink-500 font-mono">
                    {labels.refLabel} {product.code}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full text-[11.5px] font-bold',
                    inStock
                      ? 'bg-mint-50 text-mint-700'
                      : 'bg-status-rejected-bg text-status-rejected-fg',
                  )}>
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      inStock ? 'bg-mint-500' : 'bg-status-rejected-fg',
                    )}
                  />
                  {inStock ? labels.inStockBadge : labels.outOfStockBadge}
                </span>
              </div>

              {product?.description && (
                <div className="mt-4 text-[14.5px] text-ink-700 leading-[1.6] [&_p]:my-0 [&_p+p]:mt-2">
                  <InnerHTML
                    content={String(product.description).replace(
                      /<[^>]+>/g,
                      ' ',
                    )}
                  />
                </div>
              )}

              {/* Price card — hidden for guests / users without a pricelist */}
              {!hidePriceAndPurchase && (
                <div className="mt-[22px] p-5 rounded-[14px] bg-white border border-ink-100 shadow-xs">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[32px] font-extrabold text-ink-900 tracking-[-0.02em] tabular-nums">
                      {price?.displayPrimary ?? '—'}
                    </span>
                    <span className="text-[13px] font-semibold text-ink-500">
                      {labels.htSuffix}
                    </span>
                  </div>
                  {price?.displayTwoPrices && price?.displaySecondary && (
                    <div className="text-[13px] text-ink-500 mt-0.5 tabular-nums">
                      {price.displaySecondary} {labels.ttcSuffix}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-[18px]">
                    <div className="flex items-center border border-ink-150 rounded-[10px] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        aria-label="Decrement"
                        className="w-9 h-[42px] grid place-items-center text-lg font-semibold text-ink-900 hover:bg-ink-25 transition-colors">
                        −
                      </button>
                      <div
                        className="w-12 text-center text-sm font-bold text-ink-900 tabular-nums"
                        aria-label={labels.quantityLabel}>
                        {qty}
                      </div>
                      <button
                        type="button"
                        onClick={() => setQty(q => q + 1)}
                        aria-label="Increment"
                        className="w-9 h-[42px] grid place-items-center text-lg font-semibold text-ink-900 hover:bg-ink-25 transition-colors">
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={!canBuy || adding}
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-2 px-[18px] py-3.5 rounded-[11px] text-sm font-bold text-white transition-colors',
                        canBuy
                          ? 'bg-royal hover:bg-royal-dark'
                          : 'bg-ink-200 cursor-not-allowed',
                      )}
                      style={
                        canBuy
                          ? {
                              boxShadow:
                                '0 1px 2px rgba(13,30,75,0.15), 0 4px 12px rgba(13,30,75,0.12)',
                            }
                          : undefined
                      }>
                      <MdShoppingCart className="text-base" />
                      {labels.addToCart}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-ink-100 flex gap-1 mb-5">
            {(['desc', 'specs'] as const).map(k => {
              const active = tab === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={cn(
                    'px-4 py-3 text-sm font-bold border-b-[2.5px] -mb-px transition-colors',
                    active
                      ? 'border-royal text-ink-900'
                      : 'border-transparent text-ink-500 hover:text-ink-700',
                  )}>
                  {k === 'desc' ? labels.tabDescription : labels.tabSpecs}
                </button>
              );
            })}
          </div>

          {tab === 'desc' ? (
            <div className="bg-white border border-ink-100 rounded-[14px] p-6 text-[14.5px] text-ink-700 leading-[1.7] max-w-[760px] [&_p]:my-0 [&_p+p]:mt-3">
              {product?.description ? (
                <InnerHTML content={product.description} />
              ) : (
                <p className="m-0 text-ink-500">—</p>
              )}
            </div>
          ) : (
            <div className="bg-white border border-ink-100 rounded-[14px] overflow-hidden max-w-[760px]">
              {specs.map((s, i) => (
                <div
                  key={s.label}
                  className={cn(
                    'grid grid-cols-[220px_1fr] gap-4 px-5 py-3 text-[13.5px]',
                    i % 2 === 0 ? 'bg-ink-25' : 'bg-white',
                  )}>
                  <span className="text-ink-500 font-semibold">{s.label}</span>
                  <span className="text-ink-900 font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Related */}
          {relatedProducts.length > 0 && (
            <section className="mt-10">
              <h2 className="m-0 mb-4 text-lg font-bold text-ink-900 tracking-[-0.015em]">
                {labels.relatedTitle}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {relatedProducts.map(r => {
                  const rProduct = r?.product ?? r;
                  const rImageId =
                    rProduct?.thumbnailImage?.id || rProduct?.images?.[0];
                  const rImage = rImageId
                    ? getProductImageURL(rImageId, tenant)
                    : null;
                  return (
                    <Link
                      key={rProduct.id}
                      href={productHref(rProduct.slug, cat?.slug)}
                      className={cn(
                        'group bg-white border border-ink-100 rounded-xl overflow-hidden',
                        'flex flex-col transition-all duration-150',
                        'hover:-translate-y-0.5 hover:shadow-soft-md',
                      )}>
                      <div
                        className="relative h-[110px] grid place-items-center"
                        style={
                          rImage
                            ? undefined
                            : {background: getCategoryGradient(hue)}
                        }>
                        {rImage ? (
                          <Image
                            src={rImage}
                            alt={i18n.tattr(rProduct.name)}
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 240px, 50vw"
                          />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <div className="text-[12.5px] font-bold text-ink-900 leading-[1.3] min-h-[32px] line-clamp-2">
                          {i18n.tattr(rProduct.name)}
                        </div>
                        {!hidePriceAndPurchase && (
                          <div className="text-sm font-extrabold text-ink-900 mt-1.5 tabular-nums">
                            {r?.price?.displayPrimary ?? '—'}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryNavLink({
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

function GalleryFrame({
  images,
  tenant,
  activeIndex,
  fallbackHue,
  categoryName,
}: {
  images: string[];
  tenant: string;
  activeIndex: number;
  fallbackHue: number;
  categoryName: string | null;
}) {
  const id = images[activeIndex] ?? images[0];
  const src = id ? getProductImageURL(id, tenant) : null;
  return (
    <div
      className="relative h-[380px] rounded-[16px] overflow-hidden border border-ink-100 grid place-items-center"
      style={src ? undefined : {background: getCategoryGradient(fallbackHue)}}>
      {src ? (
        <Image
          src={src}
          alt={categoryName ?? ''}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 540px, 100vw"
          priority
        />
      ) : null}
      {categoryName && (
        <span
          className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-white/95 text-royal-dark text-[11px] font-bold uppercase tracking-[0.04em]"
          style={{color: src ? undefined : `hsl(${fallbackHue}, 60%, 25%)`}}>
          {categoryName}
        </span>
      )}
    </div>
  );
}
