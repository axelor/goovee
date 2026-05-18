'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

import {RESPONSIVE_SIZES, SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {MARKETPLACE_TYPE_SEGMENT} from '../../../constant/route-types';

type NavLink = {
  id: number;
  title: string;
  segment: string;
};

const LINKS: NavLink[] = [
  {id: 1, title: 'Skills', segment: MARKETPLACE_TYPE_SEGMENT.SKILLS},
  {id: 2, title: 'Apps Studio', segment: MARKETPLACE_TYPE_SEGMENT.APPS},
  {id: 3, title: 'My contributions', segment: 'my-contributions'},
];

export function MarketplaceNavbar() {
  const {workspaceURI} = useWorkspace();
  const pathname = usePathname();
  const res = useResponsive();
  const small = RESPONSIVE_SIZES.some(x => res[x]);

  if (small) return null;

  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  return (
    <div className="border-b border-border bg-background">
      <div className="container flex pl-8">
        {LINKS.map(item => {
          const href = `${marketplaceBase}/${item.segment}`;
          const active = pathname.startsWith(href);
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                'px-4 pt-4 pb-1 font-medium transition-colors border-b-2',
                active
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}>
              {i18n.t(item.title)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
