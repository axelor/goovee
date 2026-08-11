'use client';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';

/**
 * Royal pill toggle matching the "AccountV3Rail" design (AvToggle).
 * Presentational only — same boolean API as the shared Checkbox
 * (`checked` + `onCheckedChange`) so it is a drop-in replacement.
 */
export function AccountToggle({
  checked,
  onCheckedChange,
  disabled,
  size = 'sm',
  className,
  'aria-label': ariaLabel,
}: {
  checked?: boolean;
  onCheckedChange?: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
  'aria-label'?: string;
}) {
  const lg = size === 'lg';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-block shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-royal/40 disabled:opacity-50 disabled:cursor-not-allowed',
        lg ? 'h-[26px] w-[44px]' : 'h-[22px] w-[38px]',
        checked ? 'bg-royal' : 'bg-ink-200',
        className,
      )}>
      <span
        className={cn(
          'absolute rounded-full bg-white shadow-sm transition-all',
          lg ? 'h-5 w-5 top-[3px]' : 'h-[18px] w-[18px] top-[2px]',
          checked
            ? lg
              ? 'left-[21px]'
              : 'left-[18px]'
            : lg
              ? 'left-[3px]'
              : 'left-[2px]',
        )}
      />
    </button>
  );
}

export default AccountToggle;
