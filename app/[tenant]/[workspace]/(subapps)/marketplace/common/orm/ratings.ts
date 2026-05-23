import type {Client} from '@/goovee/.generated/client';
import {sql} from '@/utils/template-string';

// ---- PRODUCT RATING (incremental maintenance) ---- //

/* Each helper is a single raw-SQL UPDATE so the read and write of
 * (ratingCount, averageRating) happen atomically at the row-lock level —
 * no read-modify-write race — and the row's optimistic-lock `version`
 * column is left alone so concurrent product edits aren't disrupted.
 * Running-mean math accumulates rounding error over many edits; for star
 * ratings clamped to 1-5, drift stays within a tenth of a star. An
 * occasional full recompute job can correct it. */

export async function addRating(
  client: Client,
  productId: string,
  rating: number,
) {
  await client.$raw(
    sql`
      UPDATE base_product
      SET
        average_rating = (
          COALESCE(average_rating, 0) * COALESCE(rating_count, 0) + $2
        ) / (COALESCE(rating_count, 0) + 1),
        rating_count = COALESCE(rating_count, 0) + 1
      WHERE
        id = $1
    `,
    productId,
    rating,
  );
}

export async function replaceRating(
  client: Client,
  productId: string,
  oldRating: number,
  newRating: number,
) {
  if (oldRating === newRating) return;
  await client.$raw(
    sql`
      UPDATE base_product
      SET
        average_rating = average_rating + ($3 - $2)::numeric / NULLIF(rating_count, 0)
      WHERE
        id = $1
    `,
    productId,
    oldRating,
    newRating,
  );
}

export async function removeRating(
  client: Client,
  productId: string,
  oldRating: number,
) {
  await client.$raw(
    sql`
      UPDATE base_product
      SET
        average_rating = CASE
          WHEN rating_count <= 1 THEN 0
          ELSE (average_rating * rating_count - $2) / (rating_count - 1)
        END,
        rating_count = GREATEST(COALESCE(rating_count, 0) - 1, 0)
      WHERE
        id = $1
    `,
    productId,
    oldRating,
  );
}
