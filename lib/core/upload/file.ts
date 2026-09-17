import crypto from 'crypto';
import path from 'path';

// ---- CORE IMPORTS ---- //
import type {Client} from '@/goovee/.generated/client';
import type {MetaFileStoreType} from '@/storage/index';
import {getFileSizeText} from '@/utils/files';

export interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  sizeText: string;
}

/*
 * Bounds the generated key so the whole of it — the timestamp and the random
 * component included — stays inside what a store takes for one name.
 */
const MAX_NAME_LENGTH = 120;

/**
 * The key a staged file will be stored under: the value its `meta_file` records
 * and the name the store is asked to write.
 *
 * Carries a timestamp and a random component, so two files staged under the
 * same name take two keys and neither overwrites the other. The name the
 * visitor chose is kept on the `meta_file` for display and is not this.
 */
export function deriveStoreKey(fileName: string): string {
  /*
   * Sanitised: any directory component stripped — the name arrives in a request
   * header, so one carrying parent-directory segments would otherwise resolve
   * outside the tenant's part of the store — reduced to characters every store
   * takes, and bounded in length.
   */
  const safeName = (
    path.basename(fileName).replace(/[^\w.-]+/g, '_') || 'file'
  ).slice(-MAX_NAME_LENGTH);

  return `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}

/**
 * Create the `meta_file` row for a file the store now holds.
 *
 * Pass a transaction client (`txClient`) to keep the row creation inside the
 * caller's transaction. `size` is the byte count the file was received with,
 * and `storeType` says which kind of store holds it, as AOP records it.
 */
export async function createMetaFile(
  {
    fileName,
    filePath,
    fileType,
    size,
    storeType,
  }: {
    fileName: string;
    filePath: string;
    fileType: string;
    size: number;
    storeType: MetaFileStoreType;
  },
  {client}: {client: Client},
): Promise<UploadedFile> {
  const metaFile = await client.aOSMetaFile.create({
    data: {
      fileName,
      filePath,
      fileType,
      fileSize: String(size),
      sizeText: getFileSizeText(size),
      storeType,
    },
    select: {id: true, fileName: true, filePath: true, sizeText: true},
  });

  return {
    id: metaFile.id,
    fileName: metaFile.fileName ?? fileName,
    filePath: metaFile.filePath ?? filePath,
    sizeText: metaFile.sizeText ?? getFileSizeText(size),
  };
}
