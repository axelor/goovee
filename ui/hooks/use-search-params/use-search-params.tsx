'use client';

import {useCallback, useMemo} from 'react';
import {
  useSearchParams as useNextSearchParams,
  usePathname,
  useRouter,
} from 'next/navigation';

type NavigationOptions = {
  scroll?: boolean;
  shallow?: boolean;
  locale?: string;
};

export const useSearchParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useNextSearchParams();

  const update = useCallback(
    (values: any, options: NavigationOptions = {}) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      values.forEach(({key, value = ''}: any) => {
        if (Array.isArray(value)) {
          current.delete(key);
          value.forEach(val => {
            if (val != null) {
              current.append(key, String(val).trim());
            }
          });
        } else {
          value = value && String(value)?.trim();
          value ? current.set(key, value) : current.delete(key);
        }
      });
      const query = current.toString();
      router.push(`${pathname}${query ? `?${query}` : ''}`, options);
    },
    [searchParams, router, pathname],
  );

  return useMemo(() => ({searchParams, update}), [searchParams, update]);
};
