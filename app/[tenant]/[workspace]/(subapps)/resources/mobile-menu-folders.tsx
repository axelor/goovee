'use client';

import {useCallback, useEffect, useState} from 'react';
import {MdOutlineFolder} from 'react-icons/md';
import {usePathname} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Sheet, SheetContent, SheetTitle, Portal} from '@/ui/components';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {
  DocsSidebarContent,
  type DocsSidebarProps,
} from '@/subapps/resources/common/ui/components';
import styles from './styles.module.scss';

/* Below lg the folder column is gone, so the same content is reached from the
   mobile menu bar instead. It closes on navigation because the tree it holds is
   what does the navigating — leaving it open would cover the page it opened. */
function FoldersSheet(props: DocsSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const openFolders = useCallback(() => setOpen(true), []);
  const closeFolders = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label={i18n.t('Folders')}
        onClick={openFolders}
        className="cursor-pointer">
        <MdOutlineFolder className="h-6 w-6" />
      </button>
      <Sheet open={open} onOpenChange={closeFolders}>
        <SheetContent
          side="left"
          /* The sheet's own close button is pinned to the top-right corner, so
             the panel starts below it rather than under it. */
          className="bg-white w-full sm:w-3/4 p-0 pt-12 gap-0 flex flex-col">
          {/* Named for a screen reader even though the panel shows no heading:
              a dialog without one is announced as nothing in particular. */}
          <SheetTitle className="sr-only">{i18n.t('Folders')}</SheetTitle>
          {/* Closes on any link, not only on the path changing: tapping the row
              for the folder already open would otherwise leave the panel over
              the page it was meant to reveal. */}
          <div
            className="flex flex-1 min-h-0 flex-col"
            onClick={event => {
              if ((event.target as HTMLElement).closest('a')) closeFolders();
            }}>
            <DocsSidebarContent {...props} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function MobileMenuFolders(props: DocsSidebarProps) {
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
        <FoldersSheet {...props} />
      </Portal>
    )
  );
}
