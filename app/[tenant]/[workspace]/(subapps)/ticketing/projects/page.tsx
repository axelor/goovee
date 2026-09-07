import {notFound, permanentRedirect} from 'next/navigation';

import {currentWorkspace} from '@/lib/core/url/current';

export default async function Page() {
  const scope = await currentWorkspace();
  if (!scope) notFound();

  permanentRedirect(scope.forRouter('/ticketing'));
}
