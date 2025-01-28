'use client';
import {debounce} from 'lodash';
import {ChangeEvent, useCallback, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import type {ID} from '@goovee/orm';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
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
import {Cloned} from '@/types/util';

// ---- LOCAL IMPORTS ---- //
import {searchEntries} from './common/actions';
import type {SearchEntry} from './common/types';

export function Search({
  className,
  inputClassName,
  categoryId,
}: {
  inputClassName?: string;
  className?: string;
  categoryId?: ID;
}) {
  const router = useRouter();
  const {workspaceURL, workspaceURI} = useWorkspace();
  const {toast} = useToast();
  const [search, setSearch] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<Cloned<SearchEntry>[]>([]);
  const searchRef = useRef<string | undefined>();

  const fetchSearchResult = useMemo(
    () =>
      debounce(async (search: string) => {
        try {
          const {error, message, data} = await searchEntries({
            search,
            workspaceURL,
            categoryId,
          });
          if (searchRef.current !== search) return;
          if (error) {
            setSearchResult([]);
            toast({
              variant: 'destructive',
              title: message,
            });
            return;
          }
          setSearchResult(data);
        } catch (e) {
          toast({
            variant: 'destructive',
            title: i18n.t('Something went wrong'),
          });
        } finally {
          if (searchRef.current === search) {
            setLoading(false);
          }
        }
      }, 500),
    [toast, workspaceURL, categoryId],
  );

  const handleSearch = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setLoading(true);
      setOpen(!!query);
      searchRef.current = query;
      setSearch(query);
      fetchSearchResult(query);
    },
    [fetchSearchResult],
  );

  const handleRedirection = (id: string) => {
    router.push(`${workspaceURI}/directory/entry/${id}`);
  };

  return (
    <div className={cn('w-full relative', className)}>
      <Command className="p-0 bg-card" shouldFilter={false}>
        <CommandInput
          placeholder="Search here"
          className={cn(
            'lg:placeholder:text-base placeholder:text-sm placeholder:font-normal lg:placeholder:font-medium pl-[10px] pr-[132px] h-12 lg:pl-4 border-none text-base font-medium rounded-lg focus-visible:ring-offset-0 focus-visible:ring-0 text-main-black',
            inputClassName,
          )}
          value={search}
          onChangeCapture={handleSearch}
          loading={loading}
        />

        <CommandList
          className={cn(
            'absolute bg-card top-[60px] right-0 border border-grey-1 rounded-lg no-scrollbar text-main-black z-50 w-full p-0',
            open ? 'block' : 'hidden',
          )}>
          <CommandEmpty>
            {loading ? i18n.t('Searching...') : i18n.t('No results found.')}
          </CommandEmpty>
          <CommandGroup className="p-2">
            {Boolean(searchResult?.length)
              ? searchResult.map(result => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={handleRedirection}
                    className="block py-2 sm:px-6 cursor-pointer">
                    <div className="leading-5 text-sm space-y-2 p-3">
                      <h3 className="font-semibold line-clamp-1">
                        {result.title}
                      </h3>
                    </div>
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
