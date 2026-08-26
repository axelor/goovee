'use client';

import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {Star} from 'lucide-react';
import {useState} from 'react';

type RatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
};

export function RatingInput({
  value,
  onChange,
  size = 24,
  className,
}: RatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;
  return (
    <div className={cn('flex gap-1', className)}>
      {[1, 2, 3, 4, 5].map(starCount => (
        <button
          key={starCount}
          type="button"
          /* Singular and plural are separate keys so each carries its own
           * translation — a locale may inflect the two differently. */
          aria-label={
            starCount === 1
              ? i18n.t('Rate 1 star')
              : i18n.t('Rate {0} stars', String(starCount))
          }
          onMouseEnter={() => setHover(starCount)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(starCount)}
          className="cursor-pointer">
          <Star
            size={size}
            className={cn(
              'transition-colors',
              starCount <= active
                ? 'fill-palette-amber text-palette-amber'
                : 'fill-ink-100 text-ink-100',
            )}
          />
        </button>
      ))}
    </div>
  );
}
