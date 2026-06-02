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
import {ProductIcon} from './common/ui/components/primitives/product-icon';
import {ProductTypeBadge} from './common/ui/components/primitives/product-type-badge';

export function Search({
  className,
  inputClassName,
}: {
  inputClassName?: string;
  className?: string;
}) {
  const router = useRouter();
  const {workspaceURL, workspaceURI} = useWorkspace();
  const {toast} = useToast();
  const [search, setSearch] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Cloned<ProductSearchResult>[]>([]);
  const searchRef = useRef<string | undefined>(undefined);

  const fetchResults = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          if (!query) {
            setResults([]);
            return;
          }
          const {error, message, data} = await searchProducts({
            search: query,
            workspaceURL,
          });
          if (searchRef.current !== query) return;
          if (error) {
            setResults([]);
            toast({variant: 'destructive', title: message});
            return;
          }
          setResults(data);
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
    [toast, workspaceURL],
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
    router.push(`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${slug}`);
  };

  return (
    <div className={cn('w-full relative', className)}>
      <Command className="p-0 bg-card" shouldFilter={false}>
        <CommandInput
          placeholder={i18n.t('Search marketplace')}
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
            {Boolean(results?.length)
              ? results.map(product => (
                  <CommandItem
                    key={product.id}
                    value={product.slug}
                    onSelect={handleRedirection}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <ProductIcon
                        code={product.iconCode}
                        className="w-5 h-5"
                      />
                    </div>
                    <span className="text-sm font-medium truncate">
                      {product.name}
                    </span>
                    {product.marketplaceTypeSelect && (
                      <ProductTypeBadge
                        type={product.marketplaceTypeSelect}
                        label={i18n.tattr(product.marketplaceTypeSelect)}
                        className="ml-auto flex-shrink-0"
                      />
                    )}
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
