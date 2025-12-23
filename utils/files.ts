import type {ID} from '@/types';

export function getFileSizeText(fileSize: number) {
  if (!fileSize) return '';

  if (fileSize > 1000000000)
    return (fileSize / 1000000000.0).toFixed(2) + ' GB';

  if (fileSize > 1000000) return (fileSize / 1000000.0).toFixed(2) + ' MB';

  if (fileSize >= 1000) return (fileSize / 1000.0).toFixed(2) + ' KB';

  return fileSize + ' B';
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
    return noimage ? noimageSrc || '/images/user.png' : '';
  }

  return `/api/tenant/${tenant}/partner/image/${id}`;
}

export function getProductImageURL(
  id: ID | undefined,
  tenant: string,
  options: {noimage?: boolean; noimageSrc?: string} = {},
) {
  const {noimage, noimageSrc} = options;

  if (!(id && tenant)) {
    return noimage ? noimageSrc || '/images/no-image.png' : '';
  }

  return `/api/tenant/${tenant}/product/image/${id}`;
}
