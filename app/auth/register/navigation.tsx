'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import type {PortalWorkspace} from '@/types';
import {Button} from '@/ui/components/button';
import {Separator} from '@/ui/components/separator';

export default function Navigation({
  workspace,
  showGoogleOauth,
}: {
  workspace?: PortalWorkspace;
  showGoogleOauth?: boolean;
}) {
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();

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
              asChild
              type="button"
              variant="outline-success"
              className="w-full rounded-full">
              <Link href={`/auth/register/google?${searchQuery}`}>
                <Image
                  alt="Google"
                  src="/images/google.svg"
                  height={24}
                  width={24}
                  className="me-2"
                />

                {i18n.t('Sign Up with Google')}
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
