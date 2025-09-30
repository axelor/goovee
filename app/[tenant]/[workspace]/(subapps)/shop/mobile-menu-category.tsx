'use client';

import {useCallback, useEffect, useState} from 'react';
import {MdOutlineShoppingBag} from 'react-icons/md';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Sheet, SheetContent, Portal, MobileCategoryMenu} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import type {Category} from '@/types';

// ---- LOCAL IMPORTS ---- //
import styles from './styles.module.scss';

export function MobileCategories({
  categories = [],
  onClick,
}: {
  categories?: Category[];
  onClick?: any;
  showCart?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);

  const handleItemClick = ({
    category,
    url,
  }: {
    category: Category;
    url: string | null;
  }) => {
    onClick && onClick({category, url});
    closeSidebar();
  };

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
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function MobileMenuCategory({categories}: any) {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const [container, setContainer] = useState<any>(null);

  const handleCategoryClick = ({category}: {category: Category}) => {
    router.push(`${workspaceURI}/shop/category/${category.slug}`);
  };
  useEffect(() => {
    let container = document.getElementById('subapp-menu');

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
        <MobileCategories
          categories={categories}
          onClick={handleCategoryClick}
        />
      </Portal>
    )
  );
}
