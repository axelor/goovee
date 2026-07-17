import {notFound, redirect, unauthorized} from 'next/navigation';
import React from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {t} from '@/locale/server';
import {fetchFile, fetchFiles} from '@/subapps/resources/common/orm/dms';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import HTMLViewer from './html-viewer';
import ImageViewer from './image-viewer';
import PDFViewer from './pdf-viewer';
import {NEW_FILE_CUTOFF_MS} from '@/subapps/resources/common/constants';
import {
  DocsViewerShell,
  type DocsViewerShellLabels,
} from '@/subapps/resources/common/ui/components';

function computeIsNew(createdOn: any, cutoffMs: number): boolean {
  if (!createdOn) return false;
  const ts = new Date(createdOn).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < cutoffMs;
}

const viewer: Record<string, React.JSXElementConstructor<any>> = {
  'application/pdf': PDFViewer,
  'image/jpeg': ImageViewer,
  'image/jpg': ImageViewer,
  'image/png': ImageViewer,
  'image/vnd.microsoft.icon': ImageViewer,
  'text/html': HTMLViewer,
  html: HTMLViewer,
};

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; id: string}>;
}) {
  const params = await props.params;
  const {id} = params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.resources,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: true,
  });

  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          [SEARCH_PARAMS.TENANT_ID]: tenant,
        }),
      );
    }
    unauthorized();
  }

  const {user} = access;
  const {client} = access.tenant;

  const file = await fetchFile({
    id,
    client,
    workspaceURL,
    user,
  }).then(clone);
  if (!file) return notFound();

  // Siblings: other files in the same parent folder
  const parentId = (file as any).parent?.id;
  const siblings = parentId
    ? await fetchFiles({id: parentId, client, user}).then(clone)
    : [];

  const labels = await buildLabels();

  let Viewer = viewer[file?.metaFile?.fileType || file?.contentType || ''];
  if (!Viewer) {
    // eslint-disable-next-line react/display-name
    Viewer = async () => (
      <div className="p-8 text-center text-sm text-ink-500">
        {await t('No viewer available for this file type.')}
      </div>
    );
  }

  const backHref = parentId
    ? `${workspaceURI}/${SUBAPP_CODES.resources}/folder/${parentId}`
    : `${workspaceURI}/${SUBAPP_CODES.resources}`;

  const fileMetaId = (file as any)?.metaFile?.id ?? null;
  const downloadHref = fileMetaId
    ? withBasePath(
        `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${fileMetaId}`,
      )
    : null;

  const isNew = computeIsNew((file as any).createdOn, NEW_FILE_CUTOFF_MS);

  return (
    <DocsViewerShell
      file={file as any}
      workspaceURI={workspaceURI}
      backHref={backHref}
      downloadHref={downloadHref}
      siblings={(siblings as any[]) ?? []}
      isNew={isNew}
      labels={labels}>
      <Viewer record={file} />
    </DocsViewerShell>
  );
}

async function buildLabels(): Promise<DocsViewerShellLabels> {
  const [
    backLabel,
    newBadge,
    downloadLabel,
    detailsTitle,
    authorLabel,
    categoryLabel,
    folderLabel,
    formatLabel,
    sizeLabel,
    publishedLabel,
    sameFolderTitle,
    sameFolderEmpty,
  ] = await Promise.all([
    t('Back'),
    t('New'),
    t('Download'),
    t('Details'),
    t('Author'),
    t('Category'),
    t('Folder'),
    t('Format'),
    t('Size'),
    t('Published on'),
    t('In the same folder'),
    t('No other documents here yet.'),
  ]);

  return {
    backLabel,
    newBadge,
    downloadLabel,
    detailsTitle,
    authorLabel,
    categoryLabel,
    folderLabel,
    formatLabel,
    sizeLabel,
    publishedLabel,
    sameFolderTitle,
    sameFolderEmpty,
  };
}
