'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';

import {Portal} from '@/ui/components';
import {RESPONSIVE_SIZES, SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

import styles from './index.module.scss';
import {MARKETPLACE_LINKS} from '../../../constant/marketplace-links';

function NavLinks() {
  const {workspaceURI} = useWorkspace();
  const pathname = usePathname();
  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  return (
    <nav className="flex">
      {MARKETPLACE_LINKS.map(item => {
        const href = `${marketplaceBase}/${item.segment}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={item.id}
            href={href}
            className={cn(
              'px-4 pb-1 font-medium transition-colors border-b-2',
              active
                ? 'text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}>
            {i18n.t(item.title)}
          </Link>
        );
      })}
    </nav>
  );
}

export function MarketplaceNavbar() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const res = useResponsive();
  const small = RESPONSIVE_SIZES.some(x => res[x]);

  useEffect(() => {
    if (small) return;
    const el = document.getElementById('subapp-header-nav');
    if (el) {
      el.classList.add(styles.container);
      setContainer(el);
    }
    return () => {
      el?.classList?.remove(styles.container);
    };
  }, [small]);

  if (small || !container) return null;

  return (
    <Portal container={container}>
      <NavLinks />
    </Portal>
  );
}
