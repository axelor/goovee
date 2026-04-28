// ---- CORE IMPORTS ---- //
import {IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {HeroSearch} from '@/ui/components';
import {workspacePathname} from '@/utils/workspace';
import {notFound, redirect} from 'next/navigation';
import {getLoginURL} from '@/utils/url';

// ---- LOCAL IMPORTS ---- //
import {ensureAuth} from './common/utils/auth-helper';

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{[key: string]: string | undefined}>;
}) {
  const params = await props.params;
  const {workspaceURL, workspaceURI, tenant} = workspacePathname(params);

  const {error, forceLogin} = await ensureAuth(workspaceURL, tenant, {
    allowGuest: true,
  });
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}`,
        workspaceURI,
        tenant,
      }),
    );
  }
  if (error) notFound();

  return (
    <>
      <HeroSearch
        title={await t('app-market-place')}
        description={await t('app-market-place')}
        background="default"
        blendMode="normal"
        image={IMAGE_URL}
      />
      <div className="container py-6 space-y-6">
        <h2 className="font-semibold text-xl text-center">
          {await t('Coming soon')}
        </h2>
      </div>
    </>
  );
}
