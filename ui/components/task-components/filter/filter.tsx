import {RESPONSIVE_SIZES} from '@/constants';
import {i18n} from '@/locale';
import {
  Badge,
  PopoverContentResponsive,
  PopoverResponsive,
  PopoverTriggerResponsive,
} from '@/ui/components';
import {Button} from '@/ui/components/button';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {type ReactNode, useCallback, useMemo, useState} from 'react';
import {FaFilter} from 'react-icons/fa';

type FilterProps = {
  title: string;
  contentRenderer: (props: {close: () => void}) => ReactNode;
  filter: unknown;
};
export function Filter(props: FilterProps) {
  const {title, contentRenderer, filter} = props;

  const [open, setOpen] = useState(false);
  const filterCount = useMemo(
    () => (filter ? Object.keys(filter).length : 0),
    [filter],
  );

  const res = useResponsive();
  const small = RESPONSIVE_SIZES.some(x => res[x]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <div className={cn('relative', {'mt-5': small})}>
      <PopoverResponsive open={open} onOpenChange={setOpen} isSmall={small}>
        <PopoverTriggerResponsive asChild>
          <Button
            variant={filterCount ? 'success' : 'outline'}
            className={cn('flex justify-between w-[400px]', {
              ['w-full']: small,
            })}>
            <div className="flex items-center space-x-2">
              <FaFilter className="size-4" />
              <span> {title}</span>
            </div>
            {filterCount > 0 && (
              <Badge
                className="ms-auto ps-[0.45rem] pe-2"
                variant="success-inverse">
                {filterCount}
              </Badge>
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
              <h3 className="text-xl font-semibold mb-2">
                {i18n.t('Filters')}
              </h3>
              <hr className="mb-2" />
            </>
          )}
          {contentRenderer({close})}
        </PopoverContentResponsive>
      </PopoverResponsive>
    </div>
  );
}
