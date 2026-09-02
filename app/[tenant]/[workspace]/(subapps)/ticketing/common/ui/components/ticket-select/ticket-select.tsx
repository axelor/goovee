import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui/components';
import {useResponsive, useToast} from '@/ui/hooks';
import type {ID} from '@/types';
import {Drawer, DrawerContent, DrawerTrigger} from '@/ui/components/drawer';
import {debounce} from 'lodash-es';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {searchTickets} from '../../../actions';
import type {TicketSearch} from '../../../types';

const INIT_SEARCH_VALUE = '';
export function TicketSelect({
  className,
  value,
  onChange,
  projectId,
  excludeList,
}: {
  value: Cloned<TicketSearch>;
  onChange: (ticket: Cloned<TicketSearch>) => void;
  projectId?: ID;
  excludeList?: ID[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [fetchOnOpen, setFetchOnOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const res = useResponsive();
  const small = (['xs', 'sm', 'md'] as const).some(x => res[x]);
  const searchRef = useRef<string | undefined>(INIT_SEARCH_VALUE);
  const [loading, setLoading] = useState(true);

  const {toast} = useToast();
  const [tickets, setTickets] = useState<Cloned<TicketSearch>[]>([]);

  const excludeListIds = excludeList?.join(); // To get a stable reference since array might be created without memoisation
  const fetchTickets = useCallback(
    async (search?: string) => {
      try {
        const {error, message, data} = await searchTickets({
          search: search,
          ...(projectId && {projectId}),
          ...(excludeListIds && {excludeList: excludeListIds.split(',')}),
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
    },
    [toast, excludeListIds, projectId],
  );

  const debouncedFetchTickets = useMemo(
    () => debounce(fetchTickets, 500),
    [fetchTickets],
  );

  const handleSearch = useCallback(
    (search?: string) => {
      setLoading(true);
      searchRef.current = search;
      debouncedFetchTickets(search);
    },
    [debouncedFetchTickets],
  );

  const handleSelect = useCallback(
    (value: Cloned<TicketSearch>) => {
      onChange(value);
      setOpen(false);
      if (searchRef.current !== INIT_SEARCH_VALUE) {
        setFetchOnOpen(true);
      }
    },
    [onChange],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);
      if (!open && searchRef.current !== INIT_SEARCH_VALUE) {
        setFetchOnOpen(true);
        return;
      }
      if (open && fetchOnOpen) {
        setFetchOnOpen(false);
        setLoading(true);
        searchRef.current = INIT_SEARCH_VALUE;
        fetchTickets(INIT_SEARCH_VALUE);
        return;
      }
    },
    [fetchOnOpen, fetchTickets],
  );

  useEffect(() => {
    setFetchOnOpen(false);
    setLoading(true);
    searchRef.current = INIT_SEARCH_VALUE;
    fetchTickets(INIT_SEARCH_VALUE);
  }, [fetchTickets]);

  const [Controller, Trigger, Content] = small
    ? ([Drawer, DrawerTrigger, DrawerContent] as const)
    : ([Popover, PopoverTrigger, PopoverContent] as const);

  const panel = (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={i18n.t('Search tickets')}
        onValueChange={handleSearch}
        loading={loading}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? i18n.t('Searching...') : i18n.t('No results found.')}
        </CommandEmpty>
        <CommandGroup>
          {tickets.map(option => (
            <CommandItem
              key={option.id}
              value={option.id.toString()}
              onSelect={() => handleSelect(option)}>
              {option.fullName ?? option.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  const buttonWidth = buttonRef.current?.offsetWidth;
  return (
    <Controller open={open} onOpenChange={handleOpenChange}>
      <Trigger asChild>
        <Button variant="outline" className={className} ref={buttonRef}>
          {value ? (value.fullName ?? value.name) : i18n.t('Select ticket')}
        </Button>
      </Trigger>
      <Content
        align="start"
        style={
          small
            ? undefined
            : {
                width: buttonWidth ? `${buttonWidth}px` : '300px',
              }
        }>
        {small ? <div className="mt-4 border-t">{panel}</div> : panel}
      </Content>
    </Controller>
  );
}
