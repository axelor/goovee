import type {ID} from '@/types';

// ---- CORE IMPORTS ---- //
import {withBasePath} from '@/path/base-path';
import type {TenantScope} from '@/url/tenant-urls';

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * 1024;
const GIGABYTE = MEGABYTE * 1024;

/**
 * Formats a byte count for display in binary units, where 1 KB is 1024 bytes —
 * so a limit written as `5 * 1024 * 1024` reads back as "5.00 MB". Returns an
 * empty string for 0.
 */
export function getFileSizeText(fileSize: number) {
  if (!fileSize) return '';

  if (fileSize >= GIGABYTE) return (fileSize / GIGABYTE).toFixed(2) + ' GB';

  if (fileSize >= MEGABYTE) return (fileSize / MEGABYTE).toFixed(2) + ' MB';

  if (fileSize >= KILOBYTE) return (fileSize / KILOBYTE).toFixed(2) + ' KB';

  return fileSize + ' B';
}

/*
 * The file name without its extension, used to prefill the name field of an
 * upload form. The extension is dropped because the server re-appends the
 * stored file's extension when it renames the file, so keeping it here would
 * produce names like `report.pdf.pdf`.
 *
 * Mirrors Node's `path.extname`, which is what the server renames with: a
 * leading dot is part of the name rather than an extension, so `.gitignore`
 * is returned unchanged.
 */
export function getFileNameWithoutExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
}

export function getPartnerImageURL(
  id: ID | undefined,
  scope: TenantScope | undefined,
  options: {noimage?: boolean; noimageSrc?: string} = {},
) {
  const {noimage, noimageSrc} = options;

  if (!(id && scope)) {
    return noimage ? withBasePath(noimageSrc || '/images/user.png') : '';
  }

  return scope.forBrowser(`/api/partner/image/${id}`);
}

export function getProductImageURL(
  id: ID | undefined,
  scope: TenantScope | undefined,
  options: {noimage?: boolean; noimageSrc?: string} = {},
) {
  const {noimage, noimageSrc} = options;

  if (!(id && scope)) {
    return noimage ? withBasePath(noimageSrc || '/images/no-image.png') : '';
  }

  return scope.forBrowser(`/api/product/image/${id}`);
}
