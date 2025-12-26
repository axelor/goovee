'use client';

import {useCallback, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {MdOutlineCalendarMonth} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Sheet, SheetContent, Portal} from '@/ui/components';
import {AccordionMenu} from '@/ui/components/accordion-menu/accordion-menu';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useSearchParams} from '@/ui/hooks';
import {i18n} from '@/lib/core/locale';
import type {Category, User} from '@/types';

// ---- LOCAL IMPORTS ---- //
import styles from '@/subapps/events/common/ui/components/mobile-menu-category/index.module.scss';
import {
  MY_REGISTRATION_TAB_ITEMS,
  EVENTS,
} from '@/subapps/events/common/constants/index';
import {DEFAULT_PAGE, SUBAPP_CODES, URL_PARAMS} from '@/constants';

interface MyRegistrationItem extends AccordionMenu {
  url: string;
}

export function MobileCategories({
  categories = [],
  user,
}: {
  categories?: Category[];
  user?: User;
}) {
  const [open, setOpen] = useState(false);
  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  const router = useRouter();
  const {workspaceURI} = useWorkspace();
  const {update} = useSearchParams();

  const EventItems: AccordionMenu[] = [
    {
      id: '1',
      name: i18n.t('Events'),
      items: categories as AccordionMenu[],
    },
  ];

  const MyRegistrationItem: MyRegistrationItem[] = [
    {
      id: '2',
      name: i18n.t('My registrations'),
      url: '',
      items: MY_REGISTRATION_TAB_ITEMS.map((item: any) => ({
        id: item.id,
        name: i18n.t(item.title),
        url: item.label,
      })),
    },
  ];

  const handleItemClick = ({
    item,
    level,
  }: {
    item: AccordionMenu;
    level: number;
  }) => {
    if (level !== 0) {
      update([
        {key: URL_PARAMS.category, value: item.id},
        {key: URL_PARAMS.page, value: DEFAULT_PAGE},
      ]);
      setOpen(false);
    }
  };
  const handleRegistrationItemClick = ({
    item,
    level,
  }: {
    item: MyRegistrationItem;
    level: number;
  }) => {
    if (level !== 0) {
      router.push(
        `${workspaceURI}/${SUBAPP_CODES.events}/${EVENTS.MY_REGISTRATIONS}/${item.url}`,
      );
      setOpen(false);
    }
  };
  const isLoggedIn = user?.email;

  return (
    <>
      <MdOutlineCalendarMonth
        className="cursor-pointer h-6 w-6"
        onClick={openSidebar}
      />
      <Sheet open={open} onOpenChange={closeSidebar}>
        <SheetContent
          side="left"
          className="bg-white divide-y divide-grey-1 w-full sm:w-3/4 px-0">
          <AccordionMenu
            items={EventItems}
            defaultOpenIds={!isLoggedIn ? EventItems.map(item => item.id) : []}
            onItemClick={handleItemClick}
            className="mt-4"
          />
          {isLoggedIn && (
            <AccordionMenu<MyRegistrationItem>
              items={MyRegistrationItem}
              onItemClick={handleRegistrationItemClick}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export function MobileMenuCategory({categories, user}: any) {
  const [container, setContainer] = useState<any>(null);

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
        <MobileCategories categories={categories} user={user} />
      </Portal>
    )
  );
}
