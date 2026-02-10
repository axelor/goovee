'use client';

import {usePushNotifications} from '@/pwa/push-context';
import {i18n} from '@/locale';
import {Checkbox} from '@/ui/components/checkbox';
import {Separator} from '@/ui/components/separator';

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
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-center gap-2 p-1">
        <div>
          <h5 className="font-medium">{i18n.t('Push Notifications')}</h5>
          <p className="text-xs text-muted-foreground">
            {isDenied
              ? i18n.t('Notifications are blocked by your browser.')
              : i18n.t('Receive notifications on this device.')}
          </p>
        </div>
        <div className="flex">
          <Checkbox
            checked={isEnabled}
            disabled={isDenied}
            onCheckedChange={handleChange}
            variant="success"
          />
        </div>
      </div>
      <Separator />
    </div>
  );
}
