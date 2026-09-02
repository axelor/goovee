import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {currentWorkspace} from '@/lib/core/url/current';

// ---- LOCAL IMPORTS ---- //
import {ROUTES} from './common/constants';

export default async function Page() {
  const url = await currentWorkspace();
  if (!url) notFound();

  redirect(url.forRouter(`/account/${ROUTES.personal}`));
}
