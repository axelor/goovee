import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {clone} from 'lodash';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';

// ---- LOCAL IMPORTS ---- //
import {findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {
  ForumNotificationSkeleton,
  NotificationHeader,
} from '@/subapps/forum/common/ui/components';
import {MembersNoticationsWrapper} from './wrapper';
import GroupAction from './groupAction';

export default async function Page({
  params,
  searchParams,
}: {
  params: any;
  searchParams: {[key: string]: string | undefined};
}) {
  const {tenant} = params;
  const session = await getSession();
  const user = session?.user;
  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId: tenant,
  }).then(clone);

  if (!workspace) {
    return notFound();
  }

  const group = searchParams?.group as string;
  const sortBy = searchParams?.sortBy?.toUpperCase() as string;

  if (!user?.id) {
    return notFound();
  }

  return (
    <div>
      <GroupAction />
      <NotificationHeader>
        <Suspense fallback={<ForumNotificationSkeleton />}>
          <MembersNoticationsWrapper
            userId={user.id}
            group={group}
            sortBy={sortBy}
            workspaceID={workspace.id}
          />
        </Suspense>
      </NotificationHeader>
    </div>
  );
}
