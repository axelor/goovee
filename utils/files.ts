import type {ID} from '@/types';

// ---- CORE IMPORTS ---- //
import {withBasePath} from '@/lib/core/path/base-path';

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

export function download(record: any, href?: string) {
  if (!record) return null;

  const html =
    record.contentType === 'html' || record?.metaFile?.fileType === 'text/html';

  const link = document.createElement('a');
  const name = record.fileName;

  link.innerHTML = name || 'File';
  link.download = name || 'download';
  link.href = html ? getHTMLURL(record) : (href ?? '');

  Object.assign(link.style, {
    position: 'absolute',
    display: 'none',
    zIndex: 1000000000,
  });

  document.body.appendChild(link);

  link.onclick = e => {
    setTimeout(() => {
      if (e.target) {
        document.body.removeChild(e.target as any);
      }
    }, 300);
  };

  setTimeout(() => link.click(), 100);
}

export function getHTMLURL(record: any) {
  const dynamicContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated HTML Page</title>
  </head>
  <body>
    <main>
      ${record.content}
    </main>
  </body>
  </html>
`;

  const blob = new Blob([dynamicContent], {type: 'text/html'});
  const url = URL.createObjectURL(blob);

  return url;
}

export function getPartnerImageURL(
  id: ID | undefined,
  tenant: string,
  options: {noimage?: boolean; noimageSrc?: string} = {},
) {
  const {noimage, noimageSrc} = options;

  if (!(id && tenant)) {
    return noimage ? withBasePath(noimageSrc || '/images/user.png') : '';
  }

  return withBasePath(`/api/tenant/${tenant}/partner/image/${id}`);
}

export function getProductImageURL(
  id: ID | undefined,
  tenant: string,
  options: {noimage?: boolean; noimageSrc?: string} = {},
) {
  const {noimage, noimageSrc} = options;

  if (!(id && tenant)) {
    return noimage ? withBasePath(noimageSrc || '/images/no-image.png') : '';
  }

  return withBasePath(`/api/tenant/${tenant}/product/image/${id}`);
}
