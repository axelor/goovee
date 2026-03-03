'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {
  GLOBAL_MENU,
  WORKSPACE_MENU,
  ADMIN_WORKSPACE_MENU,
} from './common/constants';

type Item = {
  label: string;
  route: string;
};

function MenuItem({item}: {item: Item}) {
  const pathname = usePathname();
  const {workspaceURI} = useWorkspace();

  return (
    <div
      key={item.route}
      title={i18n.t(item.label)}
      className={cn(
        'line-clamp-1 text-center p-1 font-medium text-sm lg:line-clamp-none lg:text-left lg:font-normal lg:ps-8 rounded-sm cursor-pointer',
        {
          ['bg-success-light text-success']: pathname.includes(item.route),
        },
      )}>
      <Link key={item.route} href={`${workspaceURI}/account/${item.route}`}>
        {i18n.t(item.label)}
      </Link>
    </div>
  );
}

function Menu({title, items}: {title: string; items: Item[]}) {
  return (
    <div className="space-y-2">
      <h2 className="py-1 lg:px-4 text-sm font-semibold">{title}</h2>
      <div className="h-[1px] border-b" />
      <div
        className={`grid grid-cols-${items?.length || 1} items-center lg:block lg:space-y-8`}>
        {items.map(item => (
          <MenuItem key={item.route} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({isAdmin}: {isAdmin: boolean}) {
  return (
    <div className="space-y-4 p-2 bg-white lg:bg-inherit lg:border-e lg:space-y-10 lg:px-0 lg:py-2">
      <Menu title={i18n.t('Global')} items={GLOBAL_MENU} />
      <Menu
        title={i18n.t('Workspace')}
        items={isAdmin ? ADMIN_WORKSPACE_MENU : WORKSPACE_MENU}
      />
    </div>
  );
}
