'use client';

// ---- CORE IMPORTS ---- //
import {Separator} from '@/ui/components/separator';
import {useWorkspace} from '../../workspace-context';
import {useToast} from '@/ui/hooks';
import type {NotificationAppCode} from '@/utils/validators';

// ---- LOCAL IMPORTS ---- //
import {AccountToggle} from '../common/ui/components';

// ---- LOCAL IMPORTS ---- //
import {updatePreference} from './action';
import type {PreferenceResponse} from '@/orm/notification';
import {CheckedState} from '@radix-ui/react-checkbox';
import type {UpdateNotificationPreference} from '../common/utils/validators';
import {i18n} from '@/lib/core/locale';
import {useState} from 'react';

export function Preference({
  preference,
  title,
  code,
  hideSubscription,
}: {
  preference: PreferenceResponse | null;
  title: string;
  code: NotificationAppCode;
  hideSubscription?: boolean;
}) {
  const {tenant, workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();

  const changePreference =
    (root?: boolean) =>
    async (activateNotification: CheckedState, subscriptionId?: string) => {
      if (activateNotification === 'indeterminate') return;
      const data: UpdateNotificationPreference['data'] | undefined = root
        ? {activateNotification}
        : subscriptionId
          ? {
              activateNotification,
              record: {
                id: subscriptionId,
                activateNotification,
              },
            }
          : undefined;

      if (!data) return;

      try {
        const result = await updatePreference({
          workspaceURL,
          workspaceURI,
          tenant,
          code,
          data,
        });
        if ('error' in result) {
          toast({
            title: result.message,
            variant: 'destructive',
          });
        }
      } catch (err) {
        toast({
          title:
            err instanceof Error ? err.message : i18n.t('Something went wrong'),
          variant: 'destructive',
        });
      }
    };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 py-1">
        <h5 className="text-sm font-semibold text-ink-900 mb-0">{title}</h5>
        <AccountToggle
          aria-label={title}
          checked={preference?.activateNotification || false}
          onCheckedChange={changePreference(true)}
        />
      </div>
      {!hideSubscription && preference?.activateNotification && (
        <div className="space-y-1 border-l-2 border-royal-border pl-4 ml-1">
          {preference?.subscriptions?.map((subscription: any, i: number) => (
            <div
              className="flex items-center justify-between gap-4 py-1"
              key={subscription?.id}>
              <p className="text-sm text-ink-700 mb-0">{subscription?.name}</p>
              <AccountToggle
                aria-label={subscription?.name}
                checked={subscription.activateNotification}
                onCheckedChange={e =>
                  changePreference(false)(e, subscription.id)
                }
              />
            </div>
          ))}
        </div>
      )}
      <Separator />
    </div>
  );
}
