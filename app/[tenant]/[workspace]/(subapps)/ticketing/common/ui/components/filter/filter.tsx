import {
  PopoverContentResponsive,
  PopoverResponsive,
  PopoverTriggerResponsive,
} from '@/ui/components';
import {Button} from '@/ui/components/button';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {FaFilter} from 'react-icons/fa';
import {ReactNode, useMemo, useState} from 'react';

type FilterProps = {
  filter: unknown;
  title: string;
  contentRenderer: (props: {close: () => void; filter: unknown}) => ReactNode;
};

export function Filter({filter, title, contentRenderer}: FilterProps) {
  const [open, setOpen] = useState(false);

  const filterCount = useMemo(
    () => (filter ? Object.keys(filter).length : 0),
    [filter],
  );

  const res = useResponsive();
  const small = (['xs', 'sm', 'md'] as const).some(x => res[x]);

  return (
    <div className={cn('relative', {'mt-5': small})}>
      <PopoverResponsive open={open} onOpenChange={setOpen} isSmall={small}>
        <PopoverTriggerResponsive asChild>
          <Button
            variant={filterCount ? 'royal' : 'ink-outline'}
            className={cn('flex justify-between gap-2 w-[400px] h-11', {
              ['w-full']: small,
            })}>
            <div className="flex items-center gap-2">
              <FaFilter className="size-4" />
              <span>{title}</span>
            </div>
            {filterCount > 0 && (
              <span className="ms-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white text-royal text-[11px] font-bold tabular-nums">
                {filterCount}
              </span>
            )}
          </Button>
        </PopoverTriggerResponsive>

        <PopoverContentResponsive
          className={
            small
              ? 'px-5 pb-5 max-h-full'
              : 'w-[--radix-popper-anchor-width] p-0'
          }>
          {small && (
            <>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <hr className="mb-2" />
            </>
          )}
          {contentRenderer({close: () => setOpen(false), filter})}
        </PopoverContentResponsive>
      </PopoverResponsive>
    </div>
  );
}
