'use client';

import {i18n} from '@/locale';
import {Button} from '@/ui/components';
import {useToast} from '@/ui/hooks/use-toast';
import {useRouter} from 'next/navigation';
import {useTransition} from 'react';
import {requestPublisherAccess} from '../../../../actions';

export function RequestAccessButton({
  workspaceURL,
  label,
}: {
  workspaceURL: string;
  label: string;
}) {
  const router = useRouter();
  const {toast} = useToast();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await requestPublisherAccess({workspaceURL});
      if (result.error) {
        toast({
          title: i18n.t('Error'),
          description: result.message,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: i18n.t('Request submitted'),
        description: i18n.t(
          'Your publisher access request is now pending review.',
        ),
        variant: 'success',
      });
      router.refresh();
    });
  };

  return (
    <Button
      size="lg"
      className="rounded-full"
      onClick={handleClick}
      disabled={isPending}>
      {isPending ? i18n.t('Please wait...') : label}
    </Button>
  );
}
