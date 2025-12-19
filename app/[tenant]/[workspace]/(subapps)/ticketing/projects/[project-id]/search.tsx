'use client';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
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
import type {ID} from '@goovee/orm';
import {debounce} from 'lodash';
import {useRouter} from 'next/navigation';
import type {ChangeEvent} from 'react';
import {useCallback, useMemo, useRef, useState} from 'react';

import {searchTickets} from '../../common/actions';
import type {TicketSearch} from '../../common/types';

export function Search({
  projectId,
  className,
  inputClassName,
}: {
  projectId?: ID;
  inputClassName?: string;
  className?: string;
}) {
  const router = useRouter();
  const {workspaceURL, workspaceURI} = useWorkspace();
  const {toast} = useToast();
  const [search, setSearch] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [tickets, setTickets] = useState<Cloned<TicketSearch>[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<string | undefined>(undefined);

  const fetchTickets = useMemo(
    () =>
      debounce(async (search: string) => {
        try {
          if (!search) return setTickets([]);
          const {error, message, data} = await searchTickets({
            search: search,
            workspaceURL,
            projectId,
          });
          if (searchRef.current !== search) return;
          if (error) {
            setTickets([]);
            toast({
              variant: 'destructive',
              title: message,
            });
            return;
          }
          setTickets(data);
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
    [workspaceURL, projectId, toast],
  );

  const handleSearch = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setLoading(true);
      setOpen(!!query);
      searchRef.current = query;
      setSearch(query);
      fetchTickets(query);
    },
    [fetchTickets],
  );

  const handleRedirection = (ticketId: string) => {
    router.push(
      `${workspaceURI}/ticketing/projects/${projectId}/tickets/${ticketId}`,
    );
  };

  return (
    <div className={cn('w-full relative', className)}>
      <Command className="p-0 bg-card" shouldFilter={false}>
        <CommandInput
          placeholder={i18n.t('Search here')}
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
            {Boolean(tickets?.length)
              ? tickets.map(ticket => (
                  <CommandItem
                    key={ticket.id}
                    value={ticket.id}
                    onSelect={handleRedirection}
                    className="block py-2 sm:px-6 cursor-pointer">
                    <div className="leading-5 text-sm space-y-2 p-3">
                      <h3 className="font-semibold line-clamp-1">
                        {ticket.fullName ?? ticket.name}
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
