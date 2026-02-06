'use client';

import {useEnvironment} from '@/lib/core/environment';
import {useState, useEffect} from 'react';

export function usePushNotifications() {
  const env = useEnvironment();
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) return;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: env.GOOVEE_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(sub);

      // Send to backend
      await fetch('/api/pwa/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sub),
      });
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
      // In a real app, you would also notify the backend to remove the subscription
    }
  };

  return {
    permission,
    subscription,
    isSupported,
    subscribe,
    unsubscribe,
  };
}
