'use client';

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
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(n)}
          className="cursor-pointer">
          <Star
            size={size}
            className={cn(
              'transition-colors',
              n <= active
                ? 'fill-palette-amber text-palette-amber'
                : 'fill-muted text-muted',
            )}
          />
        </button>
      ))}
    </div>
  );
}
