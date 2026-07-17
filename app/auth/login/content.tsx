'use client';

import React, {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {authClient} from '@/lib/auth-client';
import Image from 'next/image';
import {MdOutlineRefresh, MdArrowForward} from 'react-icons/md';
import {Dialog, DialogContent, DialogTitle} from '@/ui/components/dialog';

// ---- CORE IMPORTS ---- //
import {i18n, l10n} from '@/locale';
import {SEARCH_PARAMS} from '@/constants';
import {useToast} from '@/ui/hooks';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {useEnvironment} from '@/lib/core/environment';
import {isSameOrigin} from '@/utils/url';
import {withBasePath} from '@/lib/core/path/base-path';
import {
  AuthShell,
  AuthField,
  AuthInput,
  PasswordInput,
  authButtonClass,
} from '../common/ui/auth-shell';

export default function Content({
  canRegister,
  showGoogleOauth = true,
  showKeycloakOauth = true,
}: {
  canRegister?: boolean;
  showGoogleOauth?: boolean;
  showKeycloakOauth?: boolean;
}) {
  const [values, setValues] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const {toast} = useToast();
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);
  const workspaceURI = searchParams.get('workspaceURI');
  const {isPending} = authClient.useSession();
  const env = useEnvironment();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = event.target;
    setValues(v => ({...v, [name]: value}));
  };

  const callbackurl = searchParams.get('callbackurl');
  const decoded = callbackurl ? decodeURIComponent(callbackurl) : '';
  const redirection =
    decoded && isSameOrigin(decoded, env.GOOVEE_PUBLIC_HOST!)
      ? withBasePath(decoded)
      : withBasePath('/');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantId) {
      toast({title: i18n.t('TenantId is required'), variant: 'destructive'});
      return;
    }

    const {email, password, rememberMe} = values;

    if (!(email && password)) {
      return toast({
        title: i18n.t('Email & password is required'),
        variant: 'destructive',
      });
    }

    setSubmitting(true);

    const login = await authClient.credentials.signIn({
      email,
      password,
      tenantId,
      rememberMe,
    });

    if (!login.error) {
      window.location.href = redirection;
    } else {
      console.error(login.error);
      toast({
        title: login.error.message
          ? i18n.t(login.error.message)
          : i18n.t('Login unsuccessful, Try again'),
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!tenantId) {
      toast({title: i18n.t('TenantId is required'), variant: 'destructive'});
      return;
    }
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: redirection,
      errorCallbackURL: withBasePath(
        `/auth/error?tenantId=${tenantId}&workspaceURI=${workspaceURI}`,
      ),
      additionalData: {
        tenantId,
      },
    });
  };

  const loginWithKeycloak = async () => {
    if (!tenantId) {
      toast({title: i18n.t('TenantId is required'), variant: 'destructive'});
      return;
    }
    await authClient.signIn.oauth2({
      providerId: 'keycloak',
      callbackURL: redirection,
      errorCallbackURL: withBasePath(
        `/auth/error?tenantId=${tenantId}&workspaceURI=${workspaceURI}`,
      ),
      additionalData: {
        tenantId,
        workspaceURI,
        locale: l10n.getLocale(),
      },
    });
  };

  if (isPending) {
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

  const successMessage = searchParams.get('success');
  const showSso = showGoogleOauth || showKeycloakOauth;

  return (
    <AuthShell>
      <div className="mb-7">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          {i18n.t('Log In')}
        </h2>
        <p className="mt-1.5 text-sm text-ink-500">
          {i18n.t('Access your client space')}
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-[10px] bg-mint-50 px-3.5 py-2.5 text-[13px] font-medium text-mint-700">
          {successMessage}
        </div>
      )}

      <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
        <AuthField label={i18n.t('Email')}>
          <AuthInput
            type="email"
            name="email"
            placeholder={i18n.t('Enter email')}
            disabled={submitting}
            value={values.email}
            onChange={handleChange}
          />
        </AuthField>

        <AuthField label={i18n.t('Password')}>
          <PasswordInput
            name="password"
            placeholder={i18n.t('Password')}
            disabled={submitting}
            value={values.password}
            onChange={handleChange}
          />
        </AuthField>

        <div className="flex items-center justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-700">
            <input
              type="checkbox"
              className="size-4 cursor-pointer accent-royal"
              disabled={submitting}
              checked={values.rememberMe}
              onChange={e =>
                setValues(v => ({...v, rememberMe: e.target.checked}))
              }
            />
            {i18n.t('Remember Me')}
          </label>
          <Link
            href={`/auth/reset-password?${searchQuery}`}
            aria-disabled={submitting}
            className="text-[13px] font-semibold text-royal hover:underline">
            {i18n.t('Forgot password?')}
          </Link>
        </div>

        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? (
            <>
              {i18n.t('Submitting')}
              <MdOutlineRefresh className="size-5 animate-spin-fast" />
            </>
          ) : (
            <>
              {i18n.t('Log In')}
              <MdArrowForward className="size-4" />
            </>
          )}
        </button>

        {canRegister && (
          <div className="text-center text-[13.5px] text-ink-500">
            {i18n.t("Don't have an account yet ?")}{' '}
            <Link
              href={`/auth/register?${searchQuery}`}
              aria-disabled={submitting}
              className="font-bold text-royal hover:underline">
              {i18n.t('Sign Up')}
            </Link>
          </div>
        )}
      </form>

      {showSso && (
        <>
          <div className="relative my-5 text-center">
            <div className="h-px bg-ink-100" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[12px] text-ink-400">
              {i18n.t('Or')}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {showGoogleOauth && (
              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-[11px] border border-ink-150 bg-white px-4 py-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-25 disabled:opacity-60">
                <Image
                  alt="Google"
                  src={withBasePath('/images/google.svg')}
                  height={20}
                  width={20}
                />
                {i18n.t('Log In with Google')}
              </button>
            )}
            {showKeycloakOauth && (
              <button
                type="button"
                onClick={loginWithKeycloak}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-[11px] border border-ink-150 bg-white px-4 py-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-25 disabled:opacity-60">
                <Image
                  alt="Keycloak"
                  src={
                    env.GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_IMAGE ||
                    withBasePath('/images/keycloak.svg')
                  }
                  height={20}
                  width={20}
                />
                {i18n.t(
                  env.GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_LABEL ||
                    'Log In with Keycloak',
                )}
              </button>
            )}
          </div>
        </>
      )}
    </AuthShell>
  );
}
