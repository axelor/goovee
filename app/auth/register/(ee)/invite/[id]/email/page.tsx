import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {SEARCH_PARAMS} from '@/constants';
import {t} from '@/locale/server';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import Form from './form';
import {findInviteById} from '../../../../common/orm/register';
import Subscribe from '../subscribe';

export default async function Page(props: {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<any>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const {id} = params;
  const tenantId = searchParams?.[SEARCH_PARAMS.TENANT_ID];

  if (!tenantId) {
    return notFound();
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const invite = await findInviteById({id, client});

  if (!invite?.emailAddress?.address) {
    return notFound();
  }

  const session = await getSession();
  const user = session?.user;

  if (user) {
    if (user.email !== invite.emailAddress.address) {
      return (
        <div className="container space-y-6 mt-8">
          <h1 className="text-[2rem] font-bold">{await t('Sign Up')}</h1>
          <div className="bg-white py-4 px-6">
            <p>
              {await t(
                'You are currently loggedin with a different user. Logout to continue registration for the invite.',
              )}
            </p>
          </div>
        </div>
      );
    } else if (!user.isContact) {
      return (
        <div className="container space-y-6 mt-8">
          <h1 className="text-[2rem] font-bold">{await t('Sign Up')}</h1>
          <div className="bg-white py-4 px-6">
            <p>{await t('Only contacts can register via invite.')}</p>
          </div>
        </div>
      );
    } else if (invite.workspace) {
      return (
        <Subscribe workspaceURL={invite.workspace.url} inviteId={invite.id} />
      );
    }
  }

  const showGoogleOauth = Boolean(tenant.config.oauth?.google);

  return (
    <Form
      email={invite?.emailAddress?.address}
      inviteId={invite.id}
      showGoogleOauth={showGoogleOauth}
    />
  );
}
