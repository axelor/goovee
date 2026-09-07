'use client';

import {i18n} from '@/locale';
import {Filter} from '../../../common/ui/components/filter';
import {decode} from '@/utils/compressed-param';
import {useMemo} from 'react';
import {
  TicketFilterForm,
  type FilterFormProps,
} from '../../../common/ui/components/ticket-filter-form';

export function ClientFilter(props: FilterFormProps) {
  const {searchParams, ...rest} = props;

  const filter = useMemo(
    () => searchParams.filter && decode(searchParams.filter),
    [searchParams.filter],
  );

  return (
    <Filter
      filter={filter}
      title={i18n.t('Filters')}
      contentRenderer={({close}) => (
        <TicketFilterForm
          {...rest}
          searchParams={searchParams}
          filter={filter}
          close={close}
        />
      )}
    />
  );
}
