'use client';

import React, {useCallback, useEffect, useState} from 'react';
import {authClient} from '@/lib/auth-client';

// ---- CORE IMPORTS ---- //
import {useAppLang} from '@/ui/hooks';
import {i18n, l10n} from '@/locale';
import {useEnvironment} from '@/environment';
import {useParams} from 'next/navigation';

export default function Locale({children}: {children: React.ReactNode}) {
  const [loading, setLoading] = useState<number>(0);
  const params = useParams();
  const tenant = params?.tenant;
  const env = useEnvironment();
  const host = env?.GOOVEE_PUBLIC_HOST;

  const {data: session, isPending} = authClient.useSession();
  const user = session?.user;
  const locale = user?.locale;

  const {dir, lang} = useAppLang({locale});

  const init = useCallback(
    async (locale?: string | null, tenant?: string, host?: string) => {
      setLoading(l => l + 1);
      await l10n.init(locale);
      await i18n.load(l10n.getLocale(), tenant, host);
      setLoading(l => l - 1);
    },
    [],
  );

  useEffect(() => {
    if (isPending) return;
    init(locale, tenant as string, host);
  }, [init, isPending, locale, tenant, host]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [dir, lang]);

  if (loading > 0 || isPending) return null;

  return <>{children}</>;
}
