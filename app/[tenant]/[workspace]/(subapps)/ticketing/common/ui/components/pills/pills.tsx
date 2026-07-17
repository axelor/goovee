import {forwardRef} from 'react';
import {Maybe} from '@/types/util';
import {cn} from '@/utils/css';

type PillProps = {
  name: Maybe<string>;
  className?: string;
};

const pillBase =
  'inline-flex items-center gap-1.5 rounded-full font-semibold text-[11px] px-2 py-0.5 whitespace-nowrap';
const dotBase = 'h-1.5 w-1.5 rounded-full shrink-0';

const statusStyles: Record<string, {wrapper: string; dot: string}> = {
  New: {
    wrapper: 'bg-status-pending-bg text-status-pending-fg',
    dot: 'bg-status-pending-dot',
  },
  'In progress': {
    wrapper: 'bg-status-pending-bg text-status-pending-fg',
    dot: 'bg-status-pending-dot',
  },
  Done: {
    wrapper: 'bg-status-delivered-bg text-status-delivered-fg',
    dot: 'bg-status-delivered-dot',
  },
  Resolved: {
    wrapper: 'bg-status-delivered-bg text-status-delivered-fg',
    dot: 'bg-status-delivered-dot',
  },
  Canceled: {
    wrapper: 'bg-status-cancelled-bg text-status-cancelled-fg',
    dot: 'bg-status-cancelled-dot',
  },
  Cancelled: {
    wrapper: 'bg-status-cancelled-bg text-status-cancelled-fg',
    dot: 'bg-status-cancelled-dot',
  },
  Feedback: {
    wrapper: 'bg-status-feedback-bg text-status-feedback-fg',
    dot: 'bg-status-feedback-dot',
  },
};

const defaultStatus = {
  wrapper: 'bg-status-draft-bg text-status-draft-fg',
  dot: 'bg-status-draft-dot',
};

export const Status = forwardRef<HTMLSpanElement, PillProps>(
  ({name, className}, ref) => {
    if (!name) return null;
    const palette = statusStyles[name] ?? defaultStatus;
    return (
      <span ref={ref} className={cn(pillBase, palette.wrapper, className)}>
        <span aria-hidden className={cn(dotBase, palette.dot)} />
        {name}
      </span>
    );
  },
);

Status.displayName = 'Status';

const priorityStyles: Record<string, {wrapper: string; dot: string}> = {
  High: {
    wrapper: 'bg-status-overdue-bg text-status-overdue-fg',
    dot: 'bg-status-overdue-dot',
  },
  Urgent: {
    wrapper: 'bg-status-cancelled-bg text-status-cancelled-fg',
    dot: 'bg-status-cancelled-dot',
  },
  Normal: {
    wrapper: 'bg-status-pending-bg text-status-pending-fg',
    dot: 'bg-status-pending-dot',
  },
  Low: {
    wrapper: 'bg-status-shipped-bg text-status-shipped-fg',
    dot: 'bg-status-shipped-dot',
  },
};

export const Priority = forwardRef<HTMLSpanElement, PillProps>(
  ({name, className}, ref) => {
    if (!name) return null;
    const palette = priorityStyles[name] ?? defaultStatus;
    return (
      <span ref={ref} className={cn(pillBase, palette.wrapper, className)}>
        <span aria-hidden className={cn(dotBase, palette.dot)} />
        {name}
      </span>
    );
  },
);

Priority.displayName = 'Priority';

export const Category = forwardRef<HTMLSpanElement, PillProps>(
  ({name, className}, ref) => {
    if (!name) return null;
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-md font-semibold text-[11px] px-2 py-0.5 whitespace-nowrap',
          'bg-royal-pale text-royal',
          className,
        )}>
        {name}
      </span>
    );
  },
);

Category.displayName = 'Category';
