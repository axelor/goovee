import {notFound, permanentRedirect} from 'next/navigation';

import {SUBAPP_CODES} from '@/constants';
import {currentWorkspace} from '@/lib/core/url/current';

export default async function Page() {
  const url = await currentWorkspace();
  if (!url) notFound();

  permanentRedirect(url.forRouter(`/${SUBAPP_CODES.directory}`));
}
