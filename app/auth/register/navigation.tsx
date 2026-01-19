'use client';

import Link from 'next/link';
import Image from 'next/image';
import {signIn} from 'next-auth/react';
import {useSearchParams} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Separator} from '@/ui/components/separator';
import type {PortalWorkspace} from '@/types';

export default function Navigation({
  workspace,
  showGoogleOauth,
}: {
  workspace?: PortalWorkspace;
  showGoogleOauth?: boolean;
}) {
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();

  const handleSignUpWithGoogle = async () => {
    await signIn('google', {
      callbackUrl: `/auth/register/google?${searchQuery}`,
    });
  };

  return (
    <div className="container space-y-6 mt-8 md:!w-3/4 xl:!w-1/2">
      <h1 className="text-[2rem] font-semibold">{i18n.t('Sign Up')}</h1>
      <div className="bg-white py-4 px-6 space-y-4">
        <Link href={`/auth/register/email?${searchQuery}`} className="w-full">
          <Button variant="success" className="w-full rounded-full">
            {i18n.t('Sign Up with email')}
          </Button>
        </Link>
        <p className="text-success">
          {i18n.t('Already have an account')} ?{' '}
          <Link href={`/auth/login?${searchQuery}`}>
            <span className="underline">{i18n.t('Log In')}</span>
          </Link>
        </p>
        {showGoogleOauth && (
          <>
            <div className="flex items-center gap-4">
              <div className="grow">
                <Separator />
              </div>
              <h5 className="mb-0 font-medium text-[2rem]">{i18n.t('Or')}</h5>
              <div className="grow">
                <Separator />
              </div>
            </div>
            <Button
              type="button"
              variant="outline-success"
              className="w-full rounded-full"
              onClick={handleSignUpWithGoogle}>
              <Image
                alt="Google"
                src="/images/google.svg"
                height={24}
                width={24}
                className="me-2"
              />
              {i18n.t('Sign Up with Google')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
