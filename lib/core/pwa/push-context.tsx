'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {useEnvironment} from '@/lib/core/environment';
import {NotificationDTO} from './types';
import {authClient} from '@/lib/auth-client';
import {PUSH_CHANNEL, MSG_TYPE} from './sw-constants';

interface PushContextType {
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  unreadNotifications: NotificationDTO[];
  isSupported: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  syncSubscription: (sub: PushSubscription) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PushContext = createContext<PushContextType | undefined>(undefined);

export function PushProvider({
  children,
  tenant,
}: {
  children: React.ReactNode;
  tenant: string;
}) {
  const env = useEnvironment();
  const {data: session, isPending} = authClient.useSession();
  const user = session?.user;

  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [unreadNotifications, setUnreadNotifications] = useState<
    NotificationDTO[]
  >([]);
  const [isSupported, setIsSupported] = useState(false);
  const lastSyncedUserId = React.useRef<string | number | null>(null);
  const broadcastChannel = React.useRef<BroadcastChannel | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!tenant || !user) return;
    try {
      const response = await fetch(`/api/tenant/${tenant}/push/notifications`);
      if (response.ok) {
        const data: NotificationDTO[] = await response.json();
        setUnreadNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  }, [tenant, user]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!tenant) return;
      try {
        const response = await fetch(
          `/api/tenant/${tenant}/push/notifications/read/${id}`,
          {method: 'POST'},
        );
        if (response.ok) {
          setUnreadNotifications(prev => prev.filter(n => n.id !== id));
          broadcastChannel.current?.postMessage({
            type: MSG_TYPE.CLOSE,
            notificationId: id,
          });
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    [tenant],
  );

  const markAllAsRead = useCallback(async () => {
    if (!tenant) return;
    try {
      const response = await fetch(
        `/api/tenant/${tenant}/push/notifications/read/all`,
        {method: 'POST'},
      );
      if (response.ok) {
        setUnreadNotifications([]);
        broadcastChannel.current?.postMessage({
          type: MSG_TYPE.CLOSE_ALL,
        });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [tenant]);

  const syncSubscription = useCallback(
    async (sub: PushSubscription) => {
      if (!tenant) return;
      try {
        await fetch(`/api/tenant/${tenant}/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sub),
        });
      } catch (error) {
        console.error('Failed to sync push subscription:', error);
      }
    },
    [tenant],
  );

  const refreshPushNotifications = useCallback(async () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();

      // AUTO-HEAL: If permission is granted but subscription is missing, create it
      if (currentPermission === 'granted' && !sub && tenant && user) {
        try {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: env.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY,
          });
        } catch (err) {
          console.error('Failed to auto-subscribe:', err);
        }
      }

      setSubscription(sub);

      // AUTO-SYNC: If we have a sub and haven't synced for this user yet, ping the server
      if (
        sub &&
        currentPermission === 'granted' &&
        user &&
        lastSyncedUserId.current !== user.id
      ) {
        syncSubscription(sub);
        lastSyncedUserId.current = user.id;
      }
    }

    // Fetch unread notifications
    if (tenant && user) {
      fetchNotifications();
    }
  }, [
    env.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY,
    syncSubscription,
    tenant,
    fetchNotifications,
    user,
  ]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !tenant) return;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: env.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(sub);
      await syncSubscription(sub);
    }
  }, [
    env.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY,
    isSupported,
    syncSubscription,
    tenant,
  ]);

  const unsubscribe = useCallback(async () => {
    if (subscription && tenant) {
      try {
        await subscription.unsubscribe();
        await fetch(`/api/tenant/${tenant}/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });
        setSubscription(null);
      } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
      }
    }
  }, [subscription, tenant]);

  useEffect(() => {
    refreshPushNotifications();

    // Listen for permission changes if supported
    if ('permissions' in navigator) {
      navigator.permissions
        .query({name: 'notifications'})
        .then(permissionStatus => {
          permissionStatus.onchange = () => {
            refreshPushNotifications();
          };
        })
        .catch(err =>
          console.warn('Permissions API not supported for notifications', err),
        );
    }

    // Listen for messages from the Service Worker (e.g. to refresh count when push arrives)
    broadcastChannel.current = new BroadcastChannel(PUSH_CHANNEL);
    broadcastChannel.current.onmessage = event => {
      if (event.data?.type === MSG_TYPE.NEW && event.data.notification) {
        setUnreadNotifications(prev =>
          prev.some(n => n.id === event.data.notification.id)
            ? prev
            : [event.data.notification, ...prev],
        );
      } else if (event.data?.type === MSG_TYPE.READ) {
        const {notification, tag} = event.data;
        setUnreadNotifications(prev =>
          tag
            ? prev.filter(n => n.tag !== tag)
            : prev.filter(n => n.id !== notification?.id),
        );
      }
    };

    return () => {
      broadcastChannel.current?.close();
      broadcastChannel.current = null;
    };
  }, [refreshPushNotifications]);

  // Safety cleanup: If we have a subscription but no user, unsubscribe
  useEffect(() => {
    if (!user && subscription && !isPending) {
      unsubscribe();
    }
  }, [user, subscription, unsubscribe, isPending]);

  const value = useMemo(
    () => ({
      permission,
      subscription,
      unreadNotifications,
      isSupported,
      subscribe,
      unsubscribe,
      syncSubscription,
      markAsRead,
      markAllAsRead,
      refresh: refreshPushNotifications,
    }),
    [
      permission,
      subscription,
      unreadNotifications,
      isSupported,
      subscribe,
      unsubscribe,
      syncSubscription,
      markAsRead,
      markAllAsRead,
      refreshPushNotifications,
    ],
  );

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePushNotifications() {
  const context = useContext(PushContext);
  if (context === undefined) {
    throw new Error('usePushNotifications must be used within a PushProvider');
  }
  return context;
}
