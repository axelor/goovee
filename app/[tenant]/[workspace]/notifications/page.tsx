import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/lib/core/auth';

// ---- LOCAL IMPORTS ---- //
import {UnreadNotificationsList} from './unread-list';

export default async function Page() {
  const session = await getSession();
  const user = session?.user;

  if (!user) notFound();

  return (
    <div className="bg-ink-25 min-h-full">
      <UnreadNotificationsList />
    </div>
  );
}
