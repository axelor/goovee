'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useSignOut, useToast} from '@/ui/hooks';
import {useTenantScope} from '@/url/tenant-context';
import {getLoginURL} from '@/utils/login-url';

// ---- LOCAL IMPORTS ---- //
import {authButtonClass} from '../common/ui/auth-shell';

export function SignOutButton() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const signOut = useSignOut();
  const tenantScope = useTenantScope();
  const {toast} = useToast();

  const handleSignOut = async () => {
    setSubmitting(true);

    const result = await signOut();

    if (result.error) {
      setSubmitting(false);
      toast({
        title: i18n.t('Sign out failed, Try again'),
        variant: 'destructive',
      });
      return;
    }

    router.push(getLoginURL(tenantScope));
  };

  return (
    <button
      type="button"
      className={authButtonClass}
      disabled={submitting}
      onClick={handleSignOut}>
      {i18n.t('Sign out')}
    </button>
  );
}
