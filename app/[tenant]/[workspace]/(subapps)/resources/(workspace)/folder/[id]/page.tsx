import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {
  fetchFiles,
  fetchFolderWithParent,
} from '@/subapps/resources/common/orm/dms';
import {NEW_FILE_CUTOFF_MS} from '@/subapps/resources/common/constants';
import {
  DocsFolderView,
  type DocsFolderViewLabels,
} from '@/subapps/resources/common/ui/components';

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

  const [folder, files, labels] = await Promise.all([
    fetchFolderWithParent({id, workspaceURL, client, user}).then(clone),
    fetchFiles({id, client, user}).then(clone),
    buildLabels(),
  ]);

  if (!folder) return notFound();

  return (
    <DocsFolderView
      folder={folder as any}
      files={(files as any[]) ?? []}
      workspaceURI={workspaceURI}
      labels={labels}
    />
  );
}

async function buildLabels(): Promise<DocsFolderViewLabels> {
  const [
    rootCrumb,
    documentsLabel,
    documentsLabelOne,
    updatedLabel,
    columnDocument,
    columnAuthor,
    columnDate,
    columnSize,
    newBadge,
    emptyTitle,
    emptySubtitle,
  ] = await Promise.all([
    t('Documents'),
    t('documents'),
    t('document'),
    t('Last updated'),
    t('Document'),
    t('Author'),
    t('Date'),
    t('Size'),
    t('New'),
    t('No documents yet'),
    t('This folder is empty for now.'),
  ]);

  return {
    rootCrumb,
    documentsLabel,
    documentsLabelOne,
    updatedLabel,
    columnDocument,
    columnAuthor,
    columnDate,
    columnSize,
    newBadge,
    newCutoffMs: NEW_FILE_CUTOFF_MS,
    emptyTitle,
    emptySubtitle,
  };
}
