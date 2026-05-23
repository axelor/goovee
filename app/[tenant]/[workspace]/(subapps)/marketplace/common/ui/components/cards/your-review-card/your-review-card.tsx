'use client';

import {i18n} from '@/locale';
import type {User} from '@/types';
import type {Cloned} from '@/types/util';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/alert-dialog';
import {Button} from '@/ui/components/button';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {Pencil, Trash2} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useOptimistic, useState, useTransition} from 'react';
import {deleteReview, saveReview} from '../../../../actions';
import type {MyReview} from '../../../../orm';
import {Rating} from '../../primitives/rating';
import {ReviewerAvatar} from '../../primitives/reviewer-avatar';
import {TooltipDate} from '../../primitives/tooltip-date';
import {PromptCard} from './prompt-card';
import {ReviewEditForm, type ReviewFormValues} from './review-edit-form';
import {
  REVIEW_CARD_SHELL,
  deriveDisplayReview,
  type OptimisticAction,
} from './shared';

type VersionOption = {id: string; versionNumber: string};

type YourReviewCardProps = {
  productId: string;
  workspaceURL: string;
  loginHref: string;
  tenantId: string;
  user?: User;
  initial: Cloned<MyReview> | null;
  versions: VersionOption[];
  defaultVersionId?: string;
};

export function YourReviewCard({
  productId,
  workspaceURL,
  loginHref,
  tenantId,
  user,
  initial,
  versions,
  defaultVersionId,
}: YourReviewCardProps) {
  const {toast} = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [optimistic, addOptimistic] = useOptimistic<
    OptimisticAction,
    OptimisticAction
  >(null, (_, next) => next);

  // ---- Guest ----
  if (!user) {
    return (
      <PromptCard
        title={i18n.t('Share your experience')}
        description={i18n.t('Sign in to leave a review.')}
        action={
          <Button asChild>
            <Link href={loginHref}>{i18n.t('Sign in')}</Link>
          </Button>
        }
      />
    );
  }

  // ---- Editing ----
  if (editing) {
    const handleSubmit = (values: ReviewFormValues) => {
      const trimmedComment = values.reviewComment.trim() || undefined;
      const selectedVersion = versions.find(v => v.id === values.versionId);
      const optimisticData: OptimisticAction = {
        kind: 'save',
        rating: values.rating,
        reviewComment: trimmedComment,
        reviewedVersionId: selectedVersion?.id,
        reviewedVersionNumber: selectedVersion?.versionNumber,
      };
      // Urgent: form unmounts immediately. (Inside startTransition this would
      // become a low-priority update and the form would linger.)
      setEditing(false);
      startTransition(async () => {
        addOptimistic(optimisticData);
        const result = await saveReview({
          productId,
          workspaceURL,
          rating: values.rating,
          reviewComment: trimmedComment,
          reviewedVersionId: values.versionId,
        });
        if (!result.success) {
          toast({variant: 'destructive', title: result.message});
          setEditing(true); // transition ends → optimistic auto-reverts
          return;
        }
        toast({variant: 'success', title: i18n.t('Review saved')});
        router.refresh();
      });
    };

    return (
      <ReviewEditForm
        initial={initial}
        versions={versions}
        defaultVersionId={defaultVersionId}
        pending={pending}
        onCancel={() => setEditing(false)}
        onSubmit={handleSubmit}
      />
    );
  }

  // ---- Display: optimistic action wins, else server state ----
  const displayReview = deriveDisplayReview(optimistic, initial, user);

  if (!displayReview) {
    return (
      <PromptCard
        title={i18n.t('Leave a review')}
        description={i18n.t(
          'Help others by sharing your experience with this product.',
        )}
        action={
          <Button onClick={() => setEditing(true)}>
            {i18n.t('Write a review')}
          </Button>
        }
      />
    );
  }

  const runDelete = () => {
    setConfirmDelete(false);
    startTransition(async () => {
      addOptimistic({kind: 'delete'});
      const result = await deleteReview({productId, workspaceURL});
      if (!result.success) {
        toast({variant: 'destructive', title: result.message});
        return;
      }
      toast({variant: 'success', title: i18n.t('Review deleted')});
      router.refresh();
    });
  };

  return (
    <>
      <div className={cn(REVIEW_CARD_SHELL, 'space-y-3')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <ReviewerAvatar
              partner={displayReview.author}
              tenantId={tenantId}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-foreground text-sm">
                  {displayReview.author.simpleFullName}
                </p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {i18n.t('Your review')}
                </span>
                {displayReview.updatedOn && (
                  <TooltipDate
                    date={displayReview.updatedOn}
                    displayType="relative"
                    showTooltip
                    prefix="•"
                    className="text-xs text-muted-foreground"
                  />
                )}
              </div>
              <Rating
                value={displayReview.rating}
                showValue={false}
                size={12}
                className="mt-1"
              />
              {displayReview.reviewedVersion?.versionNumber && (
                <p className="text-xs text-muted-foreground mt-1">
                  {i18n.t('Reviewed')} v
                  {displayReview.reviewedVersion.versionNumber}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              disabled={pending}
              aria-label={i18n.t('Edit review')}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
              className="text-destructive hover:text-destructive"
              aria-label={i18n.t('Delete review')}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {displayReview.reviewComment && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {displayReview.reviewComment}
          </p>
        )}
      </div>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{i18n.t('Delete your review?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {i18n.t(
                'This will remove your rating and comment. You can post a new review later.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={runDelete} disabled={pending}>
              {i18n.t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
