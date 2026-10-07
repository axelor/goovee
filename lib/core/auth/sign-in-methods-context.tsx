'use client';

import React, {createContext, useContext} from 'react';

import type {SignInMethods} from './sign-in-methods';

const SignInMethodsContext = createContext<SignInMethods | null>(null);

/** Hands the browser the sign-in methods of the tenant whose page is rendering. */
export function SignInMethodsProvider({
  value,
  children,
}: {
  value: SignInMethods;
  children: React.ReactNode;
}) {
  return (
    <SignInMethodsContext.Provider value={value}>
      {children}
    </SignInMethodsContext.Provider>
  );
}

/**
 * The sign-in methods of the tenant whose page is rendering.
 *
 * @throws outside the tenant layout, where no tenant has been resolved.
 */
export function useSignInMethods(): SignInMethods {
  const value = useContext(SignInMethodsContext);

  if (!value) {
    throw new Error(
      'useSignInMethods() outside the tenant layout: no tenant to read.',
    );
  }

  return value;
}
