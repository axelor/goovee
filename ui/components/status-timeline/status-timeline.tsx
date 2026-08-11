import * as React from 'react';
import {MdCheck} from 'react-icons/md';
import {cn} from '@/utils/css';

export type TimelineStepState = 'done' | 'current' | 'upcoming';

export interface TimelineStep {
  label: React.ReactNode;
  state: TimelineStepState;
  meta?: React.ReactNode;
}

export type TimelineTone = 'mint' | 'rejected';

export interface StatusTimelineProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'orientation'> {
  steps: TimelineStep[];
  orientation?: 'horizontal' | 'vertical';
  tone?: TimelineTone;
  compact?: boolean;
}

const TONE_FILLED: Record<TimelineTone, string> = {
  mint: 'bg-mint-500 text-white',
  rejected: 'bg-status-rejected-dot text-white',
};

const TONE_RING: Record<TimelineTone, string> = {
  mint: 'ring-[4px] ring-mint-100',
  rejected: 'ring-[4px] ring-status-rejected-bg',
};

const TONE_CONNECTOR_DONE: Record<TimelineTone, string> = {
  mint: 'bg-mint-500',
  rejected: 'bg-status-rejected-dot',
};

const StatusTimeline = React.forwardRef<HTMLDivElement, StatusTimelineProps>(
  (
    {
      steps,
      orientation = 'horizontal',
      tone = 'mint',
      compact = false,
      className,
      ...props
    },
    ref,
  ) => {
    if (orientation === 'vertical') {
      return (
        <div ref={ref} className={cn('flex flex-col', className)} {...props}>
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            const done = step.state === 'done';
            const current = step.state === 'current';
            return (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex flex-col items-center shrink-0">
                  <Circle state={step.state} index={i} tone={tone} size={32} />
                  {!isLast && (
                    <div
                      className={cn(
                        'w-[2px] flex-1 my-1 min-h-9',
                        done ? TONE_CONNECTOR_DONE[tone] : 'bg-ink-150',
                      )}
                    />
                  )}
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <div
                    className={cn(
                      'text-sm font-semibold',
                      done || current ? 'text-ink-900' : 'text-ink-500',
                    )}>
                    {step.label}
                  </div>
                  {step.meta && (
                    <div className="text-xs text-ink-400 mt-0.5 tabular-nums">
                      {step.meta}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-start w-full', className)}
        {...props}>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const done = step.state === 'done';
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <Circle
                  state={step.state}
                  index={i}
                  tone={tone}
                  size={compact ? 18 : 22}
                />
                {!compact && (
                  <span
                    className={cn(
                      'text-[11px] font-medium whitespace-nowrap',
                      done || step.state === 'current'
                        ? 'text-ink-700'
                        : 'text-ink-400',
                    )}>
                    {step.label}
                  </span>
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 rounded-sm',
                    compact ? 'mx-1' : 'mx-1.5 mt-[10px]',
                    done ? TONE_CONNECTOR_DONE[tone] : 'bg-ink-100',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);
StatusTimeline.displayName = 'StatusTimeline';

function Circle({
  state,
  index,
  tone,
  size,
}: {
  state: TimelineStepState;
  index: number;
  tone: TimelineTone;
  size: number;
}) {
  const done = state === 'done';
  const current = state === 'current';
  return (
    <span
      className={cn(
        'grid place-items-center rounded-full text-[12px] font-bold transition-all shrink-0',
        done && TONE_FILLED[tone],
        current && cn(TONE_FILLED[tone], TONE_RING[tone]),
        !done && !current && 'bg-white border-2 border-ink-150 text-ink-400',
      )}
      style={{width: size, height: size}}>
      {done ? <MdCheck className="h-[14px] w-[14px]" /> : index + 1}
    </span>
  );
}

export {StatusTimeline};
