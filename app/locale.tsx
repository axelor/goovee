'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
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
 *
 * Held back only until the first bundle lands, never again. This wraps every
 * page of the tenant, so anything it stops rendering is unmounted, and a
 * visitor's half-filled form goes down with it.
 */
export default function Locale({children}: {children: React.ReactNode}) {
  /* Counts the loads that have landed, not the ones in flight: the first opens
   * the gate below, and every later one repaints the tree.
   *
   * A count rather than a flag, because `i18n.t` reads a bundle kept in a
   * module that nothing subscribes to. New words reach the screen only because
   * this state changed, and raising a flag that is already raised renders
   * nothing — a language change would load and never appear. */
  const [loads, setLoads] = useState(0);

  const scope = useTenantScope();

  const {data: session, isPending} = useAuthSession();
  const user = session?.user;
  const locale = user?.locale;

  const {dir, lang} = useAppLang({locale});

  const init = useCallback(
    async (locale: string | null | undefined, tenantScope: TenantScope) => {
      try {
        await l10n.init(locale);
        await i18n.load(l10n.getLocale(), tenantScope);
      } finally {
        /* Counted even when the load threw, or the gate below would hold the
         * tenant on a blank page for the rest of the session. An untranslated
         * screen is worth more than no screen. */
        setLoads(n => n + 1);
      }
    },
    [],
  );

  /* What the bundle on screen was loaded for, so nothing is loaded twice.
   *
   * better-auth refetches the session on every window refocus, and while that
   * request is in flight it republishes `isPending` wherever there is no
   * session to hold on to — the sign-in and sign-up screens, where a visitor is
   * anonymous by definition. That flip alone used to re-run the load. */
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    /* The locale to load is the signed-in visitor's own, so nothing loads
     * before the session first answers. Only the first answer is waited for: a
     * refetch afterwards carries the same locale and must not reach past here. */
    if (isPending && loadedFor.current === null) return;

    const wanted = `${scope.tenantId}:${locale ?? ''}`;

    if (loadedFor.current === wanted) return;

    loadedFor.current = wanted;
    init(locale, scope);
  }, [init, isPending, locale, scope]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [dir, lang]);

  if (loads === 0) return null;

  return <>{children}</>;
}
