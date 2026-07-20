import type {Client} from '@/goovee/.generated/client';
import {redeemUpload} from '@/lib/core/upload/staged-upload';
import type {ID} from '@/types';

/* One ordered screenshot from the product form: an already-saved picture
 * (referenced by its AOSMarketplaceProductPicture row id) or a freshly-picked
 * file that was pre-staged via the upload route (referenced by its single-use
 * token, redeemed server-side). Mirrors `ProductImage` in the form validator;
 * redeclared here to keep the orm layer free of a UI import. */
export type ProductImageInput =
  | {kind: 'existing'; id: string; version: number}
  | {kind: 'new'; token: string};

/* Reconciles a marketplace product's screenshot list against the form
 * submission. `images` is the full ordered list — array index becomes the
 * persisted `sequence`:
 *   - Any existing AOSMarketplaceProductPicture row absent from `images` is
 *     deleted.
 *   - Each `new` token is redeemed to its MetaFile id + linked via a fresh
 *     AOSMarketplaceProductPicture.
 *   - Every surviving / new picture gets `sequence = its position`.
 * Called from saveProductWithVersions inside its transaction (pass `txClient`)
 * so each token consume + its picture link commit (or roll back) together.
 * `owner` is the redeem subject — the AOSPartner id that staged the files (the
 * session user id). The count cap has already been enforced by Zod; size/type
 * were enforced at stage time by the `marketplace:screenshot` policy. */
export async function syncProductImages({
  client,
  productId,
  owner,
  images,
}: {
  client: Client;
  productId: string;
  owner: ID;
  images: ProductImageInput[];
}) {
  const existing = await client.aOSMarketplaceProductPicture.find({
    where: {marketplaceProduct: {id: productId}},
    select: {id: true},
  });
  const existingIds = new Set(existing.map(row => row.id));

  /* Each `existing` image must reference a picture row that belongs to this
   * product. The id/version come straight from the client form; without this
   * guard a publisher could re-sequence another product's picture by id. */
  for (const img of images) {
    if (img.kind === 'existing' && !existingIds.has(img.id)) {
      throw new Error('PICTURE_NOT_FOUND');
    }
  }

  const keep = new Set(
    images.flatMap(img => (img.kind === 'existing' ? [img.id] : [])),
  );
  const toDelete = existing.filter(row => !keep.has(row.id));
  if (toDelete.length) {
    await client.aOSMarketplaceProductPicture.deleteAll({
      where: {id: {in: toDelete.map(row => row.id)}},
    });
  }

  /* Walk in order; the index is the target sequence. Existing rows are
   * re-stamped with the client's loaded version (optimistic-locked against
   * concurrent edits); new tokens are redeemed and linked at the same
   * sequence. */
  for (let sequence = 0; sequence < images.length; sequence++) {
    const img = images[sequence];
    if (img.kind === 'existing') {
      await client.aOSMarketplaceProductPicture.update({
        data: {id: img.id, version: img.version, sequence},
        select: {id: true},
      });
    } else {
      const metaId = await redeemUpload({
        token: img.token,
        purpose: 'marketplace:screenshot',
        owner,
        client,
      });
      await client.aOSMarketplaceProductPicture.create({
        data: {
          marketplaceProduct: {select: {id: productId}},
          picture: {select: {id: metaId}},
          sequence,
        },
        select: {id: true},
      });
    }
  }
}
