'use client';

import {Fragment, useState} from 'react';
import type {Cloned} from '@/types/util';
import Image from 'next/image';
import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {MdExpandMore} from 'react-icons/md';
import {useSignOut} from '@/ui/hooks';
import {getLoginURL} from '@/utils/url';

// ---- CORE IMPORTS ---- //
import {
  Account,
  Separator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/ui/components';
import {i18n} from '@/locale';
import {DEFAULT_LOGO_URL, SUBAPP_PAGE} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Icon} from '@/ui/components';
import type {Workspace} from '@/orm/workspace';
import type {ShellConfig} from './orm/config';
import {useNavigationVisibility} from '@/ui/hooks';
import {useResponsive} from '@/ui/hooks';
import Cart from '@/app/[tenant]/[workspace]/cart';
import {cn} from '@/utils/css';
import {SUBAPP_CODES, CHAT_TYPE} from '@/constants';
import {useEnvironment} from '@/lib/core/environment';
import {Notification} from './notification';
import {withBasePath} from '@/lib/core/path/base-path';
import {toWorkspaceURI} from '@/utils/workspace';
import {Link} from '@/ui/components/link';
import {authClient} from '@/lib/auth-client';

function Logo({
  workspace,
  config,
}: {
  workspace: Workspace | Cloned<Workspace>;
  config: ShellConfig | Cloned<ShellConfig>;
}) {
  const {workspaceURI} = useWorkspace();
  const logoId = workspace.logo?.id || config.company?.logo?.id;
  const logoURL = logoId
    ? withBasePath(`${workspaceURI}/api/workspace/logo/image`)
    : withBasePath(DEFAULT_LOGO_URL);

  return (
    <Link href={workspaceURI}>
      <div className="flex items-center justify-start">
        <div className="w-24 aspect-[2/1] relative">
          <Image
            fill
            src={logoURL}
            alt="Logo"
            className="w-full h-full object-contain"
            priority
            sizes="96px"
          />
        </div>
      </div>
    </Link>
  );
}

function getInitials(name?: string | null, email?: string | null) {
  const source = (name?.trim() || email?.split('@')[0] || '').toUpperCase();
  if (!source) return 'U';
  const parts = source.split(/\s+|[._-]/).filter(Boolean);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return source.slice(0, 2);
}

function ProfilePill({
  baseURL,
  tenant,
}: {
  baseURL: string;
  tenant: string | undefined | null;
}) {
  const {data: session} = authClient.useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const signOut = useSignOut();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const user = session?.user as
    | {name?: string; email?: string; image?: string}
    | undefined;

  const loginURL = getLoginURL({
    callbackurl: pathname + (searchParams.toString() ? `?${searchParams}` : ''),
    workspaceURI: baseURL,
    tenant,
  });

  const handleLogout = async () => {
    await signOut();
    router.push(loginURL);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-ink-50',
            'hover:bg-ink-100 transition-colors focus:outline-none',
          )}
          aria-label={i18n.t('User menu')}>
          <span className="w-7 h-7 rounded-full grid place-items-center bg-peach-avatar text-white font-bold text-[11px] overflow-hidden">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user?.name, user?.email)
            )}
          </span>
          <MdExpandMore className="text-ink-500 text-[14px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={`${baseURL}/account`} className="cursor-pointer">
            <DropdownMenuItem className="cursor-pointer">
              {i18n.t('My Account')}
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={e => {
              e.preventDefault();
              setConfirmOpen(true);
            }}>
            {i18n.t('Logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{i18n.t('Confirm logout')}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{i18n.t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              {i18n.t('Logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Header({
  subapps,
  isTopNavigation = false,
  workspaces,
  workspace,
  config,
  showCart,
}: {
  subapps: any;
  isTopNavigation?: boolean;
  workspaces: {id: string; name: string | null; url: string | null}[];
  workspace: Workspace | Cloned<Workspace>;
  config: ShellConfig | Cloned<ShellConfig>;
  showCart?: boolean | null;
}) {
  const router = useRouter();
  const {data: session} = authClient.useSession();
  const user = session?.user;

  const {workspaceURI, tenant} = useWorkspace();
  const {visible, loading} = useNavigationVisibility();
  const res: any = useResponsive();
  const env = useEnvironment();
  const mattermostUrl = env?.GOOVEE_PUBLIC_MATTERMOST_HOST || '';
  const isLarge = ['lg', 'xl', 'xxl'].some(x => res[x]);

  const redirect = (value: any) => router.push(value);

  const showTopNavigation = subapps?.length
    ? user
      ? isTopNavigation
      : (visible ?? true)
    : false;

  const shouldDisplayIcons = visible && !loading;
  const showCartIcon = showCart && shouldDisplayIcons;
  const isFixedHeader = config.isFixedHeader;

  return (
    <div className={cn(isFixedHeader && 'sticky top-0 z-50', 'bg-white')}>
      <div
        className={cn(
          'h-16 bg-white text-ink-900 px-7 flex items-center gap-4',
          'border-b border-ink-100',
        )}>
        <Logo workspace={workspace} config={config} />

        <div className="grow" />

        {isLarge && (
          <div className="flex items-center gap-2">
            {shouldDisplayIcons &&
              subapps
                .filter((app: any) => app.isInstalled && app.showInTopMenu)
                .sort(
                  (app1: any, app2: any) =>
                    app1.orderForTopMenu - app2.orderForTopMenu,
                )
                .reverse()
                .map(({name, icon, code, color}: any) => {
                  const page =
                    SUBAPP_PAGE[code as keyof typeof SUBAPP_PAGE] || '';
                  const isExternalChat =
                    code === SUBAPP_CODES.chat &&
                    config.chatDisplayTypeSelect === CHAT_TYPE.external;

                  return (
                    <Link
                      key={code}
                      href={
                        isExternalChat
                          ? mattermostUrl
                          : `${workspaceURI}/${code}${page}`
                      }
                      target={isExternalChat ? '_blank' : undefined}
                      rel={isExternalChat ? 'noopener noreferrer' : undefined}
                      className="w-9 h-9 grid place-items-center rounded-lg text-ink-600 hover:bg-ink-50 transition-colors"
                      aria-label={i18n.t(name)}>
                      {icon ? (
                        <Icon
                          name={icon}
                          className="h-[18px] w-[18px]"
                          style={color ? {color} : undefined}
                        />
                      ) : (
                        <p className="font-medium text-sm">{i18n.t(name)}</p>
                      )}
                    </Link>
                  );
                })}
            {user && <Notification />}
            {showCartIcon && <Cart />}
            {user && (
              <>
                <div className="w-px h-6 bg-ink-100 mx-1.5" />
                <ProfilePill baseURL={workspaceURI} tenant={tenant} />
              </>
            )}
            {!user && <Account baseURL={workspaceURI} tenant={tenant} />}
          </div>
        )}
      </div>

      {showTopNavigation && !loading ? (
        <div className="bg-white text-ink-900 z-10 px-7 py-4 hidden lg:flex items-center justify-between border-b border-ink-100 max-w-full gap-10">
          <div>
            {Boolean(workspaces?.length) && user && (
              <Select defaultValue={workspaceURI} onValueChange={redirect}>
                <SelectTrigger className="grow max-w-100 overflow-hidden p-0 border-0 !bg-transparent h-auto">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces?.map(workspace => (
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
            )}
          </div>
          <div className="flex gap-10 w-100 max-w-full overflow-x-auto">
            {subapps
              ?.filter((app: any) => app.isInstalled)
              .sort(
                (app1: any, app2: any) =>
                  app1.orderForTopMenu - app2.orderForTopMenu,
              )
              .reverse()
              .map(({code, name}: any, i: any) => {
                const page =
                  SUBAPP_PAGE[code as keyof typeof SUBAPP_PAGE] || '';
                return (
                  <Fragment key={code}>
                    {i !== 0 && (
                      <Separator
                        className="bg-ink-200 w-px shrink-0 h-auto"
                        orientation="vertical"
                      />
                    )}
                    <Link href={`${workspaceURI}/${code}${page}`}>
                      <div className="font-medium text-ink-700 hover:text-royal transition-colors">
                        {i18n.t(name)}
                      </div>
                    </Link>
                  </Fragment>
                );
              })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
