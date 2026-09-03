'use client';

import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/components/command';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {debounce} from 'lodash-es';
import {useRouter} from 'next/navigation';
import {ChangeEvent, useCallback, useMemo, useRef, useState} from 'react';
import {searchProducts} from './common/actions';
import type {ProductSearchResult} from './common/orm';
import {SearchItem} from './common/ui/components/shared/search-item';

export function Search({className}: {className?: string}) {
  const router = useRouter();
  const {scope} = useWorkspace();
  const {toast} = useToast();
  const [search, setSearch] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Cloned<ProductSearchResult>[]>([]);
  /* The term these results were fetched for. Highlighting against the live
     input would un-mark every row while the debounce is in flight. */
  const [resultQuery, setResultQuery] = useState<string>('');
  const searchRef = useRef<string | undefined>(undefined);

  const fetchResults = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          if (!query) {
            setResults([]);
            setResultQuery('');
            return;
          }
          const {error, message, data} = await searchProducts({
            search: query,
          });
          if (searchRef.current !== query) return;
          if (error) {
            setResults([]);
            setResultQuery('');
            toast({variant: 'destructive', title: message});
            return;
          }
          setResults(data);
          setResultQuery(query);
        } catch (e) {
          toast({
            variant: 'destructive',
            title: i18n.t('Something went wrong'),
          });
        } finally {
          if (searchRef.current === query) {
            setLoading(false);
          }
        }
      }, 500),
    [toast],
  );

  const handleSearch = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setLoading(true);
      setOpen(!!query);
      searchRef.current = query;
      setSearch(query);
      fetchResults(query);
    },
    [fetchResults],
  );

  const handleRedirection = (slug: string) => {
    router.push(
      scope.forRouter(`/${SUBAPP_CODES.marketplace}/products/${slug}`),
    );
  };

  return (
    <div className={cn('w-full relative', className)}>
      <Command className="p-0 bg-white" shouldFilter={false}>
        <CommandInput
          placeholder={i18n.t('Search marketplace')}
          className="lg:placeholder:text-base placeholder:text-sm placeholder:font-normal lg:placeholder:font-medium pl-[10px] h-12 lg:pl-4 border-none text-base font-medium rounded-lg focus-visible:ring-offset-0 focus-visible:ring-0 text-ink-900"
          value={search}
          onChangeCapture={handleSearch}
          loading={loading}
        />

        <CommandList
          className={cn(
            'absolute bg-white top-[60px] right-0 border border-ink-150 rounded-lg text-ink-900 z-50 w-full p-0',
            open ? 'block' : 'hidden',
          )}>
          <CommandEmpty>
            {loading ? i18n.t('Searching...') : i18n.t('No results found.')}
          </CommandEmpty>
          <CommandGroup className="p-2">
            {Boolean(results?.length)
              ? results.map(product => (
                  <CommandItem
                    key={product.id}
                    value={product.slug}
                    onSelect={handleRedirection}
                    className="px-3 py-2 cursor-pointer">
                    <SearchItem result={product} query={resultQuery} />
                  </CommandItem>
                ))
              : null}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

export default Search;
