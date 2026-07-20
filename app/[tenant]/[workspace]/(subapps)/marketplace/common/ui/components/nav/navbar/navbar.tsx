'use client';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {RESPONSIVE_SIZES, SUBAPP_CODES} from '@/constants';
import {authClient} from '@/lib/auth-client';
import {i18n} from '@/locale';
import {Portal} from '@/ui/components';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {Link} from '@/ui/components/link';
import {usePathname} from 'next/navigation';
import {useEffect, useMemo, useState} from 'react';
import {MARKETPLACE_LINKS} from '../../../../constants/marketplace-links';
import styles from './index.module.scss';

function NavLinks() {
  const {workspaceURI} = useWorkspace();
  const pathname = usePathname();
  const {data: session} = authClient.useSession();
  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  const links = useMemo(
    () => MARKETPLACE_LINKS.filter(item => !item.requiresAuth || session?.user),
    [session?.user],
  );

  return (
    <nav className="flex">
      {links.map(item => {
        const href = item.segment
          ? `${marketplaceBase}/${item.segment}`
          : marketplaceBase;
        // For the root Products link, only highlight on the listing or
        // product detail pages — not on sibling segments like my-contributions.
        const active = item.segment
          ? pathname.startsWith(href)
          : pathname === marketplaceBase ||
            pathname.startsWith(`${marketplaceBase}/products`);
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

export function Navbar() {
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
