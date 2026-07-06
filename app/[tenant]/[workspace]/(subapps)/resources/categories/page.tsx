export const dynamic = 'force-dynamic';

import {notFound, redirect, unauthorized} from 'next/navigation';
import {MdAdd} from 'react-icons/md';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components/button';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import type {User} from '@/types';
import type {Client} from '@/goovee/.generated/client';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {
  CategoryExplorer,
  ResourceList,
  ExplorerSkeleton,
  ResourceListSkeleton,
} from '@/subapps/resources/common/ui/components';
import {
  fetchExplorerCategories,
  fetchFile,
  fetchFiles,
  fetchLatestFiles,
} from '@/subapps/resources/common/orm/dms';
import {ACTION} from '../common/constants';

async function Categories({
  workspaceURL,
  client,
  user,
}: {
  workspaceURL: string;
  client: Client;
  user?: User;
}) {
  const categories = await fetchExplorerCategories({
    workspaceURL,
    user,
    client,
  }).then(clone);

  return <CategoryExplorer categories={categories} />;
}

async function Resources({
  workspaceURL,
  client,
  user,
  category,
}: {
  workspaceURL: string;
  client: Client;
  user?: User;
  category?: string;
}) {
  let files;

  if (category) {
    files = await fetchFiles({
      id: category,
      user,
      client,
    }).then(clone);
  } else {
    files = await fetchLatestFiles({
      workspaceURL,
      user,
      client,
    }).then(clone);
  }

  return <ResourceList resources={files} />;
}

export default async function Page(props: {
  searchParams: Promise<{id: string}>;
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const {id} = searchParams;

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

  let file;

  if (id) {
    file = await fetchFile({
      id,
      workspaceURL,
      user,
      client,
    });
  }
  const permissionSelect = file?.permissionSelect;
  const canWrite = permissionSelect && permissionSelect === ACTION.WRITE;
  const canUpload = permissionSelect && permissionSelect === ACTION.UPLOAD;

  return (
    <main className="container p-4 mx-auto space-y-6">
      <div className="grid md:grid-cols-[1fr_auto] gap-2">
        <h2 className="font-semibold text-xl leading-8 grow">
          {await t('Resource Category')}
        </h2>
        {user && (
          <div className="flex items-center gap-2">
            {canWrite && (
              <Link
                href={`${workspaceURI}/resources/categories/create?id=${id}`}>
                <Button variant="success" className="flex items-center">
                  <MdAdd className="size-6" />
                  <span>{await t('New Category')}</span>
                </Button>
              </Link>
            )}
            {(canWrite || canUpload) && (
              <Link href={`${workspaceURI}/resources/create?id=${id}`}>
                <Button variant="success" className="flex items-center">
                  <MdAdd className="size-6" />
                  <span>{await t('New Resource')}</span>
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      <p className="leading-5 text-sm">
        {file?.description ? file.description : ''}
      </p>
      <div className="grid sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-lg py-6 px-2">
          <Suspense fallback={<ExplorerSkeleton />}>
            <Categories
              workspaceURL={workspaceURL}
              client={client}
              user={user}
            />
          </Suspense>
        </div>
        <div className="sm:hidden">{/* <SortBy /> */}</div>
        <div className="sm:col-span-3 overflow-auto">
          <Suspense fallback={<ResourceListSkeleton />}>
            <Resources
              workspaceURL={workspaceURL}
              client={client}
              user={user}
              category={id}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
