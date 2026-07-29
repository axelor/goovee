'use client';

import {useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';

const SIZES = {
  sm: {button: 'w-[30px] h-8 text-base', field: 'w-9 text-[13px]'},
  md: {button: 'w-9 h-[42px] text-lg', field: 'w-12 text-sm'},
} as const;

export function ShopQuantityStepper({
  value,
  onChange,
  size = 'md',
  min = 1,
  disabled,
  label,
}: {
  value: number;
  onChange: (quantity: number) => void;
  size?: keyof typeof SIZES;
  min?: number;
  disabled?: boolean;
  label?: string;
}) {
  /* Holds what is being typed, so the field can be emptied mid-edit without the
   * quantity jumping back or reaching the cart as a zero. Null means the field
   * is showing the quantity itself. */
  const [draft, setDraft] = useState<string | null>(null);
  const styles = SIZES[size];

  const step = (next: number) => {
    setDraft(null);
    if (disabled || next < min) return;
    onChange(next);
  };

  const handleType = (typed: string) => {
    /* Anything that is not a digit never even appears: a quantity has no room
     * for the forms a number field would otherwise accept — 1e3, +5, 1.5. */
    const digits = typed.replace(/\D/g, '');
    setDraft(digits);
    if (digits === '') return;

    const quantity = Number(digits);
    if (quantity < min) return;
    onChange(quantity);
  };

  return (
    <div className="flex items-center border border-ink-150 rounded-[10px] overflow-hidden">
      <button
        type="button"
        onClick={() => step(value - 1)}
        disabled={disabled || value <= min}
        aria-label={i18n.t('Decrease quantity')}
        className={cn(
          'grid place-items-center font-semibold text-ink-900 hover:bg-ink-25 transition-colors disabled:text-ink-300 disabled:hover:bg-transparent',
          styles.button,
        )}>
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={draft ?? String(value)}
        onChange={event => handleType(event.target.value)}
        /* Whatever was left half-typed is dropped in favour of the quantity
         * that was actually kept. */
        onBlur={() => setDraft(null)}
        disabled={disabled}
        aria-label={label || i18n.t('Quantity')}
        className={cn(
          'text-center font-bold text-ink-900 tabular-nums bg-transparent border-none outline-none disabled:text-ink-400',
          /* The field carries no border of its own, so focus has to show up as
           * something — otherwise a keyboard user cannot tell they have landed
           * on the one part of this control that accepts typing. */
          'focus-visible:bg-royal-pale focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-royal',
          styles.field,
        )}
      />
      <button
        type="button"
        onClick={() => step(value + 1)}
        disabled={disabled}
        aria-label={i18n.t('Increase quantity')}
        className={cn(
          'grid place-items-center font-semibold text-ink-900 hover:bg-ink-25 transition-colors disabled:text-ink-300 disabled:hover:bg-transparent',
          styles.button,
        )}>
        +
      </button>
    </div>
  );
}
