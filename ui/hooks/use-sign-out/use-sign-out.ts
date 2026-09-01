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
      /* Returned rather than swallowed: a sign-out the server refuses arrives as
       * an `error` in here instead of throwing, and a caller that leaves the
       * visitor on a screen of their own has to know it did not happen. */
      return authClient.signOut(...args);
    },
    [unsubscribe],
  );
}
