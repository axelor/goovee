'use client';

import {i18n} from '@/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';
import {useSearchParams} from '@/ui/hooks/use-search-params';
import {cn} from '@/utils/css';

import {defaultSortOption, sortOptions} from '../../../constants';

export function Sort() {
  const {searchParams, update} = useSearchParams();

  const currentValue = searchParams.get('sort') || defaultSortOption.value;

  const handleSortChange = (value: string) => {
    update(
      [
        {key: 'sort', value},
        {key: 'page', value: '1'},
      ],
      {scroll: false},
    );
  };

  return (
    <Select
      defaultValue={currentValue}
      onValueChange={e => handleSortChange(e)}>
      <SelectTrigger className={cn('lg:min-w-[128px] text-xs text-foreground')}>
        <SelectValue placeholder={i18n.t('Select sort')} />
      </SelectTrigger>
      <SelectContent className="w-full" style={{zIndex: 1000}}>
        {sortOptions.map(option => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-xs">
            {i18n.t(option.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
