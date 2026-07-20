'use client';

import {i18n} from '@/locale';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/alert-dialog';
import {Button} from '@/ui/components/button';
import {useToast} from '@/ui/hooks';
import {Flag} from 'lucide-react';
import {useState, useTransition} from 'react';
import {reportReview} from '../../../../actions';
import {REPORT_REASONS, type ReportReason} from '../../../../constants/review';

type ReportReviewButtonProps = {
  reviewId: string;
  workspaceURL: string;
};

export function ReportReviewButton({
  reviewId,
  workspaceURL,
}: ReportReviewButtonProps) {
  const {toast} = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!reason) return;
    startTransition(async () => {
      const result = await reportReview({
        reviewId,
        workspaceURL,
        reasonSelect: reason,
      });
      if (!result.success) {
        toast({variant: 'destructive', title: result.message});
        return;
      }
      toast({variant: 'success', title: i18n.t('Review reported')});
      setReason(null);
      setOpen(false);
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={pending}
        aria-label={i18n.t('Report review')}>
        <Flag className="h-4 w-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{i18n.t('Report this review')}</AlertDialogTitle>
            <AlertDialogDescription>
              {i18n.t('Why are you reporting this review?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            {REPORT_REASONS.map(value => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="report-reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  disabled={pending}
                />
                {i18n.tattr(value)}
              </label>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <Button onClick={submit} disabled={pending || !reason}>
              {i18n.t('Report')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
