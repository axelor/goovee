'use client';

import {useCallback} from 'react';
import {authClient} from '@/lib/auth-client';
import {usePushNotifications} from '@/pwa/push-context';

export function useSignOut() {
  const {unsubscribe} = usePushNotifications();

  return useCallback(
    async (...args: Parameters<typeof authClient.signOut>) => {
      try {
        await unsubscribe();
      } catch (error) {
        console.error('Failed to unsubscribe on logout:', error);
      }
      await authClient.signOut(...args);
    },
    [unsubscribe],
  );
}
