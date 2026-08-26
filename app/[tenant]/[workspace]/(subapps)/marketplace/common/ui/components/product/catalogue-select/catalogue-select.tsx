'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';
import {useRouter, useSearchParams} from 'next/navigation';

export interface CatalogueSelectOption {
  value: string;
  label: string;
}

export interface CatalogueSelectProps {
  /** Search param this control owns. */
  param: string;
  value: string;
  options: CatalogueSelectOption[];
  ariaLabel: string;
}

/**
 * One search-param-backed dropdown on the catalogue toolbar.
 *
 * Controlled on `value`, so Back and Forward — which re-render the page with
 * the restored param but reuse this DOM node — move the control along with the
 * results instead of leaving it showing the previous choice.
 */
export function CatalogueSelect({
  param,
  value,
  options,
  ariaLabel,
}: CatalogueSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(param, next);
    /* A narrowed or reordered list renumbers, so the old page number no longer
     * points at what the buyer was looking at. */
    params.delete('page');
    router.replace(`?${params.toString()}`, {scroll: false});
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="w-auto gap-2 bg-white border-ink-100 rounded-lg px-4 text-ink-900 hover:border-royal transition-colors">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
