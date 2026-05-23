import type {User} from '@/types';
import type {Cloned} from '@/types/util';
import type {MyReview} from '../../../orm';

export const REVIEW_CARD_SHELL =
  'rounded-lg border border-primary/40 bg-card p-6';

/**
 * Minimum subset of a review the display markup actually reads. Both
 * server-side MyReview and the optimistic snapshot conform to this shape.
 */
export type DisplayableReview = {
  rating: number | null;
  reviewComment: string | null;
  updatedOn: string | null;
  author: {
    simpleFullName: string | null;
    picture: {id: string} | null;
  };
  reviewedVersion: {versionNumber: string} | null;
};

export type OptimisticAction =
  | {
      kind: 'save';
      rating: number;
      reviewComment?: string;
      reviewedVersionId?: string;
      reviewedVersionNumber?: string;
    }
  | {kind: 'delete'}
  | null;

/**
 * Normalises the current display state from the optimistic action and the
 * server-fetched initial review. Optimistic delete blanks it; optimistic
 * save synthesises a review-shaped object using the caller's identity as a
 * fallback; otherwise we show the server's initial.
 */
export function deriveDisplayReview(
  optimistic: OptimisticAction,
  initial: Cloned<MyReview> | null,
  user: User,
): DisplayableReview | null {
  if (optimistic?.kind === 'delete') return null;
  if (optimistic?.kind === 'save') {
    return {
      rating: optimistic.rating,
      reviewComment: optimistic.reviewComment ?? null,
      updatedOn: new Date().toISOString(),
      author: {
        simpleFullName:
          initial?.author.simpleFullName ?? user.simpleFullName ?? user.name,
        picture:
          initial?.author.picture ?? (user.image ? {id: user.image} : null),
      },
      reviewedVersion: optimistic.reviewedVersionNumber
        ? {versionNumber: optimistic.reviewedVersionNumber}
        : null,
    };
  }
  return initial;
}
