'use client';

import {useCallback, useEffect, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {MdApps, MdNotificationsNone} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Sheet, SheetContent} from '@/ui/components/sheet/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {Icon} from '@/ui/components';
import {SUBAPP_PAGE, SUBAPP_CODES, CHAT_TYPE} from '@/constants';
import {Account} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {useNavigationVisibility} from '@/ui/hooks';
import Cart from '@/app/[tenant]/[workspace]/cart';
import {useEnvironment} from '@/lib/core/environment';
import {Notification} from './notification';
import {toWorkspaceURI} from '@/utils/workspace';
import {Link} from '@/ui/components/link';
import {authClient} from '@/lib/auth-client';
import type {Subapp, Workspace} from '@/orm/workspace';
import type {ShellConfig} from './orm/config';
import type {Cloned} from '@/types/util';

type WorkspaceListItem = {id: string; name: string | null; url: string | null};

function MobileSidebar({
  subapps,
  workspaces,
  config,
}: {
  subapps: Subapp[];
  workspaces?: WorkspaceListItem[];
  config: ShellConfig | Cloned<ShellConfig>;
}) {
  const pathname = usePathname();
  const {data: session} = authClient.useSession();
  const [open, setOpen] = useState(false);

  const user = session?.user;

  const {workspaceURI} = useWorkspace();
  const env = useEnvironment();
  const router = useRouter();

  const redirect = (value: string) => {
    router.push(value);
  };

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  const mattermostUrl = env?.GOOVEE_PUBLIC_MATTERMOST_HOST || '';
  const displayContact = config?.isDisplayContact;
  const contactEmail = config?.contactEmailAddress?.address;
  const showHome = config?.isHomepageDisplay;

  return (
    <>
      <MdApps onClick={openSidebar} className="cursor-pointer h-6 w-6" />
      <Sheet open={open} onOpenChange={closeSidebar}>
        <SheetContent
          side="left"
          className="bg-white overflow-auto flex flex-col">
          {user && Boolean(workspaces?.length) ? (
            workspaces?.length === 1 ? (
              <Link href={workspaceURI}>
                <p className="px-6 py-2">
                  {workspaces[0]?.name || workspaces[0]?.url}
                </p>
              </Link>
            ) : (
              <Select defaultValue={workspaceURI} onValueChange={redirect}>
                <SelectTrigger className="grow max-w-100 overflow-hidden px-6 py-2 mt-4 bg-none! h-[auto]">
                  <SelectValue placeholder="" />
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
            )
          ) : null}

          {showHome && <App href={workspaceURI} icon="home" name="app-home" />}
          {subapps
            ?.filter((app: Subapp) => app.isInstalled)
            .sort(
              (app1: Subapp, app2: Subapp) =>
                (app1.orderForMySpaceMenu ?? 0) -
                (app2.orderForMySpaceMenu ?? 0),
            )
            .reverse()
            ?.map((app: Subapp) => {
              const {code, name, icon, color} = app;
              const page = SUBAPP_PAGE[code as keyof typeof SUBAPP_PAGE] || '';
              const isExternalChat =
                code === SUBAPP_CODES.chat &&
                config?.chatDisplayTypeSelect === CHAT_TYPE.external;

              return (
                <App
                  key={code}
                  href={
                    isExternalChat
                      ? mattermostUrl
                      : `${workspaceURI}/${code}${page}`
                  }
                  icon={icon ?? ''}
                  color={color ?? undefined}
                  name={name ?? ''}
                  isExternal={isExternalChat}
                />
              );
            })}

          {Boolean(user) && (
            <App
              href={`${workspaceURI}/account`}
              icon="account"
              name="My Account"
            />
          )}
          <div className="flex flex-grow flex-col justify-end">
            {displayContact && (
              <div className="flex flex-col gap-1 mt-4 pt-8 px-6 py-2">
                <p className="font-medium">{config?.contactName}</p>
                <p>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </p>
                <p>{config?.contactPhone}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function App(props: {
  name: string;
  href: string;
  icon: string;
  color?: string;
  isExternal?: boolean;
}) {
  const {href, icon, color, name, isExternal} = props;
  return (
    <Link
      href={href}
      className="no-underline"
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}>
      <div className="flex items-center pt-8 px-6 py-2 font-normal gap-x-4">
        <Icon name={icon || 'app'} className="h-6 w-6" style={{color}} />
        <p className="max-w-full whitespace-nowrap text-main-black">
          {i18n.t(name)}
        </p>
      </div>
    </Link>
  );
}

export function MobileMenu({
  subapps,
  workspaces,
  showCart,
  config,
}: {
  subapps: Subapp[];
  workspaces?: WorkspaceListItem[];
  workspace?: Workspace | Cloned<Workspace>;
  showCart?: boolean | null;
  config: ShellConfig | Cloned<ShellConfig>;
}) {
  const router = useRouter();
  const redirect = () => router.push('/notifications');

  const {data: session} = authClient.useSession();
  const user = session?.user;

  const {loading, visible} = useNavigationVisibility();
  const {workspaceURI, tenant} = useWorkspace();

  const canDisplayContent = !loading && visible;

  if (!canDisplayContent && !user) {
    return;
  }

  return (
    <nav className="flex items-center w-screen fixed left-0 bottom-0 h-[72px] bg-white z-50 lg:hidden dark:bg-secondary px-8 pt-4 pb-6">
      <div className="flex items-center justify-between w-full">
        <MobileSidebar
          subapps={subapps}
          workspaces={workspaces}
          config={config}
        />
        {/** Render Subapp Menu using Portal */}
        <div id="subapp-menu" className="hidden" />
        {false && (
          <MdNotificationsNone
            className="cursor-pointer h-6 w-6"
            onClick={redirect}
          />
        )}
        {showCart && <Cart />}

        {user && <Notification />}
        <Account baseURL={workspaceURI} tenant={tenant} />
      </div>
    </nav>
  );
}

export default MobileMenu;
