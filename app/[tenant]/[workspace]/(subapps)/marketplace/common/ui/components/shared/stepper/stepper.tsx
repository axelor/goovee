import {cn} from '@/utils/css';
import {Check} from 'lucide-react';
import {Fragment} from 'react';

export type StepperStep = {
  id: string;
  name: string;
  disabled?: boolean;
};

export type StepperProps = {
  steps: StepperStep[];
  current: string;
  /** Called when the user clicks a step. Omit to make the stepper read-only. */
  onChange?: (id: string) => void;
  className?: string;
};

export function Stepper({steps, current, onChange, className}: StepperProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex(s => s.id === current),
  );

  return (
    <ol className={cn('inline-flex items-center gap-4', className)}>
      {steps.map((step, i) => {
        const state: 'completed' | 'active' | 'pending' =
          i < currentIndex
            ? 'completed'
            : i === currentIndex
              ? 'active'
              : 'pending';
        const isLast = i === steps.length - 1;
        return (
          <Fragment key={step.id}>
            <li>
              <button
                type="button"
                onClick={() => !step.disabled && onChange?.(step.id)}
                disabled={step.disabled || !onChange}
                className={cn(
                  'flex items-center gap-2 text-sm font-semibold transition-colors',
                  step.disabled && 'cursor-not-allowed opacity-60',
                  !step.disabled && onChange && 'cursor-pointer',
                )}>
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                    state === 'completed' &&
                      'bg-success text-success-foreground',
                    state === 'active' && 'bg-primary text-primary-foreground',
                    state === 'pending' &&
                      'bg-muted text-muted-foreground border border-border',
                  )}>
                  {state === 'completed' ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    'whitespace-nowrap',
                    state === 'pending'
                      ? 'text-muted-foreground font-normal'
                      : 'text-foreground',
                  )}>
                  {step.name}
                </span>
              </button>
            </li>
            {!isLast && <div className="h-px w-24 bg-border" aria-hidden />}
          </Fragment>
        );
      })}
    </ol>
  );
}
