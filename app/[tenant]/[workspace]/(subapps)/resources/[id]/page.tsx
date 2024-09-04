import React from 'react';
import {notFound} from 'next/navigation';
import {MdHistory, MdWeb} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {fetchFile} from '@/subapps/resources/common/orm/dms';
import {clone} from '@/utils';
import {parseDate} from '@/utils/date';
import {i18n} from '@/lib/i18n';

// ---- LOCAL IMPORTS ---- //
import DownloadIcon from './download-icon';
import ImageViewer from './image-viewer';
import HTMLViewer from './html-viewer';
import DocViewer from './doc-viewer';

const viewer: Record<string, React.JSXElementConstructor<any>> = {
  'application/pdf': DocViewer,
  'image/jpeg': ImageViewer,
  'image/jpg': ImageViewer,
  'image/png': ImageViewer,
  'image/vnd.microsoft.icon': ImageViewer,
  'text/html': HTMLViewer,
  html: HTMLViewer,
};

export default async function Page({
  params,
}: {
  params: {tenant: string; id: string};
}) {
  const {id, tenant} = params;

  const file = await fetchFile({id, tenantId: tenant}).then(clone);

  if (!file) {
    return notFound();
  }

  let Viewer = viewer[file?.metaFile?.fileType || file?.contentType];

  if (!Viewer) {
    // eslint-disable-next-line react/display-name
    Viewer = () => <p>{i18n.get('No viewer available for this file type.')}</p>;
  }

  const name = file?.fileName || '--';
  const date = parseDate(file?.createdOn) || '--';
  const author = file?.createdBy?.name || '--';
  const size = file?.metaFile?.sizeText || '--';

  return (
    <main className="container p-4 mx-auto space-y-6 h-full bg-white rounded-lg flex flex-col gap-6 overflow-hidden">
      <div className="border-b flex flex-col gap-4 pb-4 w-full">
        <div className="flex gap-4">
          <div className="grow flex flex-col">
            <div className="flex items-center gap-2">
              <MdWeb className="h-6 w-6" />
              <h2 className="font-semibold text-xl leading-5">{name}</h2>
            </div>
          </div>
          <MdHistory className="hidden h-10 w-10 text-muted-foreground cursor-pointer" />
          <DownloadIcon record={file} />
        </div>
        <div className="flex items-start gap-4 text-xs leading-4">
          <p className="grow">
            {i18n.get('Posted on')} {date} {i18n.get('by')} {author}
          </p>
          <p className="pe-2">
            <span className="font-semibold">{i18n.get('Size')}: </span>
            {size}
          </p>
          <p className="hidden">
            <span className="font-semibold">{i18n.get('Views')}: </span>43
          </p>
        </div>
      </div>
      <div className="grow overflow-auto">
        <Viewer record={file} />
      </div>
    </main>
  );
}
