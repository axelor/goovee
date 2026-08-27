'use client';

import {i18n} from '@/locale';
import {CatalogueSelect} from '../catalogue-select';

export interface ProductSortSelectProps {
  currentSort: string;
}

export function ProductSortSelect({currentSort}: ProductSortSelectProps) {
  return (
    <CatalogueSelect
      param="sort"
      value={currentSort}
      ariaLabel={i18n.t('Sort by')}
      options={[
        {value: 'popular', label: i18n.t('Most popular')},
        {value: 'newest', label: i18n.t('Newest')},
        {value: 'rating', label: i18n.t('Highest rated')},
      ]}
    />
  );
}
