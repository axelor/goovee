'use client';

import * as React from 'react';

import {cn} from '@/utils/css';
import {clampPercentage, type ProgressTone} from '../progress-fill';

const TONE_CLASSES: Record<ProgressTone, string> = {
  active: 'stroke-mint-500',
  paused: 'stroke-status-pending-dot',
  error: 'stroke-destructive',
};

/*
 * The ring is drawn in a fixed 0–100 user space and scaled by the wrapper's
 * pixel size, so one component serves any diameter. `pathLength` restates the
 * circumference as 100 units, which lets the dash offset be the percentage
 * itself rather than a figure derived from the radius.
 */
const VIEWBOX = 100;
const CENTER = VIEWBOX / 2;

export interface ProgressRingProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Completion, 0–100. Anything outside the range is clamped. */
  value: number;
  tone?: ProgressTone;
  /** Outer diameter, in pixels. */
  size?: number;
  /** Ring thickness, in the ring's own 0–100 space. */
  strokeWidth?: number;
  /** Accessible name for what is progressing, e.g. the file being uploaded. */
  label: string;
}

/**
 * Progress drawn as a ring, for a file that is shown as a preview and should
 * stay visible while it uploads.
 *
 * Being a circle rather than a traced outline, it sits over a thumbnail, a
 * rounded avatar or a square logo unchanged — only the diameter differs. Any
 * children are centred inside it, which is where an action belongs.
 */
const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      value,
      tone = 'active',
      size = 40,
      strokeWidth = 10,
      label,
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const percentage = clampPercentage(value);
    const radius = CENTER - strokeWidth / 2;

    return (
      <div
        ref={ref}
        className={cn('relative grid place-items-center', className)}
        /* The ring is square and sized in pixels, so a caller's own style is
           merged in rather than allowed to replace the dimensions. */
        style={{width: size, height: size, ...style}}
        {...props}>
        {/* The role sits on the drawing rather than on the container, so that
            controls rendered as children stay in the accessibility tree —
            `progressbar` treats its own subtree as presentational. */}
        <svg
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          /* The drawing covers the whole box, so it would otherwise take the
             clicks meant for a control centred inside it. Nothing here is
             interactive, so it takes none. */
          className="pointer-events-none absolute inset-0 size-full -rotate-90">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-ink-150"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 - percentage}
            className={cn(
              'transition-[stroke-dashoffset] duration-200 ease-out',
              TONE_CLASSES[tone],
            )}
          />
        </svg>
        <div className="relative">{children}</div>
      </div>
    );
  },
);
ProgressRing.displayName = 'ProgressRing';

export {ProgressRing};
