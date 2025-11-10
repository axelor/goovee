'use client';

import React from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';

// ---- CORE IMPORTS ---- //
import {Separator} from '@/ui/components/separator';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Skeleton} from '@/ui/components';

export const NavMenu = ({items}: {items: any}) => {
  const {data: session} = useSession();
  const {workspaceURI} = useWorkspace();

  const filteredItems = session
    ? items
    : items.filter((item: any) => item.id === 1);

  return (
    <div className="bg-white flex items-center justify-center gap-5 px-6 py-4">
      {filteredItems.map((item: any, index: number) => (
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
