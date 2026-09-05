'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useAuthSession} from '@/lib/auth-client';

// ---- CORE IMPORTS ---- //
import {useAppLang} from '@/ui/hooks';
import {i18n, l10n} from '@/locale';
import {buildTenantScope, type TenantScope} from '@/lib/core/url/tenant-urls';

export default function Locale({
  children,
  tenant,
}: {
  children: React.ReactNode;
  /* What the addressed tenant's own addresses are built from, or null where the
   * address names none. Resolved in the root layout, which sits above the
   * tenant shell that would otherwise provide the scope. */
  tenant: {id: string; visitorPrefix: string; host: string | undefined} | null;
}) {
  const [loading, setLoading] = useState<number>(0);

  /* Built here rather than taken from context: this sits above the tenant shell
   * that provides one, and a scope carries methods, which do not cross from a
   * server component to a client one. The prefix is the part that does. */
  const scope = useMemo(
    () =>
      tenant &&
      buildTenantScope({
        tenantId: tenant.id,
        visitorPrefix: tenant.visitorPrefix,
        host: tenant.host,
      }),
    [tenant],
  );

  const {data: session, isPending} = useAuthSession();
  const user = session?.user;
  const locale = user?.locale;

  const {dir, lang} = useAppLang({locale});

  const init = useCallback(
    async (locale?: string | null, tenantScope?: TenantScope | null) => {
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
