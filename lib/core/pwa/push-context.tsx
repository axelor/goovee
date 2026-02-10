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
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {NotificationDTO} from './types';
import {authClient} from '@/lib/auth-client';

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

export function PushProvider({children}: {children: React.ReactNode}) {
  const env = useEnvironment();
  const {data: session} = authClient.useSession();
  const user = session?.user;

  const {workspaceID, tenant} = useWorkspace();

  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [unreadNotifications, setUnreadNotifications] = useState<
    NotificationDTO[]
  >([]);
  const [isSupported, setIsSupported] = useState(false);
  const hasSynced = React.useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!tenant || !user) return;
    try {
      const url = new URL(
        `/api/tenant/${tenant}/push/notifications`,
        window.location.origin,
      );
      if (workspaceID) {
        url.searchParams.append('workspaceID', workspaceID.toString());
      }
      const response = await fetch(url.toString());
      if (response.ok) {
        const data: NotificationDTO[] = await response.json();
        setUnreadNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  }, [tenant, workspaceID, user]);

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
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    [tenant],
  );

  const markAllAsRead = useCallback(async () => {
    if (!tenant || !workspaceID) return;
    try {
      const response = await fetch(
        `/api/tenant/${tenant}/push/notifications/read/workspace/${workspaceID}`,
        {method: 'POST'},
      );
      if (response.ok) {
        setUnreadNotifications([]);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [tenant, workspaceID]);

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

  const updateState = useCallback(async () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();

      // AUTO-HEAL: If permission is granted but subscription is missing, create it
      if (currentPermission === 'granted' && !sub && tenant) {
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

      // AUTO-SYNC: If we have a sub and haven't synced yet this session, ping the server
      if (sub && currentPermission === 'granted' && !hasSynced.current) {
        syncSubscription(sub);
        hasSynced.current = true;
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
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      setSubscription(null);

      try {
        await fetch(`/api/tenant/${tenant}/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({endpoint}),
        });
      } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
      }
    }
  }, [subscription, tenant]);

  useEffect(() => {
    updateState();

    // Listen for permission changes if supported
    if ('permissions' in navigator) {
      navigator.permissions
        .query({name: 'notifications'})
        .then(permissionStatus => {
          permissionStatus.onchange = () => {
            updateState();
          };
        })
        .catch(err =>
          console.warn('Permissions API not supported for notifications', err),
        );
    }

    // Also update on window focus to ensure we have the latest state
    window.addEventListener('focus', updateState);

    // Listen for messages from the Service Worker (e.g. to refresh count when push arrives)
    const channel = new BroadcastChannel('push-notifications');
    channel.onmessage = event => {
      if (event.data?.type === 'REFRESH_NOTIFICATIONS') {
        fetchNotifications();
      }
    };

    return () => {
      window.removeEventListener('focus', updateState);
      channel.close();
    };
  }, [updateState, fetchNotifications]);

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
      refresh: updateState,
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
      updateState,
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
