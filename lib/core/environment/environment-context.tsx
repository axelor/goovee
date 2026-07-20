'use client';

import React, {useContext} from 'react';

import type {PublicEnv} from '@/tenant/types';

const EnvironmentContext = React.createContext<PublicEnv>({});

export function Environment({
  children,
  value,
}: {
  children: React.ReactNode;
  value: PublicEnv;
}) {
  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  return useContext(EnvironmentContext);
}

export default Environment;
