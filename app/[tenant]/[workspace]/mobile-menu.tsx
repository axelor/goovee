'use client';

import {useCallback, useEffect, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
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
import {SUBAPP_PAGE} from '@/constants';
import {Account} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {useNavigationVisibility} from '@/ui/hooks';
import Cart from '@/app/[tenant]/[workspace]/cart';

function MobileSidebar({subapps, workspaces, workspace}: any) {
  const pathname = usePathname();
  const {data: session} = useSession();
  const [open, setOpen] = useState(false);

  const user = session?.user;

  const {workspaceURI, workspaceURL} = useWorkspace();
  const router = useRouter();

  const redirect = (value: any) => {
    router.push(value);
  };

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  const displayContact = workspace?.config?.isDisplayContact;
  const contactEmail = workspace?.config?.contactEmailAddress?.address;
  const showHome = workspace?.config?.isHomepageDisplay;

  return (
    <>
      <MdApps onClick={openSidebar} className="cursor-pointer h-6 w-6" />
      <Sheet open={open} onOpenChange={closeSidebar}>
        <SheetContent
          side="left"
          className="bg-white overflow-auto flex flex-col">
          {user && Boolean(workspaces?.length) ? (
            workspaces.length === 1 ? (
              <Link href={workspaceURL}>
                <p className="px-6 py-2">
                  {workspaces[0]?.name || workspaces[0]?.url}
                </p>
              </Link>
            ) : (
              <Select defaultValue={workspaceURL} onValueChange={redirect}>
                <SelectTrigger className="grow max-w-100 overflow-hidden px-6 py-2 mt-4 bg-none! h-[auto]">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace: any) => (
                    <SelectItem key={workspace.url} value={workspace.url}>
                      {workspace.name || workspace.url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          ) : null}

          {showHome && <App href={workspaceURI} icon="home" name="app-home" />}
          {subapps
            ?.filter((app: any) => app.installed)
            .sort(
              (app1: any, app2: any) =>
                app1.orderForMySpaceMenu - app2.orderForMySpaceMenu,
            )
            .reverse()
            ?.map(({code, name, icon, color, background}: any) => {
              const page = SUBAPP_PAGE[code as keyof typeof SUBAPP_PAGE] || '';
              return (
                <App
                  key={code}
                  href={`${workspaceURI}/${code}${page}`}
                  icon={icon}
                  color={color}
                  name={name}
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
                <p className="font-medium">{workspace?.config?.contactName}</p>
                <p>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </p>
                <p>{workspace?.config?.contactPhone}</p>
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
}) {
  const {href, icon, color, name} = props;
  return (
    <Link href={href} className="no-underline">
      <div className="flex items-center pt-8 px-6 py-2 font-normal gap-x-4">
        <Icon name={icon || 'app'} className="h-6 w-6" style={{color}} />
        <p className="max-w-full whitespace-nowrap text-main-black">
          {i18n.t(name)}
        </p>
      </div>
    </Link>
  );
}

export function MobileMenu({subapps, workspaces, workspace, showCart}: any) {
  const router = useRouter();
  const redirect = () => router.push('/notifications');

  const {data: session} = useSession();
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
          workspace={workspace}
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
        <Account baseURL={workspaceURI} tenant={tenant} />
      </div>
    </nav>
  );
}

export default MobileMenu;
