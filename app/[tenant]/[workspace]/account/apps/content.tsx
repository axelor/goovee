'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_PAGE} from '@/constants';
import {Icon} from '@/ui/components';
import {Link} from '@/ui/components/link';

export default function Content({subapps}: {subapps: any}) {
  const {workspaceURI} = useWorkspace();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className="group no-underline">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 bg-white transition-all hover:border-ink-200 hover:shadow-md hover:-translate-y-0.5">
                <div
                  className="w-11 h-11 shrink-0 rounded-[10px] flex items-center justify-center"
                  style={{backgroundColor: color}}>
                  {icon ? (
                    <Icon
                      name={icon}
                      className="size-6"
                      style={{color, filter: 'brightness(0.4)'}}
                    />
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-ink-900 mb-0">
                  {i18n.t(name)}
                </p>
              </div>
            </Link>
          );
        })}
    </div>
  );
}
