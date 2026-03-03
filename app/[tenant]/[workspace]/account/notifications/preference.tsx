'use client';

import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {PortalApp} from '@/types';
import {Separator} from '@/ui/components/separator';
import {useWorkspace} from '../../workspace-context';
import {Checkbox} from '@/ui/components/checkbox';
import {useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {updatePreference} from './action';

export function Preference({
  preference,
  title,
  code,
  hideSubscription,
}: {
  preference: any;
  title: string;
  code: PortalApp['code'];
  hideSubscription?: boolean;
}) {
  const {tenant, workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();
  const router = useRouter();

  const changePreference =
    (root?: boolean) => async (activateNotification: any, record?: any) => {
      const result: any = await updatePreference({
        workspaceURL,
        workspaceURI,
        tenant,
        code,
        data: {
          ...(root
            ? {
                activateNotification,
              }
            : {
                activateNotification: true,
                record: {
                  id: record?.id,
                  activateNotification,
                },
              }),
        },
      });

      if ('success' in result) {
        router.refresh();
      } else {
        toast({
          title: result.message,
          variant: 'destructive',
        });
      }
    };

  if (!preference) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-center gap-2 p-1">
        <h5 className="font-medium">{title}</h5>
        <Checkbox
          defaultChecked={preference.activateNotification}
          name="activateNotification"
          onCheckedChange={changePreference(true)}
          variant="success"
        />
      </div>
      {!hideSubscription && preference?.activateNotification && (
        <div className="space-y-2">
          {preference?.subscriptions?.map((subscription: any, i: number) => (
            <div
              className="grid grid-cols-2 items-center gap-2 p-1"
              key={subscription?.id}>
              <p className="text-sm">{subscription?.name}</p>
              <Checkbox
                defaultChecked={subscription.activateNotification}
                name="activateNotification"
                onCheckedChange={e =>
                  changePreference(false)(e, {id: subscription.id})
                }
                variant="success"
              />
            </div>
          ))}
        </div>
      )}
      <Separator />
    </div>
  );
}
