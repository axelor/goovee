import {notFound, permanentRedirect} from 'next/navigation';

import {SUBAPP_CODES} from '@/constants';
import {currentWorkspace} from '@/lib/core/url/current';

export default async function Page() {
  const scope = await currentWorkspace();
  if (!scope) notFound();

  permanentRedirect(scope.forRouter(`/${SUBAPP_CODES.directory}`));
}
