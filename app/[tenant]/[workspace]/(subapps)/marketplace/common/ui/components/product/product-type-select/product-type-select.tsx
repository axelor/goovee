'use client';

import {i18n} from '@/locale';
import {CatalogueSelect} from '../catalogue-select';

export interface ProductTypeOption {
  value: string;
  label: string;
}

export interface ProductTypeSelectProps {
  currentType: string;
  types: ProductTypeOption[];
}

export function ProductTypeSelect({
  currentType,
  types,
}: ProductTypeSelectProps) {
  return (
    <CatalogueSelect
      param="type"
      value={currentType}
      ariaLabel={i18n.t('Type')}
      options={[{value: 'all', label: i18n.t('All types')}, ...types]}
    />
  );
}
