import {notFound} from 'next/navigation';
import React from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {t} from '@/locale/server';
import {fetchFile, fetchFiles} from '@/subapps/resources/common/orm/dms';
import {clone} from '@/utils';
import {SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {NEW_FILE_CUTOFF_MS} from '@/subapps/resources/common/constants';
import {
  DocsViewerShell,
  ViewerMessage,
  findFileViewer,
  type DocsViewerShellLabels,
} from '@/subapps/resources/common/ui/components';

function computeIsNew(
  createdOn: string | Date | null | undefined,
  cutoffMs: number,
): boolean {
  if (!createdOn) return false;
  const ts = new Date(createdOn).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < cutoffMs;
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; id: string}>;
}) {
  const params = await props.params;
  const {id} = params;
  const access = await ensureAccess({
    code: SUBAPP_CODES.resources,
    allowGuest: true,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

  const file = await fetchFile({
    id,
    client,
    workspaceURL,
    user,
  }).then(clone);
  if (!file) return notFound();

  // Siblings: other files in the same parent folder
  const parentId = file.parent?.id;
  const siblings = parentId
    ? await fetchFiles({id: parentId, client, user, workspaceURL}).then(clone)
    : [];

  const labels = await buildLabels();

  const Viewer = findFileViewer(file?.metaFile?.fileType || file?.contentType);

  const backHref = parentId
    ? access.url.forRouter(`/${SUBAPP_CODES.resources}/folder/${parentId}`)
    : access.url.forRouter(`/${SUBAPP_CODES.resources}`);

  // The download route resolves a DMS file by its own id (fetchFile), so the
  // URL must carry the DMS file id — not the metaFile id. We still gate on the
  // metaFile existing, since that is what actually gets streamed.
  const downloadHref = file?.metaFile?.id
    ? access.url.forBrowser(`/${SUBAPP_CODES.resources}/api/file/${file.id}`)
    : null;

  const isNew = computeIsNew(file.createdOn, NEW_FILE_CUTOFF_MS);

  return (
    <DocsViewerShell
      file={file}
      backHref={backHref}
      downloadHref={downloadHref}
      siblings={siblings ?? []}
      isNew={isNew}
      labels={labels}>
      {Viewer ? (
        <Viewer record={file} />
      ) : (
        <ViewerMessage>
          {await t('This kind of file can only be downloaded.')}
        </ViewerMessage>
      )}
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
