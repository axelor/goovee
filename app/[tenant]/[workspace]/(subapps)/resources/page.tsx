import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {clone} from '@/utils';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {getWorkspaceConfig} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {i18n} from '@/locale';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import type {User} from '@/types';
import type {Client} from '@/goovee/.generated/client';

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
  workspaceURL,
  client,
  user,
}: {
  workspaceURL: string;
  client: Client;
  user?: User;
}) {
  const folders = await fetchLatestFolders({
    workspaceURL,
    client,
    user,
  }).then(clone);

  return <Categories items={folders} />;
}

async function LatestResources({
  workspaceURL,
  client,
  user,
}: {
  workspaceURL: string;
  client: Client;
  user?: User;
}) {
  const files = await fetchLatestFiles({
    workspaceURL,
    client,
    user,
  }).then(clone);

  return <ResourceList resources={files} />;
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;

  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
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

  const config = await getWorkspaceConfig(access.workspace.config.id, client);
  if (!config) return notFound();

  return (
    <>
      <Hero
        config={clone(config)}
        workspaceURI={workspaceURI}
        workspaceURL={access.workspace.url}
      />
      <main className="container p-4 mx-auto space-y-6">
        <Suspense fallback={<CategoriesSkeleton />}>
          <LatestCategories
            workspaceURL={workspaceURL}
            client={client}
            user={user}
          />
        </Suspense>
        <h2 className="font-semibold text-xl">{i18n.t('New Resources')}</h2>
        <Suspense fallback={<ResourceListSkeleton />}>
          <LatestResources
            workspaceURL={workspaceURL}
            client={client}
            user={user}
          />
        </Suspense>
      </main>
    </>
  );
}
