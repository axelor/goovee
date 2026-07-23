'use client';

import {useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {authClient} from '@/lib/auth-client';
import {cn} from '@/utils/css';
import {Icon} from '@/ui/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TooltipArrow,
} from '@/ui/components/tooltip';
import {SUBAPP_CODES, SUBAPP_PAGE, CHAT_TYPE} from '@/constants';
import {i18n} from '@/locale';
import {useWorkspace} from './workspace-context';
import {useEnvironment} from '@/lib/core/environment';
import {toWorkspaceURI} from '@/utils/workspace';
import {Link} from '@/ui/components/link';
import type {Subapp} from '@/orm/workspace';
import type {ShellConfig} from './orm/config';
import type {Cloned} from '@/types/util';

type WorkspaceListItem = {id: string; name: string | null; url: string | null};

function getInitials(name?: string | null, email?: string | null) {
  const source = (name?.trim() || email?.split('@')[0] || '').toUpperCase();
  if (!source) return 'U';
  const parts = source.split(/\s+|[._-]/).filter(Boolean);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return source.slice(0, 2);
}

export function Sidebar({
  subapps,
  workspaces,
  showHome,
  config,
}: {
  subapps: Subapp[];
  workspaces?: WorkspaceListItem[];
  showHome: boolean | null;
  config: ShellConfig | Cloned<ShellConfig>;
}) {
  const {data: session} = authClient.useSession();
  const [collapsed, setCollapsed] = useState(false);
  const {workspaceURI, workspaceID} = useWorkspace();
  const env = useEnvironment();
  const mattermostUrl = env?.GOOVEE_PUBLIC_MATTERMOST_HOST || '';
  const pathname = usePathname();
  const router = useRouter();

  const user = session?.user as
    | {name?: string; email?: string; image?: string}
    | undefined;

  if (!user) {
    return null;
  }

  const toggle = () => setCollapsed(c => !c);
  const redirect = (value: string) => router.push(value);

  const installedSubapps =
    subapps
      ?.filter(app => app.isInstalled)
      .sort(
        (app1, app2) =>
          (app1.orderForMySpaceMenu ?? 0) - (app2.orderForMySpaceMenu ?? 0),
      )
      .reverse() ?? [];

  const hasMultipleWorkspaces = (workspaces?.length ?? 0) > 1;
  // The brand block, switcher label and footer all show the *current*
  // workspace — match it by id (fall back to URL), not the first in the list.
  const currentWorkspace =
    workspaces?.find(w => String(w.id) === String(workspaceID)) ??
    workspaces?.find(w => toWorkspaceURI(w.url ?? '') === workspaceURI);
  const workspaceName: string = currentWorkspace?.name || 'Goovee';

  const isHomeActive = pathname === workspaceURI;
  const isAccountActive = pathname?.startsWith(`${workspaceURI}/account`);

  const initials = getInitials(user?.name, user?.email);

  return (
    <aside
      className={cn(
        'hidden lg:flex lg:flex-col sticky left-0 top-0 h-full min-h-screen shrink-0 z-20',
        'bg-royal-gradient text-white/80',
        'border-r border-white/[0.06]',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-[76px]' : 'w-[232px]',
      )}>
      {/* Brand block */}
      <div
        className={cn(
          'flex items-center gap-2.5 min-h-16 border-b border-white/10 px-[22px]',
        )}>
        <button
          type="button"
          onClick={toggle}
          aria-label={i18n.t('Toggle sidebar')}
          className={cn(
            'shrink-0 grid place-items-center text-white font-extrabold text-sm',
            'w-[30px] h-[30px] rounded-lg bg-mint-logo',
            'shadow-[0_4px_10px_rgba(46,163,107,0.30)]',
            'transition hover:opacity-90',
          )}>
          {workspaceName.charAt(0).toUpperCase()}
        </button>
        {!collapsed &&
          (hasMultipleWorkspaces ? (
            <Select defaultValue={workspaceURI} onValueChange={redirect}>
              <SelectTrigger className="grow max-w-full overflow-hidden p-0 border-0 !bg-transparent h-auto text-white hover:text-white focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="">
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-bold text-base text-white">
                      {workspaceName}
                    </span>
                    <span className="text-[11px] text-white/55">
                      {i18n.t('Portail clients')}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {workspaces?.map((workspace: WorkspaceListItem) => (
                  <SelectItem
                    key={workspace.url}
                    value={toWorkspaceURI(
                      workspace.url ?? '',
                      env.GOOVEE_PUBLIC_HOST,
                    )}>
                    {workspace.name || workspace.url}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Link href={workspaceURI} className="min-w-0">
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-base text-white truncate">
                  {workspaceName}
                </span>
                <span className="text-[11px] text-white/55">
                  {i18n.t('Portail clients')}
                </span>
              </div>
            </Link>
          ))}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4">
        <TooltipProvider>
          {showHome && (
            <NavItem
              href={workspaceURI}
              icon="home"
              label={i18n.t('Home')}
              active={isHomeActive}
              collapsed={collapsed}
            />
          )}
          {installedSubapps.map(({code, name, icon, color}) => {
            const page = SUBAPP_PAGE[code as keyof typeof SUBAPP_PAGE] || '';
            const isExternalChat =
              code === SUBAPP_CODES.chat &&
              config?.chatDisplayTypeSelect === CHAT_TYPE.external;
            const href = isExternalChat
              ? mattermostUrl
              : `${workspaceURI}/${code}${page}`;
            const active = !isExternalChat
              ? (pathname?.startsWith(`${workspaceURI}/${code}`) ?? false)
              : false;
            return (
              <NavItem
                key={code}
                href={href}
                icon={icon || 'app'}
                iconColor={color ?? undefined}
                label={i18n.t(name ?? '')}
                active={active}
                collapsed={collapsed}
                external={isExternalChat}
              />
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer — user avatar */}
      <Link
        href={`${workspaceURI}/account`}
        className={cn(
          'flex items-center gap-2.5 border-t border-white/10',
          'transition hover:bg-white/[0.06]',
          'px-4 py-3',
          isAccountActive && 'bg-white/[0.08]',
        )}>
        <div
          className={cn(
            'shrink-0 w-8 h-8 rounded-full grid place-items-center',
            'bg-peach-avatar text-white font-bold text-xs',
            'overflow-hidden',
          )}>
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="font-semibold text-[13px] text-white truncate">
              {user?.name || user?.email || i18n.t('Account')}
            </span>
            <span className="text-[11px] text-white/55 truncate">
              {workspaceName}
            </span>
          </div>
        )}
      </Link>
    </aside>
  );
}

export default Sidebar;

function NavItem({
  href,
  icon,
  iconColor,
  label,
  active,
  collapsed,
  external,
}: {
  href: string;
  icon: string;
  iconColor?: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'group relative flex items-center rounded-lg mb-0.5',
        'text-[13.5px] transition-colors duration-150',
        // Fixed height so hiding the label on collapse doesn't shrink the row
        // (which caused a small vertical jump of the icons).
        'gap-3 px-3 h-10',
        active
          ? 'bg-white/[0.16] text-white font-semibold'
          : 'text-white/80 font-medium hover:bg-white/[0.08] hover:text-white',
      )}>
      {active && !collapsed && (
        <span
          aria-hidden
          className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r bg-royal-light"
        />
      )}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span className="shrink-0 w-7 flex justify-center">
            <Icon
              name={icon}
              className="h-[18px] w-[18px]"
              style={iconColor ? {color: iconColor} : undefined}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          className="bg-ink-900 text-white border-0"
          hidden={!collapsed}>
          <p>{label}</p>
          <TooltipArrow className="fill-ink-900" />
        </TooltipContent>
      </Tooltip>
      {!collapsed && (
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </span>
      )}
    </Link>
  );
}
