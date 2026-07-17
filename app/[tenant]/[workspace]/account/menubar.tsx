'use client';

import {usePathname} from 'next/navigation';
import {
  MdOutlinePerson,
  MdOutlineTune,
  MdOutlineLock,
  MdOutlineLocationOn,
  MdOutlineVisibility,
  MdOutlineGroup,
  MdOutlineNotificationsActive,
  MdOutlineApps,
} from 'react-icons/md';
import {IconType} from 'react-icons';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {
  ACCOUNT_GROUPS,
  ACCOUNT_TABS,
  type AccountTab,
  type AccountTabIcon,
} from './common/constants';

const TAB_ICONS: Record<AccountTabIcon, IconType> = {
  personal: MdOutlinePerson,
  preferences: MdOutlineTune,
  password: MdOutlineLock,
  addresses: MdOutlineLocationOn,
  directory: MdOutlineVisibility,
  members: MdOutlineGroup,
  notifications: MdOutlineNotificationsActive,
  apps: MdOutlineApps,
};

function isTabActive(pathname: string, tab: AccountTab): boolean {
  return pathname.includes(`/account/${tab.route}`);
}

export default function Menubar({
  isAdmin,
  companyName,
  role,
}: {
  isAdmin: boolean;
  companyName?: string;
  role?: string;
}) {
  const pathname = usePathname();
  const {workspaceURI} = useWorkspace();

  const tabs = ACCOUNT_TABS.filter(tab => !tab.adminOnly || isAdmin);
  const initial = (companyName?.trim()?.[0] || 'A').toUpperCase();

  return (
    <aside className="lg:w-[260px] shrink-0 bg-white lg:rounded-xl lg:border lg:border-ink-100 lg:shadow-xs overflow-hidden">
      {/* Identity header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-ink-100">
        <span className="shrink-0 w-10 h-10 rounded-[10px] grid place-items-center text-white font-extrabold text-[15px] bg-gradient-to-br from-mint-300 to-royal">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-900 truncate">
            {companyName || i18n.t('Account')}
          </p>
          {role && (
            <p className="text-[11.5px] text-ink-500 truncate">
              {i18n.t(role)}
            </p>
          )}
        </div>
      </div>

      {/* Grouped navigation */}
      <nav className="flex flex-col gap-3 p-3">
        {ACCOUNT_GROUPS.map(group => {
          const groupTabs = tabs.filter(tab => tab.group === group);
          if (!groupTabs.length) return null;

          return (
            <div key={group} className="flex flex-col gap-0.5">
              <p className="px-2 pt-1 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-ink-500">
                {i18n.t(group)}
              </p>
              {groupTabs.map(tab => {
                const Icon = TAB_ICONS[tab.icon];
                const active = isTabActive(pathname, tab);
                const href = `${workspaceURI}/account/${tab.route}`;

                return (
                  <Link
                    key={tab.key}
                    href={href}
                    className={cn(
                      'group flex items-center gap-3 rounded-[9px] px-2.5 py-2.5 border transition-colors',
                      active
                        ? 'bg-royal-pale border-royal-border text-royal-dark font-semibold'
                        : 'border-transparent text-ink-700 font-medium hover:bg-ink-25',
                    )}>
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        active ? 'text-royal' : 'text-ink-400',
                      )}
                    />
                    <span className="text-sm leading-tight truncate">
                      {i18n.t(tab.label)}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
