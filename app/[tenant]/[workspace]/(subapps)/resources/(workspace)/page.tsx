import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import type {User} from '@/types';
import type {Client} from '@/goovee/.generated/client';

// ---- LOCAL IMPORTS ---- //
import {fetchPinnedFoldersWithMeta} from '@/subapps/resources/common/orm/dms';
import {
  DocsHomeView,
  type DocsHomeViewLabels,
} from '@/subapps/resources/common/ui/components';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;

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

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent
        workspaceURL={workspaceURL}
        client={client}
        user={user}
        workspaceURI={workspaceURI}
      />
    </Suspense>
  );
}

async function HomeContent({
  workspaceURL,
  client,
  user,
  workspaceURI,
}: {
  workspaceURL: string;
  client: Client;
  user?: User;
  workspaceURI: string;
}) {
  const [pinnedFolders, labels] = await Promise.all([
    fetchPinnedFoldersWithMeta({workspaceURL, client, user}).then(clone),
    buildLabels(),
  ]);

  return (
    <DocsHomeView
      pinnedFolders={pinnedFolders ?? []}
      workspaceURI={workspaceURI}
      labels={labels}
    />
  );
}

async function buildLabels(): Promise<DocsHomeViewLabels> {
  const [
    pinnedTitle,
    pinnedSubtitle,
    pinnedEmptyTitle,
    pinnedEmptySubtitle,
    documentsLabel,
    documentsLabelOne,
    updatedLabel,
  ] = await Promise.all([
    t('Featured folders'),
    t('Curated by your admin'),
    t('No pinned folders yet'),
    t('Your admin will pin folders here for quick access.'),
    t('documents'),
    t('document'),
    t('Updated'),
  ]);

  return {
    pinnedTitle,
    pinnedSubtitle,
    pinnedEmptyTitle,
    pinnedEmptySubtitle,
    documentsLabel,
    documentsLabelOne,
    updatedLabel,
  };
}

function HomeSkeleton() {
  return (
    <div className="px-9 py-8 max-w-[1280px] mx-auto animate-pulse">
      <div className="h-8 w-64 bg-ink-100 rounded mb-2" />
      <div className="h-4 w-96 bg-ink-100 rounded mb-7" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-32 bg-white rounded-2xl border border-ink-100"
          />
        ))}
      </div>
    </div>
  );
}
