import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {findSubapps} from '@/orm/workspace';
import {clone} from '@/utils';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import SettingsContent from '../settings/content';
import {SectionHeader} from '../common/ui/components';

export default async function Account() {
  const access = await ensureAccess();

  if (!access.ok) return notFound();

  const {user, tenant} = access;
  const {client} = tenant;
  const workspace = clone(access.workspace);

  const subapps = await findSubapps({
    url: workspace.url,
    user,
    client,
  });

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow={await t('Team')}
        title={await t('My apps')}
        description={await t('Enable or hide applications in the side menu.')}
      />
      <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-6">
        <Content subapps={subapps} />
      </div>

      <div className="bg-white border border-destructive/30 rounded-xl shadow-xs p-6">
        <SettingsContent workspace={workspace} />
      </div>
    </div>
  );
}
