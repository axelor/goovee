'use client';

import {usePushNotifications} from '@/pwa/push-context';
import {i18n} from '@/locale';
import {Button, Alert, AlertTitle, AlertDescription} from '@/ui/components';
import Link from 'next/link';
import {formatRelativeTime} from '@/locale/formatters';
import {Bell} from 'lucide-react';
import {useOptimistic, startTransition} from 'react';

export function UnreadNotificationsList() {
  const {
    unreadNotifications,
    markAsRead,
    markAllAsRead,
    isSupported,
    permission,
    subscribe,
  } = usePushNotifications();

  const [optimisticNotifications, addOptimisticNotification] = useOptimistic(
    unreadNotifications,
    (state, action: {type: 'markRead'; id: string} | {type: 'markAllRead'}) => {
      if (action.type === 'markRead') {
        return state.filter(n => n.id !== action.id);
      }
      if (action.type === 'markAllRead') {
        return [];
      }
      return state;
    },
  );

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      addOptimisticNotification({type: 'markRead', id});
      await markAsRead(id);
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      addOptimisticNotification({type: 'markAllRead'});
      await markAllAsRead();
    });
  };

  const handleEnable = async () => {
    await subscribe();
  };

  return (
    <div className="space-y-6">
      {isSupported && permission === 'default' && (
        <Alert variant="primary">
          <Bell className="h-4 w-4" />
          <AlertTitle>{i18n.t('Stay Updated!')}</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p>
              {i18n.t(
                'Enable push notifications to receive real-time updates even when you are not on the site.',
              )}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="success" onClick={handleEnable}>
                {i18n.t('Enable')}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {isSupported && permission === 'denied' && (
        <Alert variant="destructive">
          <Bell className="h-4 w-4" />
          <AlertTitle>{i18n.t('Notifications Blocked')}</AlertTitle>
          <AlertDescription>
            <p>
              {i18n.t(
                'You have blocked notifications for this site. To receive updates, please enable them in your browser settings.',
              )}
            </p>
          </AlertDescription>
        </Alert>
      )}
      {optimisticNotifications.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          {i18n.t('No unread notifications.')}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {i18n.t('Unread Notifications')}
            </h3>
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleMarkAllAsRead}>
              {i18n.t('Mark all as read')}
            </Button>
          </div>
          <div className="divide-y border rounded-md">
            {optimisticNotifications.map(notification => (
              <div
                key={notification.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{notification.title}</p>
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
                      onClick={() => handleMarkAsRead(notification.id)}>
                      <Link href={notification.url}>{i18n.t('View')}</Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-success"
                    onClick={() => handleMarkAsRead(notification.id)}>
                    {i18n.t('Mark as read')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
