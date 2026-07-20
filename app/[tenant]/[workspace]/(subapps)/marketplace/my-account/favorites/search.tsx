'use client';

import {i18n} from '@/locale';
import {Input} from '@/ui/components';
import {cn} from '@/utils/css';
import {debounce} from 'lodash-es';
import {Search as SearchIcon, X} from 'lucide-react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {useMemo, useState, type ChangeEvent} from 'react';

/** Filters the favourites table by name/description via the `?search=` param.
 *  Server-side filtering (so it spans every page), debounced, with a clear
 *  button. Resets to the first page on each new query. */
export function FavoritesSearch({className}: {className?: string}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('search') ?? '');

  const apply = useMemo(
    () =>
      debounce((query: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
          params.set('search', query);
        } else {
          params.delete('search');
        }
        /* A new query changes the result set — go back to page one. */
        params.delete('page');
        const queryStr = params.toString();
        router.replace(queryStr ? `${pathname}?${queryStr}` : pathname, {
          scroll: false,
        });
      }, 400),
    [router, pathname, searchParams],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setValue(query);
    apply(query.trim());
  };

  const handleClear = () => {
    setValue('');
    apply.cancel();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('page');
    const queryStr = params.toString();
    router.replace(queryStr ? `${pathname}?${queryStr}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={i18n.t('Search favourites')}
        aria-label={i18n.t('Search favourites')}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          title={i18n.t('Clear')}
          aria-label={i18n.t('Clear')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
