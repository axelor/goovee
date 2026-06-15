'use client';

import React from 'react';
import {authClient} from '@/lib/auth-client';

// ---- CORE IMPORTS ---- //
import {Separator} from '@/ui/components/separator';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Skeleton} from '@/ui/components';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {MenuItem} from '@/subapps/forum/common/types/forum';

export const NavMenu = ({items}: {items: MenuItem[]}) => {
  const {data: session} = authClient.useSession();
  const {workspaceURI} = useWorkspace();

  const filteredItems = session ? items : items.filter(item => item.id === 1);

  return (
    <div className="bg-white flex items-center justify-center gap-5 px-6 py-4">
      {filteredItems.map((item, index: number) => (
        <React.Fragment key={item.id}>
          <Link
            href={`${workspaceURI}/${SUBAPP_CODES.forum}/${item.link}`}
            key={item.id}
            className="font-medium text-base cursor-pointer">
            {item.name}
          </Link>
          {index !== filteredItems.length - 1 && (
            <Separator
              className="bg-black w-0.5 h-[1.375rem]"
              orientation="vertical"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default NavMenu;

export function NavMenuSkeleton({count = 2}: {count?: number}) {
  return (
    <div className="bg-white flex items-center justify-center gap-5 px-6 py-4 ">
      {[...Array(count)].map((_, index) => (
        <Skeleton key={index} className="h-8 w-32" />
      ))}
    </div>
  );
}
