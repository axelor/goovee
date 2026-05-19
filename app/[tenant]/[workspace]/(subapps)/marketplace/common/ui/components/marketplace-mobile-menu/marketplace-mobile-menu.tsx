'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
// ---- CORE IMPORTS ---- //
import {Icon, Portal} from '@/ui/components';
import {Sheet, SheetContent, SheetTitle} from '@/ui/components/sheet';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {authClient} from '@/lib/auth-client';
import {SUBAPP_CODES} from '@/constants';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import styles from './index.module.scss';
import {MARKETPLACE_LINKS} from '../../../constant/marketplace-links';

function Menu({icon, color}: {icon: string; color?: string}) {
  const [open, setOpen] = useState(false);
  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  const {workspaceURI} = useWorkspace();
  const pathname = usePathname();
  const {data: session} = authClient.useSession();
  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  const links = useMemo(
    () => MARKETPLACE_LINKS.filter(item => !item.requiresAuth || session?.user),
    [session?.user],
  );

  return (
    <>
      <button
        type="button"
        aria-label={i18n.t('Open menu')}
        onClick={openSidebar}
        className="cursor-pointer">
        <Icon
          name={icon}
          className="h-6 w-6"
          style={color ? {color} : undefined}
        />
      </button>
      <Sheet open={open} onOpenChange={closeSidebar}>
        <SheetContent
          side="left"
          className="bg-white w-full sm:w-3/4 px-0 pt-10">
          <SheetTitle className="sr-only">
            {i18n.t('Marketplace menu')}
          </SheetTitle>
          <nav className="flex flex-col">
            {links.map(item => {
              const href = `${marketplaceBase}/${item.segment}`;
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={item.id}
                  href={href}
                  onClick={closeSidebar}
                  className={cn(
                    'px-6 py-4 text-base font-medium transition-colors',
                    active ? 'text-primary' : 'text-foreground hover:bg-muted',
                  )}>
                  {i18n.t(item.title)}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function MarketplaceMobileMenu({
  icon,
  color,
}: {
  icon: string;
  color?: string;
}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('subapp-menu');
    if (el) {
      el.classList.add(styles.container);
      setContainer(el);
    }
    return () => {
      el?.classList?.remove(styles.container);
    };
  }, []);

  return container ? (
    <Portal container={container}>
      <Menu icon={icon} color={color} />
    </Portal>
  ) : null;
}
