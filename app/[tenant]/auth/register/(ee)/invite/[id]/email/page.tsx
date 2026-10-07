import type {Metadata} from 'next';
import {notFound, redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {canSignIn, getSignInMethods} from '@/auth/sign-in-methods';
import {t} from '@/locale/server';
import {manager} from '@/tenant';
import {tenantURLs} from '@/url/scope';

// ---- LOCAL IMPORTS ---- //
import Form from './form';
import {findInviteById} from '../../../../common/orm/register';
import Subscribe from '../subscribe';

import {generateAuthMetadata} from '../../../../../common/workspace';
import {resolveAuthTenantId} from '@/app/[tenant]/auth/common/tenant';
import {SignInUnavailable} from '@/app/[tenant]/auth/common/ui/sign-in-unavailable';

export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  return generateAuthMetadata(props.searchParams);
}

export default async function Page(props: {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<any>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const {id} = params;
  const tenantId = await resolveAuthTenantId();

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

  const signInMethods = getSignInMethods(tenant.config);

  /* The invitation mail links here. Without email registration, Google is the
   * only way to accept it. */
  if (!signInMethods.password) {
    if (signInMethods.google) {
      redirect(
        tenantURLs(tenantId).forRouter(
          `/auth/register/invite/${invite.id}/google`,
        ),
      );
    }

    return (
      <SignInUnavailable
        title={await t('Sign Up')}
        description={
          canSignIn(signInMethods)
            ? await t('Registration is not available on this portal.')
            : await t('Sign-in is not available on this portal.')
        }
        workspaceName={null}
      />
    );
  }

  return (
    <Form
      email={invite?.emailAddress?.address}
      inviteId={invite.id}
      showGoogleOauth={signInMethods.google}
    />
  );
}
