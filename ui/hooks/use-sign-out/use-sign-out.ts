'use client';

import {useCallback} from 'react';
import {authClient} from '@/lib/auth-client';
import {usePushNotifications} from '@/pwa/push-context';

/* NOTE: Use this hook instead of calling authClient.signOut() directly.
 * It ensures the push notification subscription is revoked before signing out,
 * so the user stops receiving push notifications after logout.
 */
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
