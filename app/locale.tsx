'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useAuthSession} from '@/lib/auth-client';

// ---- CORE IMPORTS ---- //
import {useAppLang} from '@/ui/hooks';
import {i18n, l10n} from '@/locale';
import {useTenantScope} from '@/lib/core/url/tenant-context';
import type {TenantScope} from '@/lib/core/url/tenant-urls';

/**
 * Loads the tenant's translations and holds the tree back until they are in.
 *
 * Mounted inside the tenant shell, so the tenant is always known here: the
 * addresses come from the scope that shell provides, and the locale from the
 * session, which belongs to the same tenant. The screens the deployment renders
 * for an address resolving no tenant sit above this and are written in English
 * instead.
 */
export default function Locale({children}: {children: React.ReactNode}) {
  const [loading, setLoading] = useState<number>(0);

  const scope = useTenantScope();

  const {data: session, isPending} = useAuthSession();
  const user = session?.user;
  const locale = user?.locale;

  const {dir, lang} = useAppLang({locale});

  const init = useCallback(
    async (locale: string | null | undefined, tenantScope: TenantScope) => {
      setLoading(l => l + 1);
      await l10n.init(locale);
      await i18n.load(l10n.getLocale(), tenantScope);
      setLoading(l => l - 1);
    },
    [],
  );

  useEffect(() => {
    if (isPending) return;
    init(locale, scope);
  }, [init, isPending, locale, scope]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [dir, lang]);

  if (loading > 0 || isPending) return null;

  return <>{children}</>;
}
