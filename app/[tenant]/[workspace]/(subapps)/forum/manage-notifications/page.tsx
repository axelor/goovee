import {Suspense} from 'react';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {
  ForumNotificationSkeleton,
  NotificationHeader,
} from '@/subapps/forum/common/ui/components';
import {MembersNoticationsWrapper} from './wrapper';
import GroupAction from './groupAction';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const access = await ensureAuth({
    code: SUBAPP_CODES.forum,
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

  const group = searchParams?.group as string;
  const sortBy = searchParams?.sortBy?.toUpperCase() as string;

  return (
    <div>
      <GroupAction />
      <NotificationHeader>
        <Suspense fallback={<ForumNotificationSkeleton />}>
          <MembersNoticationsWrapper
            userId={user.id}
            group={group}
            sortBy={sortBy}
            workspaceID={access.workspace.id}
          />
        </Suspense>
      </NotificationHeader>
    </div>
  );
}
