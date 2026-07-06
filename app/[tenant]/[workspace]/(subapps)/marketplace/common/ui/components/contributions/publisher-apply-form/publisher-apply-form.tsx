'use client';

import {i18n} from '@/locale';
import {Button} from '@/ui/components';
import {Label} from '@/ui/components/label';
import {Textarea} from '@/ui/components/textarea';
import {useToast} from '@/ui/hooks/use-toast';
import {useRouter} from 'next/navigation';
import {useState, useTransition} from 'react';
import {requestPublisherAccess} from '../../../../actions';

export function PublisherApplyForm({
  workspaceURL,
  contributionsHref,
}: {
  workspaceURL: string;
  contributionsHref: string;
}) {
  const router = useRouter();
  const {toast} = useToast();
  const [publishingPlan, setPublishingPlan] = useState('');
  const [isPending, startTransition] = useTransition();

  const trimmed = publishingPlan.trim();

  const handleSubmit = () => {
    if (!trimmed) return;
    startTransition(async () => {
      const result = await requestPublisherAccess({
        workspaceURL,
        publishingPlan: trimmed,
      });
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
      router.push(contributionsHref);
    });
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="publishingPlan">
          {i18n.t('What are you planning to publish?')}
        </Label>
        <Textarea
          id="publishingPlan"
          value={publishingPlan}
          onChange={event => setPublishingPlan(event.target.value)}
          rows={5}
          maxLength={2000}
          placeholder={i18n.t(
            'Describe the apps or plugins you plan to publish.',
          )}
        />
      </div>
      <Button onClick={handleSubmit} disabled={isPending || !trimmed}>
        {isPending ? i18n.t('Please wait...') : i18n.t('Submit application')}
      </Button>
    </div>
  );
}
