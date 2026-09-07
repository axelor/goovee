'use client';

import React, {createContext, useContext, useMemo} from 'react';

import {buildTenantScope, type TenantScope} from './tenant-urls';

const TenantScopeContext = createContext<TenantScope | null>(null);

/**
 * Hands the browser its tenant's addresses.
 *
 * The visitor prefix is given rather than derived from the tenant id, because
 * its shape follows how the tenant is routed and which origin the request
 * arrived at — both server-side facts. The shell resolves it once and nothing
 * below reads the prefix itself.
 */
export function TenantProvider({
  tenantId,
  visitorPrefix,
  host,
  children,
}: {
  tenantId: string;
  visitorPrefix: string;
  host: string | undefined;
  children: React.ReactNode;
}) {
  const scope = useMemo(
    () => buildTenantScope({tenantId, visitorPrefix, host}),
    [tenantId, visitorPrefix, host],
  );

  return (
    <TenantScopeContext.Provider value={scope}>
      {children}
    </TenantScopeContext.Provider>
  );
}

/**
 * This tenant's addresses.
 *
 * @throws outside the tenant shell, where there is no tenant to address and a
 *   caller building one from a guessed prefix would silently address another.
 */
export function useTenantScope(): TenantScope {
  const scope = useContext(TenantScopeContext);

  if (!scope) {
    throw new Error(
      'useTenantScope() outside the tenant layout: no tenant to address.',
    );
  }

  return scope;
}
