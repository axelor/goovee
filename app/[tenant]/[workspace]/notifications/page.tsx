import {UnreadNotificationsList} from './unread-list';
import {t} from '@/locale/server';
import {getSession} from '@/lib/core/auth';
import {notFound} from 'next/navigation';

export default async function Page() {
  const session = await getSession();
  const user = session?.user;

  if (!user) notFound();

  return (
    <div className="px-4 md:px-12 py-2 md:py-4 space-y-6">
      <h2 className="text-3xl font-bold text-foreground">
        {await t('Notifications')}
      </h2>
      <UnreadNotificationsList />
    </div>
  );
}
