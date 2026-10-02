import {redirect} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {t} from '@/locale/server';
import {tenantURLs} from '@/url/scope';
import {getLoginURL} from '@/utils/login-url';

// ---- LOCAL IMPORTS ---- //
import {resolveAuthTenantId} from '../common/tenant';
import {AuthShell} from '../common/ui/auth-shell';
import {SignOutButton} from './sign-out-button';

/* Where the tenant's entry sends a signed-in user who can open no workspace.
 * It does not check that again: it is a page of its own rather than a landing,
 * so it cannot send the visitor back round to where they came from. */
export default async function Page() {
  const session = await getSession();
  const tenantId = await resolveAuthTenantId();

  if (!session?.user) {
    redirect(getLoginURL(tenantURLs(tenantId)));
  }

  return (
    <AuthShell workspaceName={null}>
      <div className="mb-7">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          {await t('No workspace available')}
        </h2>
        <p className="mt-1.5 text-sm text-ink-500">
          {await t(
            'You are signed in as {0}, but your account does not have access to any workspace yet. Contact your administrator.',
            session.user.email,
          )}
        </p>
      </div>

      <SignOutButton />
    </AuthShell>
  );
}
