'use client';

import {useState} from 'react';

import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Textarea} from '@/ui/components/textarea';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import type {Cloned} from '@/types/util';

import {RatingInput} from './rating-input';
import {VersionSelect} from './version-select';
import {REVIEW_CARD_SHELL} from './shared';
import {REVIEW_COMMENT_MAX_LENGTH} from '../../../constant/review';
import type {MyReview} from '../../../orm/orm';

export type ReviewFormValues = {
  rating: number;
  reviewComment: string;
  versionId?: string;
};

type VersionOption = {id: string; versionNumber: string};

type ReviewEditFormProps = {
  initial: Cloned<MyReview> | null;
  versions: VersionOption[];
  defaultVersionId?: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: ReviewFormValues) => void;
};

export function ReviewEditForm({
  initial,
  versions,
  defaultVersionId,
  pending,
  onCancel,
  onSubmit,
}: ReviewEditFormProps) {
  const {toast} = useToast();
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);
  const [comment, setComment] = useState<string>(initial?.reviewComment ?? '');
  const [versionId, setVersionId] = useState<string | undefined>(
    initial?.reviewedVersion?.id ?? defaultVersionId,
  );

  const handleSubmit = () => {
    if (rating < 1) {
      toast({
        variant: 'destructive',
        title: i18n.t('Pick at least one star'),
      });
      return;
    }
    onSubmit({rating, reviewComment: comment, versionId});
  };

  return (
    <div className={cn(REVIEW_CARD_SHELL, 'space-y-4')}>
      <h3 className="font-semibold text-foreground">
        {initial ? i18n.t('Edit your review') : i18n.t('Leave a review')}
      </h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          {i18n.t('Your rating')} *
        </label>
        <RatingInput value={rating} onChange={setRating} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          {i18n.t('Comment')}
        </label>
        <Textarea
          rows={4}
          value={comment}
          maxLength={REVIEW_COMMENT_MAX_LENGTH}
          onChange={e => setComment(e.target.value)}
          placeholder={i18n.t('Share what worked, what did not…')}
        />
        <p className="text-xs text-muted-foreground text-right">
          {comment.length} / {REVIEW_COMMENT_MAX_LENGTH}
        </p>
      </div>

      {versions.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            {i18n.t('Reviewing version')}
          </label>
          <VersionSelect
            options={versions}
            value={versionId}
            onChange={setVersionId}
            latestId={defaultVersionId}
            className="w-full sm:w-64"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>
          {i18n.t('Cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={pending || rating < 1}>
          {initial ? i18n.t('Update review') : i18n.t('Post review')}
        </Button>
      </div>
    </div>
  );
}
