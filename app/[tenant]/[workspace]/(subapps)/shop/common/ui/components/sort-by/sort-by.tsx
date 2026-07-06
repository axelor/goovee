import type {Cloned} from '@/types/util';
import {MdSort} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import type {ShopConfig} from '@/subapps/shop/common/orm/config';
import {SORT_BY_OPTIONS} from '@/subapps/shop/common/constants';
import type {SortOption} from '@/subapps/shop/common/types';
import styles from './sort-by.module.scss';

export function SortBy({
  onChange,
  options: optionsProp,
  value: valueProp,
  config,
  className,
}: {
  onChange: (opts: {value: string}) => void;
  options?: SortOption[];
  value?: string;
  config: ShopConfig | Cloned<ShopConfig>;
  className?: string;
}) {
  const options =
    optionsProp || SORT_BY_OPTIONS.filter(o => config[o.value] as boolean);

  if (!options?.length) {
    return null;
  }

  const value = SORT_BY_OPTIONS.find(o => o.value === valueProp);

  return (
    <div
      className={`${styles.sortby} hidden md:flex items-center gap-4 ${className}`}>
      <p className="mb-0 shrink-0 text-sm">{i18n.t('Sort By')}</p>

      <Select
        defaultValue={value?.value}
        onValueChange={e => {
          onChange({value: e});
        }}>
        <SelectTrigger className="w-[11.25rem]">
          <SelectValue placeholder={i18n.t('Select')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Array.isArray(options) &&
              options?.map(o => (
                <SelectItem key={o?.value} value={o?.value}>
                  {i18n.t(o?.label)}
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
export function MobileSortBy({
  config,
  onChange,
  active,
}: {
  config: ShopConfig | Cloned<ShopConfig>;
  onChange: ({value}: {value: string}) => void;
  active?: string | null;
}) {
  const options = SORT_BY_OPTIONS.filter(o => config[o.value] as boolean);

  if (!options?.length) {
    return null;
  }

  return (
    <div className="cursor-pointer flex items-center gap-2 border-r">
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex">
            <MdSort className="text-2xl" />
            <p className="text-sm mb-0 font-bold">{i18n.t('Sort By')}</p>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <ul className="p-0">
            {options.map(o => {
              const isactive = o.value === active;
              return (
                <li
                  className={`${isactive ? 'bg-gray-100 font-bold' : ''} pointer`}
                  key={o.value}
                  onClick={() => onChange({value: o.value})}>
                  {i18n.t(o.label)}
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
export default SortBy;
