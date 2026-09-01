'use client';

import {useState} from 'react';

// ---- CORE IMPORTS ---- //
import {AuthShell, authButtonClass} from '@/app/auth/common/ui/auth-shell';
import {withBasePath} from '@/lib/core/path/base-path';
import {i18n} from '@/locale';
import {Link} from '@/ui/components/link';
import {useSignOut, useToast} from '@/ui/hooks';

export default function Content({
  activeTenant,
  target,
  callbackurl,
  activeTenantServed,
}: {
  activeTenant: string;
  target: string;
  callbackurl: string;
  /* False once the document has dropped the tenant this session belongs to.
   * Staying signed in then leads nowhere, so only the sign-out is offered. */
  activeTenantServed: boolean;
}) {
  const signOut = useSignOut();
  const {toast} = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);

    /* A failure arrives two ways: the server answering with one comes back as
     * `error`, while a request that never reached it throws. Both leave the
     * session standing, so both have to offer the button again. */
    let failure: unknown;

    try {
      failure = (await signOut()).error;
    } catch (err) {
      failure = err;
    }

    if (failure) {
      console.error(failure);
      toast({
        title: i18n.t('Could not sign out. Try again.'),
        variant: 'destructive',
      });
      setSigningOut(false);
      return;
    }

    /* A full load rather than a router navigation: this document was created
     * under `/<tenant>/` and stays bound to that tenant's service worker for
     * its whole life, so carrying it into another tenant's pages would leave
     * them reading the wrong registration — the subscription and the offline
     * cache of the tenant just left. */
    window.location.assign(withBasePath(callbackurl));
  };

  return (
    <AuthShell workspaceName={null}>
      <div className="mb-7">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          {i18n.t('Sign out to switch tenant')}
        </h2>
        <p className="mt-1.5 text-sm text-ink-500">
          {i18n.t('You are signed in to {0}.', activeTenant)}
        </p>
      </div>

      <div className="mb-6 rounded-[10px] bg-ink-25 px-3.5 py-3 text-[13px] text-ink-700">
        {i18n.t(
          'The address you opened belongs to {0}. A session covers one tenant only, so sign out to continue there.',
          target,
        )}
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className={authButtonClass}>
        {signingOut ? i18n.t('Signing out…') : i18n.t('Sign out')}
      </button>

      {activeTenantServed && (
        <p className="mt-5 text-center text-[13px] text-ink-500">
          <Link
            href="/"
            className="font-semibold text-royal hover:text-royal-dark">
            {i18n.t('Stay signed in to {0}', activeTenant)}
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
