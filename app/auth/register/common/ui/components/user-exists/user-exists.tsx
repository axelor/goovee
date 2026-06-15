'use client';

// ---- CORE IMPORTS ----//
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Link} from '@/ui/components/link';

export function UserExists({workspaceURL}: {workspaceURL: string}) {
  return (
    <div className="container mx-auto px-6 py-4 gap-2 min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-xl font-medium">
        {i18n.t('You are already registered with the workspace!')}
      </h2>
      <p className="text-muted-foreground">
        {i18n.t('Workspace')} : {workspaceURL}
      </p>
      <Button asChild>
        <Link href={workspaceURL}>{i18n.t('Continue to the workspace')}</Link>
      </Button>
    </div>
  );
}

export default UserExists;
