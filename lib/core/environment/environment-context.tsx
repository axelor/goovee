'use client';

import React, {useContext} from 'react';

import {store} from './store';

const EnvironmentContext = React.createContext<
  Record<string, string | undefined>
>({});

export function Environment({
  children,
  value,
}: {
  children: React.ReactNode;
  value: Record<string, string | undefined>;
}) {
  store.setVariables(value);

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
