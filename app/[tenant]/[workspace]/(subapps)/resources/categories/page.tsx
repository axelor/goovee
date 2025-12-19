export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {notFound} from 'next/navigation';
import {MdAdd} from 'react-icons/md';
import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components/button';
import {workspacePathname} from '@/utils/workspace';
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {getSession} from '@/auth';
import {findWorkspace} from '@/orm/workspace';
import type {PortalWorkspace, User} from '@/types';

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
  workspace,
  tenant,
  user,
}: {
  workspace: PortalWorkspace;
  tenant: string;
  user?: User;
}) {
  const categories = await fetchExplorerCategories({
    workspace,
    user,
    tenantId: tenant,
  }).then(clone);

  return <CategoryExplorer categories={categories} />;
}

async function Resources({
  workspace,
  tenant,
  user,
  category,
}: {
  workspace: PortalWorkspace;
  tenant: string;
  user?: User;
  category?: string;
}) {
  let files;

  if (category) {
    files = await fetchFiles({
      id: category,
      workspace,
      user,
      tenantId: tenant,
    }).then(clone);
  } else {
    files = await fetchLatestFiles({
      workspace,
      user,
      tenantId: tenant,
    }).then(clone);
  }

  return <ResourceList resources={files} />;
}

export default async function Page(
  props: {
    searchParams: Promise<{id: string}>;
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const {tenant} = params;
  const {id} = searchParams;

  const session = await getSession();

  const user = session?.user;

  const {workspaceURL, workspaceURI} = workspacePathname(params);

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  let file;

  if (id) {
    file = await fetchFile({
      id,
      workspace,
      user,
      tenantId: tenant,
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
            <Categories workspace={workspace} tenant={tenant} user={user} />
          </Suspense>
        </div>
        <div className="sm:hidden">{/* <SortBy /> */}</div>
        <div className="sm:col-span-3 overflow-auto">
          <Suspense fallback={<ResourceListSkeleton />}>
            <Resources
              workspace={workspace}
              tenant={tenant}
              user={user}
              category={id}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
