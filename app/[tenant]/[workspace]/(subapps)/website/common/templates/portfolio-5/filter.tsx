'use client';
import useIsotope from '@/subapps/website/common/hooks/useIsotope';

import {TemplateProps} from '../../types';
import {Portfolio5Data} from './meta';

export function Filter(props: {
  list: NonNullable<TemplateProps<Portfolio5Data>['data']>['portfolio5List'];
  selector: string;
}) {
  const {filterKey, handleFilterKeyChange} = useIsotope(props.selector);
  const {list} = props;
  return list?.map(({id, attrs: item}) => (
    <li key={id}>
      <a
        onClick={handleFilterKeyChange(item.value)}
        className={`filter-item ${filterKey === item.value ? 'active' : ''}`}>
        {item.title}
      </a>
    </li>
  ));
}
