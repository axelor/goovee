'use client';

import {usePushNotifications} from '@/pwa/push-context';
import {i18n} from '@/locale';
import {Separator} from '@/ui/components/separator';

// ---- LOCAL IMPORTS ---- //
import {AccountToggle} from '../common/ui/components';

export function DevicePushPreference() {
  const {isSupported, permission, subscribe, unsubscribe} =
    usePushNotifications();

  if (!isSupported) return null;

  const isEnabled = permission === 'granted';
  const isDenied = permission === 'denied';

  const handleChange = (checked: boolean) => {
    if (checked) {
      subscribe();
    } else {
      unsubscribe();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 py-1">
        <div>
          <h5 className="text-sm font-semibold text-ink-900 mb-0">
            {i18n.t('Push Notifications')}
          </h5>
          <p className="text-xs text-ink-500 mt-0.5 mb-0">
            {isDenied
              ? i18n.t('Notifications are blocked by your browser.')
              : i18n.t('Receive notifications on this device.')}
          </p>
        </div>
        <AccountToggle
          aria-label={i18n.t('Push Notifications')}
          checked={isEnabled}
          disabled={isDenied}
          onCheckedChange={handleChange}
        />
      </div>
      <Separator />
    </div>
  );
}
