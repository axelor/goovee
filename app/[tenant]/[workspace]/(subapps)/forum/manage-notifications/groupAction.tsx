'use client';

import {useEffect, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useSearchParams} from '@/ui/hooks';
import {ORDER_BY} from '@/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {
  GROUP_SORT_BY,
  MANAGE_NOTIFICATIONS,
  MENU,
  SORT_BY,
} from '@/app/[tenant]/[workspace]/(subapps)/forum/common/constants';
import {
  NavMenu,
  Search,
} from '@/app/[tenant]/[workspace]/(subapps)/forum/common/ui/components';

const GroupAction = () => {
  const [searchKey, setSearchKey] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>(ORDER_BY.ASC.toLowerCase());
  const {update} = useSearchParams();

  const handleSearchKeyChange = (value: string) => {
    setSearchKey(value);
  };

  useEffect(() => {
    update([
      {key: 'group', value: searchKey},
      {key: 'sortBy', value: sortBy},
    ]);
  }, [sortBy, searchKey, update]);

  return (
    <>
      <div className="hidden lg:block">
        <NavMenu items={MENU} />
      </div>
      <section className="py-6 px-4 lg:px-[6.25rem] w-full rounded-sm">
        <div>
          <h2 className="font-semibold text-xl mb-6">
            {i18n.t(MANAGE_NOTIFICATIONS)}
          </h2>
          <div className="grid grid-cols-[2fr_1fr] gap-4 h-fit items-end">
            <div>
              <Search onChange={handleSearchKeyChange} />
            </div>
            <div>
              <span className="pl-2 mb-3 text-muted-foreground">
                {i18n.t(SORT_BY)}:
                <div>
                  <Select
                    onValueChange={value => setSortBy(value.toLowerCase())}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="A-Z" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_SORT_BY.map(item => (
                        <SelectItem
                          key={item.id}
                          value={item.id}
                          className="text-muted-foreground">
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default GroupAction;
