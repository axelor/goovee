import {Suspense} from 'react';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import type {WorkspaceScope} from '@/lib/core/url/workspace-urls';
import {clone} from '@/utils';
import {t} from '@/locale/server';
import {SUBAPP_CODES} from '@/constants';
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
  const access = await ensureAccess({
    code: SUBAPP_CODES.resources,
    allowGuest: true,
  });

  if (!access.ok) return denyPage(access);

  const {user} = access;
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent
        workspaceURL={workspaceURL}
        client={client}
        user={user}
        scope={access.scope}
      />
    </Suspense>
  );
}

async function HomeContent({
  workspaceURL,
  client,
  user,
  scope,
}: {
  workspaceURL: string;
  client: Client;
  user?: User;
  scope: WorkspaceScope;
}) {
  const [pinnedFolders, labels] = await Promise.all([
    fetchPinnedFoldersWithMeta({workspaceURL, client, user}).then(clone),
    buildLabels(),
  ]);

  return (
    <DocsHomeView
      pinnedFolders={pinnedFolders ?? []}
      scope={scope}
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
