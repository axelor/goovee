'use client';

import React, {useCallback, useEffect, useState, useRef} from 'react';
import {debounce} from 'lodash-es';
import {MdClose} from 'react-icons/md';

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
  variant = 'hero',
  placeholder,
  onViewAll,
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
  variant?: 'hero' | 'compact';
  placeholder?: string;
  onViewAll?: (query: string) => void;
}) => {
  const RenderItem = renderItem;
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const searchRef = useRef<string | undefined>(undefined);

  const compact = variant === 'compact';

  /* eslint-disable react-hooks/use-memo */
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
  /* eslint-enable react-hooks/use-memo */

  useEffect(() => {
    setOpen(search.length > 0);
    debouncedFindQuery(search);
  }, [search, debouncedFindQuery]);

  const handleClear = () => {
    setSearch('');
    setResults([]);
    onSearch && onSearch('');
  };

  return (
    <div className="w-full relative">
      <Command
        className={cn(
          'p-0 bg-white overflow-visible',
          compact &&
            cn(
              'rounded-xl border transition-colors',
              '[&_[cmdk-input-wrapper]]:border-b-0 [&_[cmdk-input-wrapper]]:px-3',
              open
                ? 'border-royal rounded-b-none [&_[cmdk-input-wrapper]_svg]:text-royal [&_[cmdk-input-wrapper]_svg]:opacity-100'
                : 'border-input',
            ),
        )}
        filter={onFilter}>
        <div className="relative">
          <CommandInput
            placeholder={placeholder || i18n.t('Search here')}
            className={cn(
              compact
                ? 'h-10 text-sm pr-7 placeholder:text-sm'
                : 'lg:placeholder:text-base placeholder:text-sm placeholder:font-normal lg:placeholder:font-medium pl-[10px] py-4 pr-[132px] h-14 lg:pl-4 border-none text-base font-medium rounded-lg focus-visible:ring-offset-0 focus-visible:ring-0 text-main-black',
            )}
            value={search}
            onChangeCapture={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setLoading(true);
              onSearch && onSearch(e.target.value);
              searchRef.current = e.target.value;
            }}
            onFocus={() => onFocus && onFocus(true)}
            onKeyDown={e => onKeyDown && onKeyDown(e, search)}
          />
          {compact && search && (
            <button
              type="button"
              aria-label={i18n.t('Clear')}
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-ink-100 text-ink-500 grid place-items-center hover:bg-ink-200">
              <MdClose className="size-3" />
            </button>
          )}
        </div>

        <CommandList
          className={cn(
            'absolute left-0 right-0 z-50 bg-white no-scrollbar text-main-black p-0 max-h-none overflow-y-visible overflow-x-visible',
            compact
              ? 'top-full border border-royal border-t-0 rounded-b-xl shadow-[0_12px_32px_rgba(13,30,75,0.16)]'
              : 'top-[60px] border border-royal rounded-lg shadow-[0_12px_32px_rgba(13,30,75,0.16)]',
            open ? 'block' : 'hidden',
            forceClose ? 'hidden' : '',
          )}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-ink-100 text-[10.5px] font-bold uppercase tracking-[0.06em] text-ink-500">
            <span>{i18n.t('Results')}</span>
            {onViewAll && Boolean(results?.length) && (
              <span className="text-royal normal-case tracking-normal font-semibold">
                {i18n.t('Enter')} ↵
              </span>
            )}
          </div>

          <CommandEmpty>
            <div className="px-4 py-7 text-center">
              <div className="text-2xl mb-1.5">🔍</div>
              <div className="text-[13px] font-semibold text-ink-700">
                {loading ? i18n.t('Searching...') : i18n.t('No results found.')}
              </div>
              {!loading && (
                <div className="text-xs text-ink-400 mt-0.5">
                  {i18n.t('Try another term.')}
                </div>
              )}
            </div>
          </CommandEmpty>

          <CommandGroup className="max-h-[360px] overflow-y-auto no-scrollbar p-1.5">
            {Boolean(results?.length)
              ? results.map((result: any, index) => (
                  <CommandItem
                    key={result.id}
                    value={`${result?.[searchKey]}-${result?.id || index}`}
                    className="block px-2 py-1.5 rounded-lg cursor-pointer data-[selected=true]:bg-ink-25 aria-selected:bg-ink-25">
                    <RenderItem
                      result={result}
                      onClick={onItemClick}
                      query={search}
                    />
                  </CommandItem>
                ))
              : null}
          </CommandGroup>

          {onViewAll && search && Boolean(results?.length) && (
            <button
              type="button"
              onClick={() => onViewAll(search)}
              className="w-full px-3.5 py-2.5 bg-ink-25 border-t border-ink-100 text-[12.5px] font-bold text-royal flex items-center justify-center gap-1.5 hover:bg-ink-50">
              {i18n.t('See all results for')} «&nbsp;{search}&nbsp;»
            </button>
          )}
        </CommandList>
      </Command>
    </div>
  );
};

export default Search;
