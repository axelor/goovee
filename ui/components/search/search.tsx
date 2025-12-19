'use client';

import React, {useCallback, useEffect, useState, useRef} from 'react';
import {debounce} from 'lodash';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/components/command';
import {i18n} from '@/locale';

export const Search = ({
  findQuery,
  renderItem,
  searchKey = 'title',
  onItemClick,
  onSearch,
  forceClose,
  onFilter,
  onFocus,
  onKeyDown,
}: {
  findQuery: any;
  renderItem: any;
  searchKey?: string;
  onItemClick?: any;
  onSearch?: any;
  forceClose?: boolean;
  onFilter?: any;
  onFocus?: any;
  onKeyDown?: any;
}) => {
  const RenderItem = renderItem;
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const searchRef = useRef<string | undefined>(undefined);

  const debouncedFindQuery = useCallback(
    debounce(async (query: string) => {
      try {
        if (query) {
          const results = await findQuery({query});
          setResults(results);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    }, 500),
    [findQuery],
  );

  useEffect(() => {
    setOpen(search.length > 0);
    debouncedFindQuery(search);
  }, [search, debouncedFindQuery]);

  useEffect(() => {
    if (onSearch) {
      onSearch(search);
    }
  }, [search, onSearch]);

  return (
    <>
      <div className="w-full relative">
        <Command className="p-0 bg-white" filter={onFilter}>
          <CommandInput
            placeholder={i18n.t('Search here')}
            className="lg:placeholder:text-base placeholder:text-sm placeholder:font-normal lg:placeholder:font-medium pl-[10px] py-4 pr-[132px] h-14 lg:pl-4 border-none text-base font-medium rounded-lg focus-visible:ring-offset-0 focus-visible:ring-0 text-main-black"
            value={search}
            onChangeCapture={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setLoading(true);
              searchRef.current = e.target.value;
            }}
            onFocus={() => onFocus && onFocus(true)}
            onKeyDown={e => onKeyDown && onKeyDown(e, search)}
          />

          <CommandList
            className={cn(
              'absolute bg-white top-[60px] right-0 border border-grey-1 rounded-lg no-scrollbar text-main-black z-50 w-full p-0',
              open ? 'block' : 'hidden',
              forceClose ? 'hidden' : '',
            )}>
            <CommandEmpty>
              {loading ? i18n.t('Searching...') : i18n.t('No results found.')}
            </CommandEmpty>
            <CommandGroup className="p-2">
              {Boolean(results?.length)
                ? results.map((result: any, index) => (
                    <CommandItem
                      key={result.id}
                      value={`${result?.[searchKey]}-${result?.id || index}`}
                      className="block py-2 sm:px-6">
                      <RenderItem result={result} onClick={onItemClick} />
                    </CommandItem>
                  ))
                : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </>
  );
};

export default Search;
