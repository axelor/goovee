'use client';

import React, {useState} from 'react';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {signIn, useSession} from 'next-auth/react';
import Image from 'next/image';
import {MdOutlineRefresh} from 'react-icons/md';
import {Dialog, DialogContent, DialogTitle} from '@/ui/components/dialog';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {TextField} from '@/ui/components/text-field';
import {Checkbox} from '@/ui/components/checkbox';
import {Label} from '@/ui/components/label';
import {Button} from '@/ui/components/button';
import {Separator} from '@/ui/components/separator';
import {SEARCH_PARAMS} from '@/constants';
import {useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {revalidate} from './actions';

export default function Content({
  canRegister,
  showGoogleOauth = true,
  showKeycloakOauth = true,
}: {
  canRegister?: boolean;
  showGoogleOauth?: boolean;
  showKeycloakOauth?: boolean;
}) {
  const [values, setValues] = useState({email: '', password: ''});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {toast} = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);
  const {status} = useSession();

  const toggleShowPassword = () => setShowPassword(show => !show);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = event.target;
    setValues(v => ({...v, [name]: value}));
  };

  const callbackurl = searchParams.get('callbackurl');

  const redirection = callbackurl ? decodeURIComponent(callbackurl) : '/';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const {email, password} = values;

    if (!(email && password)) {
      return toast({
        title: i18n.t('Email & password is required'),
        variant: 'destructive',
      });
    }

    setSubmitting(true);

    const login = await signIn('credentials', {
      email,
      password,
      tenantId,
      redirect: false,
    });

    if (login?.ok) {
      await revalidate();
      router.push(redirection);
    } else {
      toast({
        title: i18n.t('Login unsuccessful, Try again'),
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  const loginWithGoogle = async () => {
    await signIn('google', {
      callbackUrl: `/auth/login/google?${searchQuery}`,
    });
  };

  const loginWithKeycloak = async () => {
    await signIn('keycloak', {
      callbackUrl: `/auth/login/keycloak?${searchQuery}`,
    });
  };

  const isSessionLoading = ['loading', 'authenticated'].includes(status);

  if (isSessionLoading) {
    return (
      <Dialog open>
        <DialogTitle></DialogTitle>
        <DialogContent className="space-y-2" hideClose>
          <div className="flex items-center justify-center">
            <MdOutlineRefresh className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <div className="container space-y-6 mt-8 md:!w-3/4 xl:!w-1/2">
        <h1 className="text-[2rem] font-bold">{i18n.t('Log In')}</h1>
        <div className="bg-white py-4 px-6 space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <TextField
                label={i18n.t('Email')}
                type="email"
                name="email"
                placeholder={i18n.t('Enter email')}
                disabled={submitting}
                value={values.email}
                onChange={handleChange}
              />
              <TextField
                label={i18n.t('Password')}
                placeholder={i18n.t('Password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                icons={[
                  {
                    icon: showPassword
                      ? 'MdOutlineVisibility'
                      : 'MdOutlineVisibilityOff',
                    onClick: toggleShowPassword,
                  },
                ]}
                disabled={submitting}
                value={values.password}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox variant="success" id="terms" disabled={submitting} />
                <Label htmlFor="terms" className="ml-2">
                  {i18n.t('Remember Me')}
                </Label>
              </div>
              <Link
                href={`/auth/reset-password?${searchQuery}`}
                aria-disabled={submitting}
                className="flex underline text-success">
                {i18n.t('Reset Password')} ?
              </Link>
            </div>
            <Button
              variant="success"
              type="submit"
              disabled={submitting}
              className="rounded-full w-full">
              {submitting ? (
                <div className="flex items-center gap-2">
                  <span>{i18n.t('Submitting')}</span>
                  <MdOutlineRefresh className="h-6 w-6 animate-spin-fast" />
                </div>
              ) : (
                <span>{i18n.t('Log In')}</span>
              )}
            </Button>
            {canRegister && (
              <div className="text-success">
                <p className="inline-flex text-lg mr-2 mb-0">
                  {i18n.t("Don't have an account yet ?")}
                </p>
                <Link
                  href={`/auth/register?${searchQuery}`}
                  aria-disabled={submitting}
                  className="inline-flex underline text-lg">
                  {i18n.t('Sign Up')}
                </Link>
              </div>
            )}
            {searchParams.get('success') && (
              <div className="text-success-dark">
                {searchParams.get('success')}
              </div>
            )}
          </form>
          {showGoogleOauth && (
            <>
              <div className="flex items-center gap-4 mt-4">
                <div className="grow">
                  <Separator />
                </div>
                <h5 className="mb-0 font-medium text-xl">{i18n.t('Or')}</h5>
                <div className="grow">
                  <Separator />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline-success"
                  className="w-full rounded-full"
                  onClick={loginWithGoogle}
                  disabled={submitting}>
                  <Image
                    alt="Google"
                    src="/images/google.svg"
                    height={24}
                    width={24}
                    className="me-2"
                  />
                  {i18n.t('Log In with Google')}
                </Button>
              </div>
            </>
          )}
          {showKeycloakOauth && (
            <>
              <div className="flex items-center gap-4 mt-4">
                <div className="grow">
                  <Separator />
                </div>
                <h5 className="mb-0 font-medium text-xl">{i18n.t('Or')}</h5>
                <div className="grow">
                  <Separator />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={loginWithKeycloak}
                  disabled={submitting}>
                  <Image
                    alt="Google"
                    src="/images/keycloak.svg"
                    height={24}
                    width={24}
                    className="me-2"
                  />
                  {i18n.t('Log In with Keycloak')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
