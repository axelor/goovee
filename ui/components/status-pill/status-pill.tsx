import * as React from 'react';
import {cn} from '@/utils/css';

export type StatusKey =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'paid'
  | 'accepted'
  | 'cancelled'
  | 'unpaid'
  | 'rejected'
  | 'overdue'
  | 'partial'
  | 'proposal'
  | 'draft'
  | 'expired'
  | 'feedback';

const STATUS_CLASSES: Record<StatusKey, {wrapper: string; dot: string}> = {
  pending: {
    wrapper: 'bg-status-pending-bg text-status-pending-fg',
    dot: 'bg-status-pending-dot',
  },
  confirmed: {
    wrapper: 'bg-status-confirmed-bg text-status-confirmed-fg',
    dot: 'bg-status-confirmed-dot',
  },
  shipped: {
    wrapper: 'bg-status-shipped-bg text-status-shipped-fg',
    dot: 'bg-status-shipped-dot',
  },
  delivered: {
    wrapper: 'bg-status-delivered-bg text-status-delivered-fg',
    dot: 'bg-status-delivered-dot',
  },
  paid: {
    wrapper: 'bg-status-paid-bg text-status-paid-fg',
    dot: 'bg-status-paid-dot',
  },
  accepted: {
    wrapper: 'bg-status-accepted-bg text-status-accepted-fg',
    dot: 'bg-status-accepted-dot',
  },
  cancelled: {
    wrapper: 'bg-status-cancelled-bg text-status-cancelled-fg',
    dot: 'bg-status-cancelled-dot',
  },
  unpaid: {
    wrapper: 'bg-status-unpaid-bg text-status-unpaid-fg',
    dot: 'bg-status-unpaid-dot',
  },
  rejected: {
    wrapper: 'bg-status-rejected-bg text-status-rejected-fg',
    dot: 'bg-status-rejected-dot',
  },
  overdue: {
    wrapper: 'bg-status-overdue-bg text-status-overdue-fg',
    dot: 'bg-status-overdue-dot',
  },
  partial: {
    wrapper: 'bg-status-partial-bg text-status-partial-fg',
    dot: 'bg-status-partial-dot',
  },
  proposal: {
    wrapper: 'bg-status-proposal-bg text-status-proposal-fg',
    dot: 'bg-status-proposal-dot',
  },
  draft: {
    wrapper: 'bg-status-draft-bg text-status-draft-fg',
    dot: 'bg-status-draft-dot',
  },
  expired: {
    wrapper: 'bg-status-expired-bg text-status-expired-fg',
    dot: 'bg-status-expired-dot',
  },
  feedback: {
    wrapper: 'bg-status-feedback-bg text-status-feedback-fg',
    dot: 'bg-status-feedback-dot',
  },
};

const SIZE_CLASSES = {
  sm: {wrapper: 'px-2 py-[3px] text-[11px] gap-1.5', dot: 'h-1.5 w-1.5'},
  md: {wrapper: 'pl-2 pr-2.5 py-1 text-xs gap-1.5', dot: 'h-1.5 w-1.5'},
  lg: {wrapper: 'pl-2.5 pr-3 py-1.5 text-[13px] gap-2', dot: 'h-[7px] w-[7px]'},
} as const;

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusKey;
  size?: keyof typeof SIZE_CLASSES;
  label?: React.ReactNode;
}

const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({status, size = 'md', label, className, children, ...props}, ref) => {
    const palette = STATUS_CLASSES[status];
    const sizes = SIZE_CLASSES[size];
    const content = children ?? label;

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-semibold whitespace-nowrap',
          palette.wrapper,
          sizes.wrapper,
          className,
        )}
        {...props}>
        <span
          aria-hidden
          className={cn('rounded-full shrink-0', palette.dot, sizes.dot)}
        />
        {content}
      </span>
    );
  },
);
StatusPill.displayName = 'StatusPill';

export {StatusPill};
