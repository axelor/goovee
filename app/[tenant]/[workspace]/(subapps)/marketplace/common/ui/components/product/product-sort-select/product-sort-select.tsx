'use client';

import {i18n} from '@/locale';
import {useRouter, useSearchParams} from 'next/navigation';

export interface ProductSortSelectProps {
  currentSort: string;
}

export function ProductSortSelect({currentSort}: ProductSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (sortValue: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sortValue);
    params.delete('page');
    router.replace(`?${params.toString()}`, {scroll: false});
  };

  return (
    <select
      defaultValue={currentSort}
      onChange={e => handleSort(e.target.value)}
      className="bg-card border border-border rounded-lg px-4 py-2 text-sm text-foreground cursor-pointer hover:border-foreground transition-colors appearance-none pr-10 bg-no-repeat bg-right"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M3.5 5.5L7 9l3.5-3.5'/%3E%3C/svg%3E")`,
        backgroundPosition: 'right 0.7rem center',
        backgroundSize: '1.2em 1.2em',
        paddingRight: '2.5rem',
      }}>
      <option value="popular">{i18n.t('Most popular')}</option>
      <option value="newest">{i18n.t('Newest')}</option>
      <option value="rating">{i18n.t('Highest rated')}</option>
    </select>
  );
}
