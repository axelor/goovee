import {notFound, redirect} from 'next/navigation';

import {currentWorkspace} from '@/lib/core/url/current';

export default async function Page() {
  const url = await currentWorkspace();
  if (!url) notFound();

  redirect(url.forRouter('/account/apps'));
}
