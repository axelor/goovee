'use client';
import {usePushNotifications} from '@/pwa/push-context';
import {useWorkspace} from './workspace-context';

import Link from 'next/link';
import {MdNotificationsNone} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Badge} from '@/ui/components';
export function Notification() {
  const {unreadNotifications} = usePushNotifications();
  const {workspaceURI} = useWorkspace();

  const count = unreadNotifications.length;

  return (
    <Link
      href={`${workspaceURI}/notifications`}
      className="inline-flex relative">
      <MdNotificationsNone className="cursor-pointer text-foreground text-2xl" />
      {count > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-[10px] border-2 border-background">
          {count > 9 ? '9+' : count}
        </Badge>
      )}
    </Link>
  );
}
