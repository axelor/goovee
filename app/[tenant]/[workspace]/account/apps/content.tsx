'use client';

import Link from 'next/link';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_PAGE} from '@/constants';
import {Icon} from '@/ui/components';

export default function Content({subapps}: {subapps: any}) {
  const {workspaceURI} = useWorkspace();

  return (
    <>
      <div className="flex flex-col gap-10">
        {subapps
          .filter((app: any) => app.isInstalled && app.showInMySpace)
          .sort(
            (app1: any, app2: any) =>
              app1.orderForMySpaceMenu - app2.orderForMySpaceMenu,
          )
          .reverse()
          .map(({code, name, icon, color}: any) => {
            const page = SUBAPP_PAGE[code as keyof typeof SUBAPP_PAGE] || '';
            return (
              <Link
                key={code}
                href={`${workspaceURI}/${code}${page}`}
                className="no-underline">
                <div className="p-6 rounded-lg border bg-card text-card-foreground">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-[4.5rem] h-[4.5rem] p-4 rounded-lg flex items-center justify-center"
                      style={{backgroundColor: color}}>
                      {icon ? (
                        <Icon
                          name={icon}
                          className="size-10 font-extrabold"
                          style={{color, filter: 'brightness(0.4)'}}
                        />
                      ) : null}
                    </div>
                    <p className="text-lg font-semibold mb-0">{i18n.t(name)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </>
  );
}
