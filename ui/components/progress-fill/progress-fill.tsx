'use client';

import * as React from 'react';

import {cn} from '@/utils/css';

/**
 * How a progress value reads at the moment: advancing, held at a point it can
 * be continued from, or stopped by a failure.
 */
export type ProgressTone = 'active' | 'paused' | 'error';

const TONE_CLASSES: Record<ProgressTone, {fill: string; value: string}> = {
  active: {fill: 'bg-mint-100', value: 'text-mint-700'},
  paused: {fill: 'bg-status-pending-bg', value: 'text-status-pending-fg'},
  error: {fill: 'bg-destructive-light', value: 'text-destructive'},
};

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export interface ProgressFillProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Completion, 0–100. Anything outside the range is clamped. */
  value: number;
  tone?: ProgressTone;
  /** Accessible name for what is progressing, e.g. the file being uploaded. */
  label: string;
  /** Render the rounded percentage at the trailing edge. */
  showValue?: boolean;
}

/**
 * Progress drawn as a tint behind its own content rather than as a bar beside
 * it, so a label and its progress share one line.
 *
 * The tint stops where the progress stopped, which is what makes `paused` and
 * `error` worth telling apart by colour: the fill marks the point the work
 * would carry on from.
 */
const ProgressFill = React.forwardRef<HTMLDivElement, ProgressFillProps>(
  (
    {value, tone = 'active', label, showValue, className, children, ...props},
    ref,
  ) => {
    const percentage = clampPercentage(value);
    const palette = TONE_CLASSES[tone];

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center gap-2 overflow-hidden',
          className,
        )}
        {...props}>
        {/* The role sits on the tint rather than on the container, so that
            controls rendered as children stay in the accessibility tree —
            `progressbar` treats its own subtree as presentational. */}
        <span
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn(
            'absolute inset-y-0 left-0 transition-[width] duration-200 ease-out',
            palette.fill,
          )}
          style={{width: `${percentage}%`}}
        />
        <div className="relative min-w-0 flex-1">{children}</div>
        {showValue && (
          <span
            className={cn(
              'relative shrink-0 text-xs font-semibold tabular-nums',
              palette.value,
            )}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  },
);
ProgressFill.displayName = 'ProgressFill';

export {ProgressFill};
