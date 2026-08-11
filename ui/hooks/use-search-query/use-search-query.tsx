'use client';

import {useEffect, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {URL_PARAMS} from '@/constants';
import {useSearchParams} from '@/ui/hooks/use-search-params';

/**
 * Debounced list-search bound to the `search` URL param. Returns the controlled
 * input value and its setter; after `delay` ms of no typing it writes the term
 * to the URL (server pages read it) and resets pagination to the first page.
 *
 * Debounce is the effect + cleared-timeout pattern, keyed on `input` — the timer
 * resets on each keystroke and only the last value is pushed. The equality guard
 * stops the effect re-pushing when it re-runs after its own navigation.
 */
export function useSearchQuery(delay = 400) {
  const {searchParams, update} = useSearchParams();
  const [input, setInput] = useState(
    () => searchParams.get(URL_PARAMS.search) ?? '',
  );

  useEffect(() => {
    const current = searchParams.get(URL_PARAMS.search) ?? '';
    const next = input.trim();
    if (next === current) return;
    const timer = setTimeout(() => {
      update([
        {key: URL_PARAMS.search, value: next},
        {key: URL_PARAMS.page, value: ''}, // new query → back to the first page
      ]);
    }, delay);
    return () => clearTimeout(timer);
  }, [input, searchParams, update, delay]);

  return [input, setInput] as const;
}
