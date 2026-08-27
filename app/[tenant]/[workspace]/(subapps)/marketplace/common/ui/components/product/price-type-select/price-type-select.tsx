'use client';

import {i18n} from '@/locale';
import {CatalogueSelect} from '../catalogue-select';

export interface PriceTypeSelectProps {
  currentPriceType: string;
}

export function PriceTypeSelect({currentPriceType}: PriceTypeSelectProps) {
  return (
    <CatalogueSelect
      param="priceType"
      value={currentPriceType}
      ariaLabel={i18n.t('Price')}
      options={[
        {value: 'all', label: i18n.t('All')},
        {value: 'free', label: i18n.t('Price free')},
        {value: 'paid', label: i18n.t('Price paid')},
      ]}
    />
  );
}
