import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import CategoryForm from './form';
import {
  fetchColors,
  fetchFile,
  fetchIcons,
} from '@/subapps/resources/common/orm/dms';
import {ACTION} from '@/subapps/resources/common/constants';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{id: string}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const {id} = searchParams;

  if (!id) {
    return notFound();
  }

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.resources,
    url: workspaceURL,
    tenantId: tenant,
    allowGuest: false,
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

  const parent = await fetchFile({
    id,
    workspaceURL,
    user,
    client,
  }).then(clone);

  if (!parent) {
    return notFound();
  }

  const {permissionSelect, isDirectory} = parent;

  const canModify = permissionSelect === ACTION.WRITE || false;

  if (!(isDirectory && canModify)) {
    return notFound();
  }

  const colors = await fetchColors().then(clone);
  const icons = await fetchIcons().then(clone);

  return (
    <main className="container mx-auto mt-4 p-4 md:p-8 bg-white rounded space-y-2">
      <h2 className="font-semibold text-lg">{await t('Create a category')}</h2>
      <CategoryForm parent={parent} colors={colors} icons={icons} />
    </main>
  );
}
