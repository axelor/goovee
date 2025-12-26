'use client';

import {useCallback, useEffect, useState} from 'react';
import {MdOutlineForum} from 'react-icons/md';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';

// ---- CORE IMPORTS ---- //
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from '@/ui/components/accordion';
import {Sheet, SheetContent} from '@/ui/components/sheet';
import {Portal} from '@/ui/components';
import {cn} from '@/utils/css';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import styles from './styles.module.scss';

export default function MobileMenu({items}: any) {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const [container, setContainer] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);

  const {data: session} = useSession();

  const filteredItems = session
    ? items
    : items.filter((item: any) => item.id === 1);

  const handleMenuClick = (link: string) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.forum}/${link}`);
    closeSidebar();
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
        <MdOutlineForum
          className="cursor-pointer h-6 w-6"
          onClick={openSidebar}
        />
        <Sheet open={open} onOpenChange={closeSidebar}>
          <SheetContent side="left" className="bg-white divide-y divide-grey-1">
            <Accordion type="multiple" className="w-full space-y-4 mt-4">
              {filteredItems.map(({link, id, name}: any) => {
                return (
                  <AccordionItem
                    value={String(id)}
                    className={cn(
                      'border-b-0 space-y-2 m-0',
                      styles['accordion-item'],
                    )}
                    key={id}>
                    <AccordionTrigger
                      className={cn('hover:no-underline py-2 px-2 rounded-lg')}
                      icon={false}>
                      <div
                        className="flex grow gap-2 items-center cursor-pointer"
                        onClick={() => handleMenuClick(link)}>
                        <p className="leading-4 line-clamp-1 text-start">
                          {name}
                        </p>
                      </div>
                    </AccordionTrigger>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </SheetContent>
        </Sheet>
      </Portal>
    )
  );
}
