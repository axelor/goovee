'use client';

import {useSearchParams} from 'next/navigation';
import {MdMailOutline} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {AuthShell, authButtonClass} from '../common/ui/auth-shell';

export default function Navigation({
  showGoogleOauth,
}: {
  showGoogleOauth?: boolean;
}) {
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();

  return (
    <AuthShell>
      <div className="mb-7">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          {i18n.t('Sign Up')}
        </h2>
        <p className="mt-1.5 text-sm text-ink-500">
          {i18n.t('Create your account to access the portal')}
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <Link
          href={`/auth/register/email?${searchQuery}`}
          className={authButtonClass}>
          <MdMailOutline className="size-[18px]" />
          {i18n.t('Sign Up with email')}
        </Link>

        {showGoogleOauth && (
          <>
            <div className="relative my-1 text-center">
              <div className="h-px bg-ink-100" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[12px] text-ink-400">
                {i18n.t('Or')}
              </span>
            </div>
            <Link
              href={`/auth/register/google?${searchQuery}`}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-[11px] border border-ink-150 bg-white px-4 py-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-25">
              <span className="font-extrabold text-[#4285F4]">G</span>
              {i18n.t('Sign Up with Google')}
            </Link>
          </>
        )}

        <div className="mt-1.5 text-center text-[13.5px] text-ink-500">
          {i18n.t('Already have an account')} ?{' '}
          <Link
            href={`/auth/login?${searchQuery}`}
            className="font-bold text-royal hover:underline">
            {i18n.t('Log In')}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
