import type {Client} from '@/goovee/.generated/client';
import {sql} from '@/utils/template-string';

// ---- MARKETPLACE PRODUCT RATING (recompute from rows) ---- //

/* Rebuilds (ratingCount, averageRating) for one product straight from its
 * review rows in a single raw UPDATE. Reading the aggregate from the rows is
 * order-independent: concurrent or out-of-order review writes always converge
 * to the true figure. Only non-archived reviews are counted, so the average
 * matches what the listing page shows; with no reviews left the count is 0 and
 * the average is 0. The optimistic-lock `version` column is left untouched so
 * a concurrent product edit isn't disrupted. */
export async function recomputeProductRating(
  client: Client,
  productId: string,
) {
  await client.$raw(
    sql`
      UPDATE portal_marketplace_product p
      SET
        rating_count = s.cnt,
        average_rating = COALESCE(s.avg, 0)
      FROM
        (
          SELECT
            COUNT(*) AS cnt,
            ROUND(AVG(rating), 2) AS avg
          FROM
            portal_marketplace_review
          WHERE
            marketplace_product = $1
            AND (
              archived = FALSE
              OR archived IS NULL
            )
        ) s
      WHERE
        p.id = $1
    `,
    productId,
  );
}
