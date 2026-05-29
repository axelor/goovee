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

/* Reconciles a marketplace product's screenshot list against the form
 * submission:
 *   - Deletes any AOSMarketplaceProductPicture rows whose ids aren't in
 *     `keepImageIds`.
 *   - Uploads each file in `newImages` as a MetaFile + creates a fresh
 *     AOSMarketplaceProductPicture linked to the marketplace product.
 * Called from saveProduct after the MP row exists. The form-level cap
 * (10 images / 5 MB each) has already been enforced by Zod. */
export async function syncProductImages({
  client,
  productId,
  storage,
  keepImageIds,
  newImages,
}: {
  client: Client;
  productId: string;
  storage: string;
  keepImageIds: string[];
  newImages: File[];
}) {
  const existing = await client.aOSMarketplaceProductPicture.find({
    where: {marketplaceProduct: {id: productId}},
    select: {id: true, picture: {id: true}},
  });
  const keep = new Set(keepImageIds);
  const toDelete = existing.filter(row => !keep.has(row.id));
  if (toDelete.length) {
    await client.aOSMarketplaceProductPicture.deleteAll({
      where: {id: {in: toDelete.map(row => row.id)}},
    });
  }
  for (const file of newImages) {
    const metaId = await uploadFile(file, storage, client);
    await client.aOSMarketplaceProductPicture.create({
      data: {
        marketplaceProduct: {select: {id: productId}},
        picture: {select: {id: metaId}},
      },
      select: {id: true},
    });
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
