'use client';

import React, {useCallback, useEffect, useState} from 'react';
import {authClient} from '@/lib/auth-client';

// ---- CORE IMPORTS ---- //
import {useAppLang} from '@/ui/hooks';
import {i18n, l10n} from '@/locale';
import {useParams} from 'next/navigation';

export default function Locale({children}: {children: React.ReactNode}) {
  const [loading, setLoading] = useState<number>(0);
  const params = useParams();
  const tenant = params?.tenant;

  const {data: session, isPending} = authClient.useSession();
  const user = session?.user;
  const locale = user?.locale;

  const {dir, lang} = useAppLang({locale});

  const init = useCallback(async (locale?: string, tenant?: string) => {
    setLoading(l => l + 1);
    await l10n.init(locale);
    await i18n.load(l10n.getLocale(), tenant);
    setLoading(l => l - 1);
  }, []);

  useEffect(() => {
    init(locale, tenant as string);
  }, [init, locale, tenant]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [dir, lang]);

  if (loading > 0 || isPending) return null;

  return <>{children}</>;
}
