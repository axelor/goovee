'use client';

import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {MdApps} from 'react-icons/md';
import {useSession} from 'next-auth/react';
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
import {SUBAPP_PAGE} from '@/constants';
import {useWorkspace} from './workspace-context';

export function Sidebar({
  subapps,
  workspaces,
}: {
  subapps: any;
  workspaces?: any;
}) {
  const {data: session} = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const {workspaceURI, workspaceURL} = useWorkspace();

  const user = session?.user;

  const router = useRouter();

  const toggle = () => setCollapsed(c => !c);

  const redirect = (value: any) => {
    router.push(value);
  };

  if (!user) {
    return null;
  }

  return (
    <div
      className={cn(
        'hidden lg:block sticky left-0 top-0 h-full min-h-screen transition-all bg-secondary text-secondary-foreground w-60 py-3 px-6 shrink-0 z-10',
        {'w-14 py-3 px-4': collapsed},
      )}>
      <div className="flex items-center gap-4 mb-10">
        <MdApps
          className="h-6 w-6 cursor-pointer shrink-0"
          role="button"
          onClick={toggle}
        />
        {Boolean(workspaces?.length) && !collapsed && (
          <Select defaultValue={workspaceURL} onValueChange={redirect}>
            <SelectTrigger className="grow max-w-100 overflow-hidden p-0 border-0 bg-none! h-[auto]">
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
        )}
      </div>
      <div className="flex flex-col gap-6">
        <TooltipProvider>
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
                <Link
                  key={code}
                  href={`${workspaceURI}/${code}${page}`}
                  className="no-underline">
                  <div className="flex gap-4 items-center" key={code}>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span>
                          <Icon
                            name={icon || 'app'}
                            className="h-6 w-6"
                            style={{color}}
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        align="center"
                        className="bg-success-light"
                        hidden={!collapsed}>
                        <p>{name}</p>
                        <TooltipArrow className="fill-success-light" />
                      </TooltipContent>
                    </Tooltip>

                    <p
                      className={`${
                        collapsed ? 'hidden' : 'block'
                      } whitespace-nowrap overflow-hidden duration-500`}>
                      {name}
                    </p>
                  </div>
                </Link>
              );
            })}
        </TooltipProvider>
      </div>
    </div>
  );
}

export default Sidebar;
