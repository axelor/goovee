import {notFound, redirect} from 'next/navigation';

import {currentWorkspace} from '@/lib/core/url/current';

// Legacy consolidated route — superseded by the per-tab rail.
export default async function Page() {
  const scope = await currentWorkspace();
  if (!scope) notFound();

  redirect(scope.forRouter('/account/personal'));
}
