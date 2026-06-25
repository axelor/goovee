'use client';

// ---- CORE IMPORTS ---- //
import {Link} from '@/ui/components/link';
import {Button} from '@/ui/components';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {useWorkspace} from './workspace-context';

export default function Unauthorized() {
  const {workspaceURI} = useWorkspace();

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="space-y-2">
        <div className="space-y-1">
          <h2 className="text-3xl">401 | {i18n.t('Unauthorized')}</h2>
          <p className="text-muted-foreground">
            {i18n.t('Unauthorized Access')}
          </p>
        </div>
        <div>
          <Link href={workspaceURI}>
            <Button>{i18n.t('Return Home')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
