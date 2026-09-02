import {notFound, permanentRedirect} from 'next/navigation';

import {currentWorkspace} from '@/lib/core/url/current';

export default async function Page() {
  const url = await currentWorkspace();
  if (!url) notFound();

  permanentRedirect(url.forRouter('/ticketing'));
}
