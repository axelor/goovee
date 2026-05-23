import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import type {BigDecimal} from '@goovee/orm';
import {Star} from 'lucide-react';

type RatingProps = {
  /** 0–5 value. Accepts number, string, or ORM BigDecimal. */
  value: number | string | BigDecimal | null | undefined;
  /** Pre-formatted value text shown next to the stars. Caller is responsible
   *  for locale-aware formatting (use `@/locale/formatters` on the client,
   *  `@/locale/server/formatters` on the server). Defaults to `value.toFixed(1)`. */
  formattedValue?: string;
  /** When provided, renders "({count} review/reviews)" after the value. */
  count?: number | string | null;
  /** Show the numeric value next to the stars. */
  showValue?: boolean;
  /** Star icon size in px. */
  size?: number;
  /** Tailwind class for the value text. */
  valueClassName?: string;
  /** Tailwind class for the count text. */
  countClassName?: string;
  className?: string;
};

export function Rating({
  value,
  formattedValue,
  count,
  showValue = true,
  size = 14,
  valueClassName = 'text-sm text-foreground',
  countClassName = 'text-sm text-muted-foreground',
  className,
}: RatingProps) {
  const rating = Number(value ?? 0);
  const rounded = Math.round(rating);
  const reviewCount =
    count === undefined || count === null ? undefined : Number(count);
  const displayed = rating > 0 ? (formattedValue ?? rating.toFixed(1)) : '—';

  return (
    <div className={cn('flex items-center gap-2 whitespace-nowrap', className)}>
      <div className="flex gap-0.5">
        {Array.from({length: 5}).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={
              i < rounded
                ? 'fill-palette-amber text-palette-amber'
                : 'fill-muted text-muted'
            }
          />
        ))}
      </div>
      {showValue && <span className={valueClassName}>{displayed}</span>}
      {reviewCount !== undefined && (
        <span className={countClassName}>
          ({reviewCount}{' '}
          {reviewCount === 1 ? i18n.t('review') : i18n.t('reviews')})
        </span>
      )}
    </div>
  );
}
