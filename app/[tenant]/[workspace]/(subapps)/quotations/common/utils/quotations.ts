// ---- CORE IMPORTS ---- //
import type {ReactNode} from 'react';
import type {StatusKey, TimelineStep, TimelineTone} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {
  QUOTATION_STATUS,
  QUOTATION_TYPE,
} from '@/subapps/quotations/common/constants/quotations';

type Variant = 'blue' | 'yellow' | 'destructive' | 'default';

export function getStatus(statusSelect: number | string): {
  status: string;
  variant: Variant;
} {
  let status: string;
  let variant: Variant;

  switch (statusSelect) {
    case QUOTATION_STATUS.DRAFT_QUOTATION:
      status = QUOTATION_TYPE.DRAFT;
      variant = 'blue';
      break;
    case QUOTATION_STATUS.FINALISED_QUOTATION:
      status = QUOTATION_TYPE.FINALISED;
      variant = 'yellow';
      break;
    case QUOTATION_STATUS.CANCELED_QUOTATION:
      status = QUOTATION_TYPE.CANCELED;
      variant = 'destructive';
      break;
    default:
      status = QUOTATION_TYPE.UNKNOWN;
      variant = 'default';
  }

  return {status, variant};
}

// ---- New design system mappers ---- //

export function getStatusKey(statusSelect: number): StatusKey {
  switch (statusSelect) {
    case QUOTATION_STATUS.DRAFT_QUOTATION:
      return 'draft';
    case QUOTATION_STATUS.FINALISED_QUOTATION:
      return 'proposal';
    case QUOTATION_STATUS.CONFIRMED:
    case QUOTATION_STATUS.COMPLETED:
      return 'accepted';
    case QUOTATION_STATUS.CANCELED_QUOTATION:
      return 'rejected';
    default:
      return 'draft';
  }
}

export function getQuoteTone(statusSelect: number): TimelineTone {
  return statusSelect === QUOTATION_STATUS.CANCELED_QUOTATION
    ? 'rejected'
    : 'mint';
}

export function getQuoteJourney(
  statusSelect: number,
  meta?: {
    createdAt?: ReactNode;
    sentAt?: ReactNode;
    answeredAt?: ReactNode;
    convertedAt?: ReactNode;
  },
): TimelineStep[] {
  const cancelled = statusSelect === QUOTATION_STATUS.CANCELED_QUOTATION;
  const sent =
    statusSelect === QUOTATION_STATUS.FINALISED_QUOTATION ||
    statusSelect === QUOTATION_STATUS.CONFIRMED ||
    statusSelect === QUOTATION_STATUS.COMPLETED;
  const answered =
    statusSelect === QUOTATION_STATUS.CONFIRMED ||
    statusSelect === QUOTATION_STATUS.COMPLETED;
  const converted = statusSelect === QUOTATION_STATUS.COMPLETED;

  if (cancelled) {
    return [
      {label: 'Quote created', state: 'done', meta: meta?.createdAt},
      {
        label: 'Quote sent',
        state: sent ? 'done' : 'upcoming',
        meta: sent ? meta?.sentAt : undefined,
      },
      {label: 'Refused', state: 'done', meta: meta?.answeredAt},
    ];
  }

  return [
    {label: 'Quote created', state: 'done', meta: meta?.createdAt},
    {
      label: 'Quote sent',
      state: sent ? 'done' : 'current',
      meta: sent ? meta?.sentAt : undefined,
    },
    {
      label: 'Quote finalised',
      state: answered ? 'done' : sent ? 'current' : 'upcoming',
      meta: answered ? meta?.answeredAt : undefined,
    },
    {
      label: 'Converted to order',
      state: converted ? 'done' : answered ? 'current' : 'upcoming',
      meta: converted ? meta?.convertedAt : undefined,
    },
  ];
}
