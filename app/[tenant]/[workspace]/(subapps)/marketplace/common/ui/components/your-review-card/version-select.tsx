'use client';

import {useRef, useState} from 'react';
import {ChevronsUpDown} from 'lucide-react';

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
import {Drawer, DrawerContent, DrawerTrigger} from '@/ui/components/drawer';
import {i18n} from '@/locale';
import {useResponsive} from '@/ui/hooks';
import {RESPONSIVE_SIZES} from '@/constants';
import {cn} from '@/utils/css';

type VersionOption = {id: string; versionNumber: string};

type VersionSelectProps = {
  options: VersionOption[];
  value?: string;
  onChange: (id: string) => void;
  /** Id of the version to mark as "Latest" in the dropdown. */
  latestId?: string;
  className?: string;
};

export function VersionSelect({
  options,
  value,
  onChange,
  latestId,
  className,
}: VersionSelectProps) {
  const [open, setOpen] = useState(false);
  const res = useResponsive();
  const small = RESPONSIVE_SIZES.some(x => res[x]);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const selected = options.find(o => o.id === value);

  const [Controller, Trigger, Content] = small
    ? ([Drawer, DrawerTrigger, DrawerContent] as const)
    : ([Popover, PopoverTrigger, PopoverContent] as const);

  const panel = (
    <Command>
      <CommandInput placeholder={i18n.t('Search versions…')} />
      <CommandList>
        <CommandEmpty>{i18n.t('No versions found.')}</CommandEmpty>
        <CommandGroup>
          {options.map(option => (
            <CommandItem
              key={option.id}
              value={option.versionNumber}
              onSelect={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className="flex items-center justify-between gap-2">
              <span>v{option.versionNumber}</span>
              {option.id === latestId && (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success-dark">
                  {i18n.t('Latest')}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  return (
    <Controller open={open} onOpenChange={setOpen}>
      <Trigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          className={cn(
            'justify-between font-normal bg-primary/5 border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/40',
            className,
          )}>
          <span className="inline-flex items-center gap-2">
            {selected
              ? `v${selected.versionNumber}`
              : i18n.t('Select a version')}
            {selected && selected.id === latestId && (
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success-dark">
                {i18n.t('Latest')}
              </span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </Trigger>
      <Content
        align="start"
        style={
          small ? undefined : {width: buttonRef.current?.offsetWidth ?? 280}
        }>
        {small ? <div className="mt-4 border-t">{panel}</div> : panel}
      </Content>
    </Controller>
  );
}
