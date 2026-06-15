'use client';
import React from 'react';

// ---- CORE IMPORTS ---- //
import {Separator} from '@/ui/components/separator';
import {RESPONSIVE_SIZES, SUBAPP_CODES} from '@/constants';
import {User} from '@/types';
import {i18n} from '@/locale';
import {useResponsive} from '@/ui/hooks';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {EVENTS_NAVBAR_LINKS} from '@/subapps/events/common/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

type nav_link = {
  id: number;
  title: string;
  redirectTo: string;
  validate: boolean;
};

export const EventNavbar = ({user}: {user?: User}) => {
  const {workspaceURI} = useWorkspace();
  const res = useResponsive();
  const small = RESPONSIVE_SIZES.some(x => res[x]);
  const filteredLinks: nav_link[] = EVENTS_NAVBAR_LINKS.filter(
    link => !(link.validate && !user?.email),
  );

  return (
    <div>
      {!small && (
        <div className="py-4 px-6 bg-white ">
          <div className="h-8 flex gap-10 overflow-x-auto items-center justify-end">
            {filteredLinks.map((item: nav_link, i: number) => (
              <React.Fragment key={item.id}>
                <Link
                  href={`${workspaceURI}/${SUBAPP_CODES.events}${item.redirectTo}`}>
                  <div className="font-medium text-base cursor-pointer">
                    {i18n.t(item.title)}
                  </div>
                </Link>
                {i !== filteredLinks.length - 1 && (
                  <Separator
                    className="bg-black w-[2px]"
                    orientation="vertical"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
