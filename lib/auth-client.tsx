'use client';

import React, {createContext, useContext, useMemo} from 'react';
import {
  customSessionClient,
  genericOAuthClient,
} from 'better-auth/client/plugins';
import {createAuthClient} from 'better-auth/react';

import {withBasePath} from '@/lib/core/path/base-path';

import type {Auth} from './auth';
import type {Credentials} from './core/auth/credentials';

/*
 * better-auth refetches the session on window focus (refetchOnWindowFocus defaults
 * to true), so `session.user` is a new object on every refocus even when nothing
 * about it changed. A dependency array holding the object itself therefore re-runs
 * on refocus; hold a stable primitive such as `user?.id` instead.
 */

/**
 * A client bound to one tenant's authentication endpoint.
 *
 * `basePath` is the tenant's own, because each tenant answers through an
 * instance of its own mounted under its segment. A client built for the wrong
 * tenant would post a sign-in to an address that authenticates against another
 * tenant's database, so this is never built from anything but the scope of the
 * tenant whose page is rendering.
 */
function createTenantAuthClient(basePath: string) {
  return createAuthClient({
    basePath,
    plugins: [
      {
        id: 'credentials',
        $InferServerPlugin: {} as Credentials,
      },
      genericOAuthClient(),
      customSessionClient<Auth>(),
    ],
  });
}

export type AuthClient = ReturnType<typeof createTenantAuthClient>;

const AuthClientContext = createContext<AuthClient | null>(null);

/**
 * Binds everything below to the authentication endpoint of one tenant.
 *
 * Mounted in the root shell rather than the tenant's, because `Locale` reads the
 * session there to pick a locale and a hook cannot be called conditionally
 * further down. Takes the tenant's visitor prefix rather than a scope: a scope
 * carries methods, and those do not cross from a server component to a client
 * one.
 *
 * An address naming no tenant still gets a client, pointed at `/api/auth`, where
 * no route handler is served. Its session fetch finds nothing, which is the truth
 * for such an address — there is no tenant to be signed in to.
 */
export function AuthClientProvider({
  visitorPrefix,
  children,
}: {
  visitorPrefix: string | null;
  children: React.ReactNode;
}) {
  const client = useMemo(
    () =>
      createTenantAuthClient(withBasePath(`${visitorPrefix ?? ''}/api/auth`)),
    [visitorPrefix],
  );

  return (
    <AuthClientContext.Provider value={client}>
      {children}
    </AuthClientContext.Provider>
  );
}

/**
 * The authentication client for the tenant whose page is rendering.
 *
 * @throws outside the root shell, where nothing has bound an authentication
 *   endpoint. Inside it there is always a client, though one built for an
 *   address naming no tenant reaches nothing — see `AuthClientProvider`.
 */
export function useAuthClient(): AuthClient {
  const client = useContext(AuthClientContext);

  if (!client) {
    throw new Error(
      'useAuthClient() outside the root layout: no auth endpoint bound.',
    );
  }

  return client;
}

/** This tenant's session, the reading almost every caller wants. */
export function useAuthSession() {
  return useAuthClient().useSession();
}
