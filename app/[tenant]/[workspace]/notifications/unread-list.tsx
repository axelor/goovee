'use client';

import {usePushNotifications} from '@/pwa/push-context';
import {i18n} from '@/locale';
import {Button, Badge} from '@/ui/components';
import Link from 'next/link';
import {formatRelativeTime} from '@/locale/formatters';

export function UnreadNotificationsList() {
  const {unreadNotifications, markAsRead, markAllAsRead} =
    usePushNotifications();

  if (unreadNotifications.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {i18n.t('No unread notifications.')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {i18n.t('Unread Notifications')}
        </h3>
        <Button
          variant="outline-success"
          size="sm"
          onClick={() => markAllAsRead()}>
          {i18n.t('Mark all as read')}
        </Button>
      </div>
      <div className="divide-y border rounded-md">
        {unreadNotifications.map(notification => (
          <div
            key={notification.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{notification.title}</p>
                {notification.typeSelect && (
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 h-4">
                    {notification.typeSelect}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {notification.body}
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                {formatRelativeTime(notification.createdOn!)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {notification.url && (
                <Button
                  asChild
                  variant="outline-success"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}>
                  <Link href={notification.url}>{i18n.t('View')}</Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-success"
                onClick={() => markAsRead(notification.id)}>
                {i18n.t('Mark as read')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
