'use client';

import {useCallback, useEffect, useState} from 'react';
import {MdOutlineNewspaper} from 'react-icons/md';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Sheet, SheetContent, Portal, MobileCategoryMenu} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import type {Category} from '@/types';

// ---- LOCAL IMPORTS ---- //
import styles from './styles.module.scss';
import {transformCategories} from '@/app/[tenant]/[workspace]/(subapps)/news/common/utils';

export function MobileCategories({
  categories = [],
  onClick,
}: {
  categories?: Category[];
  onClick?: any;
}) {
  const [open, setOpen] = useState(false);

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);

  const handleItemClick = ({
    category,
    url,
  }: {
    category: Category;
    url: string;
  }) => {
    onClick && onClick({url, category});
    closeSidebar();
  };
  return (
    <>
      <MdOutlineNewspaper
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
            slugKey={'slug'}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function MobileMenuCategory({categories}: {categories: any}) {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const [container, setContainer] = useState<any>(null);

  const $categories: Category[] = transformCategories(categories);

  const handleCategoryClick = ({url}: {url: string}) => {
    router.push(`${workspaceURI}/news/${url}`);
  };

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
        <MobileCategories
          categories={$categories}
          onClick={handleCategoryClick}
        />
      </Portal>
    )
  );
}
