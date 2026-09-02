import {notFound, redirect} from 'next/navigation';

import {currentWorkspace} from '@/lib/core/url/current';

// Legacy consolidated route — superseded by the per-tab rail.
export default async function Page() {
  const url = await currentWorkspace();
  if (!url) notFound();

  redirect(url.forRouter('/account/personal'));
}
