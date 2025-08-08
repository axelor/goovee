'use client';

import {i18n} from '@/locale';
import {Filter} from '@/ui/components/task-components/filter';
import {decodeFilter} from '@/utils/url';
import {useMemo} from 'react';
import {
  TicketFilterForm,
  type FilterProps,
} from '../../../common/ui/components/ticket-filter-form';

export function ClientFilter(props: FilterProps) {
  const {searchParams, ...rest} = props;

  const filter = useMemo(
    () => searchParams.filter && decodeFilter(searchParams.filter),
    [searchParams.filter],
  );
  return (
    <Filter
      filter={filter}
      title={i18n.t('Filters')}
      contentRenderer={props => (
        <TicketFilterForm
          {...rest}
          searchParams={searchParams}
          filter={filter}
          {...props}
        />
      )}
    />
  );
}
