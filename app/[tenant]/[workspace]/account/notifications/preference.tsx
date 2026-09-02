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
import type {UpdateNotificationPreference} from '../common/utils/validators';
import {i18n} from '@/lib/core/locale';
import {startTransition, useOptimistic} from 'react';

type PreferenceUpdate =
  | {type: 'root'; activateNotification: boolean}
  | {type: 'subscription'; id: string; activateNotification: boolean};

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
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();

  /* The switches read from this rather than straight from the prop, so a click
   * moves them immediately and the next click sees the new position. The server
   * revalidates on success, which replaces the optimistic value; on failure
   * nothing revalidates and React restores the stored one. */
  const [shown, applyUpdate] = useOptimistic(
    preference,
    (state, update: PreferenceUpdate): PreferenceResponse | null => {
      if (update.type === 'root') {
        /* Until the first save there is no stored preference to spread, and
         * turning an app on is exactly when that happens — so stand one up
         * rather than ignore the click. */
        return state
          ? {...state, activateNotification: update.activateNotification}
          : {
              id: '',
              version: 0,
              activateNotification: update.activateNotification,
              code,
              subscriptions: [],
            };
      }

      if (!state) return state;

      return {
        ...state,
        subscriptions: state.subscriptions?.map(subscription =>
          subscription.id === update.id
            ? {
                ...subscription,
                activateNotification: update.activateNotification,
              }
            : subscription,
        ),
      };
    },
  );

  const changePreference =
    (root?: boolean) =>
    (activateNotification: boolean, subscriptionId?: string) => {
      /* Built together so the switch's new position and the value sent to the
       * server can never describe different things. */
      const change:
        | {data: UpdateNotificationPreference['data']; update: PreferenceUpdate}
        | undefined = root
        ? {
            data: {activateNotification},
            update: {type: 'root', activateNotification},
          }
        : subscriptionId
          ? {
              data: {
                activateNotification,
                record: {id: subscriptionId, activateNotification},
              },
              update: {
                type: 'subscription',
                id: subscriptionId,
                activateNotification,
              },
            }
          : undefined;

      if (!change) return;

      /* The optimistic move has to be dispatched inside the transition that
       * awaits the action, otherwise React discards it as soon as the click
       * handler returns. */
      startTransition(async () => {
        applyUpdate(change.update);

        try {
          const result = await updatePreference({
            workspaceURL,
            workspaceURI,
            code,
            data: change.data,
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
              err instanceof Error
                ? err.message
                : i18n.t('Something went wrong'),
            variant: 'destructive',
          });
        }
      });
    };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 py-1">
        <h5 className="text-sm font-semibold text-ink-900 mb-0">{title}</h5>
        <AccountToggle
          aria-label={title}
          checked={shown?.activateNotification || false}
          onCheckedChange={changePreference(true)}
        />
      </div>
      {!hideSubscription &&
        shown?.activateNotification &&
        shown.subscriptions?.length > 0 && (
          <div className="space-y-1 border-l-2 border-royal-border pl-4 ml-1">
            {shown?.subscriptions?.map(subscription => (
              <div
                className="flex items-center justify-between gap-4 py-1"
                key={subscription?.id}>
                <p className="text-sm text-ink-700 mb-0">
                  {subscription?.name}
                </p>
                <AccountToggle
                  aria-label={subscription?.name ?? undefined}
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
