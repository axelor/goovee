import type {Client} from '@/goovee/.generated/client';
import {clone} from '@/utils';
import {getFileSizeText} from '@/utils/files';
import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import {pipeline} from 'stream/promises';
import type {ReadableStream as NodeReadableStream} from 'stream/web';

// ---- BUNDLE UPLOAD ---- //

/* Streams an uploaded file to the tenant's storage directory and creates
 * the matching `aOSMetaFile` row. Returns the new file id. */
async function uploadFile(file: File, storage: string, client: Client) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  await pipeline(
    Readable.fromWeb(
      file.stream() as unknown as NodeReadableStream<Uint8Array>,
    ),
    fs.createWriteStream(path.resolve(storage, fileName)),
  );
  const meta = await client.aOSMetaFile
    .create({
      data: {
        fileName: file.name,
        filePath: fileName,
        fileType: file.type || 'application/octet-stream',
        fileSize: String(file.size),
        sizeText: getFileSizeText(file.size),
        description: '',
      },
      select: {id: true},
    })
    .then(clone);
  return meta.id;
}

/* One ordered screenshot from the product form: an already-saved picture
 * (referenced by its AOSMarketplaceProductPicture row id) or a freshly-picked
 * File to upload. Mirrors `ProductImage` in the form validator; redeclared
 * here to keep the orm layer free of a UI import. */
export type ProductImageInput =
  | {kind: 'existing'; id: string; version: number}
  | {kind: 'new'; file: File};

/* Reconciles a marketplace product's screenshot list against the form
 * submission. `images` is the full ordered list — array index becomes the
 * persisted `sequence`:
 *   - Any existing AOSMarketplaceProductPicture row absent from `images` is
 *     deleted.
 *   - Each `new` file is uploaded as a MetaFile + linked via a fresh
 *     AOSMarketplaceProductPicture.
 *   - Every surviving / new picture gets `sequence = its position`.
 * Called from saveProduct after the MP row exists. The form-level caps
 * (count / 5 MB each) have already been enforced by Zod. */
export async function syncProductImages({
  client,
  productId,
  storage,
  images,
}: {
  client: Client;
  productId: string;
  storage: string;
  images: ProductImageInput[];
}) {
  const existing = await client.aOSMarketplaceProductPicture.find({
    where: {marketplaceProduct: {id: productId}},
    select: {id: true},
  });
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
   * concurrent edits); new files are uploaded and linked at the same
   * sequence. */
  for (let sequence = 0; sequence < images.length; sequence++) {
    const img = images[sequence];
    if (img.kind === 'existing') {
      await client.aOSMarketplaceProductPicture.update({
        data: {id: img.id, version: img.version, sequence},
        select: {id: true},
      });
    } else {
      const metaId = await uploadFile(img.file, storage, client);
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

/* Streams an uploaded `.zip` to the tenant's storage directory and
 * creates the matching `aOSMetaFile` row. Returns the new file id. */
export async function uploadBundle(
  file: File,
  storage: string,
  client: Client,
) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${safeName}`;
  await pipeline(
    Readable.fromWeb(
      file.stream() as unknown as NodeReadableStream<Uint8Array>,
    ),
    fs.createWriteStream(path.resolve(storage, fileName)),
  );
  const meta = await client.aOSMetaFile
    .create({
      data: {
        fileName: file.name,
        filePath: fileName,
        fileType: file.type || 'application/zip',
        fileSize: String(file.size),
        sizeText: getFileSizeText(file.size),
        description: '',
      },
      select: {id: true},
    })
    .then(clone);
  return meta.id;
}
