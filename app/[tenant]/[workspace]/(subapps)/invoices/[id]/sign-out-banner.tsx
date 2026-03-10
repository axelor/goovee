'use client';

import {useRouter} from 'next/navigation';
import {authClient} from '@/lib/auth-client';
import {i18n} from '@/locale';
import {Button} from '@/ui/components';

export function SignOutBanner({userName}: {userName: string | null}) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <div className="flex justify-center m-4">
      <div className="flex items-center justify-between gap-4 bg-card text-card-foreground border px-6 py-4 rounded-lg shadow-sm text-sm max-w-lg w-full">
        <span>
          {i18n.t(
            'You are signed in as {0}. Sign out to access via token.',
            userName ?? '',
          )}
        </span>
        <Button variant="destructive" size="sm" onClick={handleSignOut}>
          {i18n.t('Sign out')}
        </Button>
      </div>
    </div>
  );
}
