import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {findWorkspace, findSubapps} from '@/orm/workspace';
import {clone} from '@/utils';
import {workspacePathname} from '@/utils/workspace';
import {manager} from '@/lib/core/tenant';
import {t} from '@/lib/core/locale/server';

// ---- LOCAL IMPORTS ---- //
import Content from './content';
import SettingsContent from '../settings/content';
import {SectionHeader} from '../common/ui/components';

export default async function Account(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {tenant: tenantId} = params;
  const tenant = await manager.getTenant(tenantId);

  if (!tenant) {
    return notFound();
  }

  const {client} = tenant;
  const session = await getSession();

  if (!session) return notFound();

  const {workspaceURL} = workspacePathname(params);

  const workspace = await findWorkspace({
    user: session?.user,
    url: workspaceURL,
    client,
  }).then(clone);

  if (!workspace) return notFound();

  const subapps = await findSubapps({
    url: workspace.url,
    user: session?.user,
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
