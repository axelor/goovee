import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {currentWorkspace} from '@/lib/core/url/current';

// ---- LOCAL IMPORTS ---- //
import {ROUTES} from './common/constants';

export default async function Page() {
  const scope = await currentWorkspace();
  if (!scope) notFound();

  redirect(scope.forRouter(`/account/${ROUTES.personal}`));
}
