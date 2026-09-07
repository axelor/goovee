'use client';

import React, {useContext} from 'react';

import type {PublicConfig} from '@/tenant/types';

const EnvironmentContext = React.createContext<PublicConfig | null>(null);

/**
 * Hands the browser what it may know about the tenant whose page is rendering:
 * the `public` group of that tenant's configuration, and nothing outside it.
 */
export function Environment({
  children,
  value,
}: {
  children: React.ReactNode;
  value: PublicConfig;
}) {
  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}

/**
 * The tenant's browser-facing settings.
 *
 * @throws outside the tenant shell, where no tenant has been resolved and so
 *   there is nothing a browser should be told.
 */
export function useEnvironment(): PublicConfig {
  const value = useContext(EnvironmentContext);

  if (!value) {
    throw new Error(
      'useEnvironment() outside the tenant layout: no tenant to read.',
    );
  }

  return value;
}

export default Environment;
