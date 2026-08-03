'use client';

import {useCallback, useEffect, useState} from 'react';
import {MdOutlineShoppingBag} from 'react-icons/md';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Sheet, SheetContent, Portal, MobileCategoryMenu} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import type {Category} from '@/types';

// ---- LOCAL IMPORTS ---- //
import styles from './styles.module.scss';

export function MobileCategories({categories = []}: {categories?: Category[]}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {workspaceURI} = useWorkspace();

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);

  /* The availability filter acts on the catalogue's product list, so it is
     offered only there — the deeper shop pages have no list to filter. */
  const segments = pathname.split('/').filter(Boolean);
  const isCatalog = segments.at(-1) === SUBAPP_CODES.shop;
  const stockOnly = searchParams.get('stock') === '1';

  /* On the catalogue the other filters have to survive the change, so every
     control merges into the current query. From a deeper page there is
     nothing to keep and we go to the catalogue instead. Closing the sheet is
     what makes the change visible — the list it acts on sits behind it. */
  const applyToCatalog = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(
      isCatalog ? searchParams.toString() : '',
    );
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }

    const query = params.toString();
    if (isCatalog) {
      router.replace(query ? `?${query}` : '?', {scroll: false});
    } else {
      const shopHref = `${workspaceURI}/${SUBAPP_CODES.shop}`;
      router.push(query ? `${shopHref}?${query}` : shopHref);
    }
    closeSidebar();
  };

  const handleItemClick = ({category}: {category: Category}) =>
    applyToCatalog({cat: String(category.id)});

  const handleAllProductsClick = () => applyToCatalog({cat: null});

  const handleStockOnlyChange = () =>
    applyToCatalog({stock: stockOnly ? null : '1'});

  return (
    <>
      <MdOutlineShoppingBag
        className="cursor-pointer h-6 w-6"
        onClick={openSidebar}
      />
      <Sheet open={open} onOpenChange={closeSidebar}>
        <SheetContent
          side="left"
          className="bg-white divide-y divide-grey-1 w-full sm:w-3/4">
          <MobileCategoryMenu
            category={categories}
            parent={null}
            onItemClick={handleItemClick}
            header={
              /* Without this the catalogue could be narrowed on mobile but
                 never widened again — it is the sidebar's "All products". */
              <div
                onClick={handleAllProductsClick}
                className="w-full flex justify-between py-6 px-4 md:px-6 border-b cursor-pointer">
                <p className="leading-4 line-clamp-1 text-start">
                  {i18n.t('All products')}
                </p>
              </div>
            }
            footer={
              isCatalog && (
                <>
                  <div className="px-4 md:px-6 pt-6 pb-2 text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink-700">
                    {i18n.t('Availability')}
                  </div>
                  <label className="w-full flex items-center gap-3 py-6 px-4 md:px-6 border-b cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stockOnly}
                      onChange={handleStockOnlyChange}
                      className="w-4 h-4 accent-royal cursor-pointer"
                    />
                    <span className="leading-4 text-start">
                      {i18n.t('In stock only')}
                    </span>
                  </label>
                </>
              )
            }
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function MobileMenuCategory({
  categories,
}: {
  categories: Category[];
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.getElementById('subapp-menu');

    if (container) {
      container.classList.add(styles.container);
      setContainer(container);
    }

    return () => {
      container?.classList?.remove(styles.container);
    };
  }, []);

  return (
    container && (
      <Portal container={container}>
        <MobileCategories categories={categories} />
      </Portal>
    )
  );
}
