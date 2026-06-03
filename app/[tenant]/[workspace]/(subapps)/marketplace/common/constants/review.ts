import {z} from 'zod';

export const REVIEW_COMMENT_MAX_LENGTH = 1500;

/** How far back the contributor dashboard's "new reviews" rollup looks. */
export const RECENT_REVIEW_WINDOW_DAYS = 7;

export const saveReviewSchema = z.object({
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
  rating: z.number().int().min(1, 'Pick at least one star').max(5),
  reviewComment: z
    .string()
    .max(
      REVIEW_COMMENT_MAX_LENGTH,
      `Keep it under ${REVIEW_COMMENT_MAX_LENGTH} characters`,
    )
    .optional(),
  reviewedVersionId: z.string().min(1).optional(),
});

export type SaveReviewInput = z.infer<typeof saveReviewSchema>;

export const deleteReviewSchema = z.object({
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
});

export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;
