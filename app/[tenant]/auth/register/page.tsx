import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {
  canSelfRegister,
  canSignIn,
  getSignInMethods,
} from '@/auth/sign-in-methods';
import {t} from '@/locale/server';
import {findWorkspaceForRegistration} from '@/orm/workspace';
import {manager} from '@/tenant';

// ---- LOCAL IMPORTS ---- //
import Navigation from './navigation';
import {extractSearchParams, isExistingUser} from './common/utils';
import {UserExists} from './common/ui/components';

import {generateAuthMetadata} from '../common/workspace';
import {SignInUnavailable} from '../common/ui/sign-in-unavailable';

export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  return generateAuthMetadata(props.searchParams);
}

export default async function Page(props: {
  searchParams: Promise<{workspaceURI?: string}>;
}) {
  const searchParams = await props.searchParams;
  const {workspaceURI, tenantId, workspaceURL} = await extractSearchParams({
    searchParams,
  });

  /* The screen names the workspace it registers for, so an address without
   * one has nothing to show. */
  if (!workspaceURI) {
    return notFound();
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return notFound();
  const {client} = tenant;

  const existing = await isExistingUser({workspaceURL, client});

  if (existing) {
    return <UserExists workspaceURL={workspaceURL} />;
  }

  const workspace = await findWorkspaceForRegistration({
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return notFound();
  }

  const signInMethods = getSignInMethods(tenant.config);

  if (!canSelfRegister(signInMethods)) {
    return (
      <SignInUnavailable
        title={await t('Sign Up')}
        description={
          canSignIn(signInMethods)
            ? await t('Registration is not available on this portal.')
            : await t('Sign-in is not available on this portal.')
        }
        workspaceName={workspace.name}
      />
    );
  }

  return (
    <Navigation
      showEmail={signInMethods.password}
      showGoogleOauth={signInMethods.google}
      workspaceName={workspace.name}
    />
  );
}
