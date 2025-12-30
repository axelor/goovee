'use client';

import {useRouter, useSearchParams} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/ui/components/dialog';
import {Button} from '@/ui/components/button';
import {useToast} from '@/ui/hooks';
import {SEARCH_PARAMS} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {subscribe} from './action';

export default function Subscribe({
  workspaceURL,
  inviteId,
}: {
  workspaceURL: string;
  inviteId: string;
  updateSession?: boolean;
}) {
  const router = useRouter();
  const {toast} = useToast();

  const searchParams = useSearchParams();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);

  const handleCancel = () => {
    router.replace('/');
  };

  const handleSubscription = async () => {
    if (!workspaceURL) return;

    try {
      const res: any = await subscribe({
        workspaceURL,
        inviteId,
        tenantId,
      });

      if (res.error) {
        toast({
          variant: 'destructive',
          title: res.message,
        });
      } else if (res.success) {
        toast({
          variant: 'success',
          title: res.message,
        });
        router.replace(workspaceURL);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error subscribing, try again'),
      });
    }
  };

  return (
    <Dialog open onOpenChange={handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{i18n.t('Already an user')}</DialogTitle>
          <DialogDescription>
            {i18n.t(
              `You are already a user, do you want to subscribe to ${workspaceURL} ?`,
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            {i18n.t('Cancel')}
          </Button>
          <Button type="button" onClick={handleSubscription}>
            {i18n.t('Subscribe')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
