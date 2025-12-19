import {Suspense} from 'react';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getSession} from '@/auth';
import {i18n} from '@/locale';
import type {PortalWorkspace, User} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {
  fetchLatestFiles,
  fetchLatestFolders,
} from '@/subapps/resources/common/orm/dms';
import {
  ResourceList,
  CategoriesSkeleton,
  ResourceListSkeleton,
} from '@/subapps/resources/common/ui/components';
import Categories from './categories';
import Hero from './hero';

async function LatestCategories({
  workspace,
  tenant,
  user,
}: {
  workspace: PortalWorkspace;
  tenant: string;
  user?: User;
}) {
  const folders = await fetchLatestFolders({
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  return <Categories items={folders} />;
}

async function LatestResources({
  workspace,
  tenant,
  user,
}: {
  workspace: PortalWorkspace;
  tenant: string;
  user?: User;
}) {
  const files = await fetchLatestFiles({
    workspace,
    tenantId: tenant,
    user,
  }).then(clone);

  return <ResourceList resources={files} />;
}

export default async function Page(
  props: {
    params: Promise<{tenant: string; workspace: string}>;
  }
) {
  const params = await props.params;
  const {tenant} = params;
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

  return (
    <>
      <Hero workspace={workspace} workspaceURI={workspaceURI} />
      <main className="container p-4 mx-auto space-y-6">
        <Suspense fallback={<CategoriesSkeleton />}>
          <LatestCategories workspace={workspace} tenant={tenant} user={user} />
        </Suspense>
        <h2 className="font-semibold text-xl">{i18n.t('New Resources')}</h2>
        <Suspense fallback={<ResourceListSkeleton />}>
          <LatestResources workspace={workspace} tenant={tenant} user={user} />
        </Suspense>
      </main>
    </>
  );
}
