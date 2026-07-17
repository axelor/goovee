// ---- CORE IMPORTS ---- //
import type {ReactNode} from 'react';
import type {StatusKey, TimelineStep} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {
  CUSTOMERS_DELIVERY_STATUS,
  ORDER_DELIVERY_STATUS,
  ORDER_STATUS,
  ORDER_TYPE,
} from '@/subapps/orders/common/constants/orders';

export function getStatus(
  statusSelect: number,
  deliveryState: number,
): {
  status: string;
  variant: 'success' | 'purple' | 'yellow' | 'primary' | 'default';
} {
  if (statusSelect === ORDER_STATUS.CONFIRMED) {
    if (deliveryState === ORDER_DELIVERY_STATUS.DELIVERED) {
      return {
        status: ORDER_TYPE.DELIVERED,
        variant: 'primary',
      };
    }
    return {
      status: ORDER_TYPE.CONFIRMED,
      variant: 'yellow',
    };
  } else if (statusSelect === ORDER_STATUS.CLOSED) {
    return {
      status: ORDER_TYPE.CLOSED,
      variant: 'success',
    };
  } else {
    return {
      status: ORDER_TYPE.UNKNOWN,
      variant: 'default',
    };
  }
}

// ---- New design system mappers ---- //

export function getStatusKey(
  statusSelect: number,
  deliveryState: number,
): StatusKey {
  if (statusSelect === ORDER_STATUS.CONFIRMED) {
    if (deliveryState === ORDER_DELIVERY_STATUS.DELIVERED) return 'delivered';
    if (deliveryState === CUSTOMERS_DELIVERY_STATUS.PLANNED) return 'shipped';
    return 'confirmed';
  }
  if (statusSelect === ORDER_STATUS.CLOSED) return 'delivered';
  return 'draft';
}

export function getOrderJourney(
  statusSelect: number,
  deliveryState: number,
  meta?: {
    orderedAt?: ReactNode;
    confirmedAt?: ReactNode;
    shippedAt?: ReactNode;
    deliveredAt?: ReactNode;
  },
): TimelineStep[] {
  const confirmed =
    statusSelect === ORDER_STATUS.CONFIRMED ||
    statusSelect === ORDER_STATUS.CLOSED;
  const shipped =
    deliveryState === ORDER_DELIVERY_STATUS.DELIVERED ||
    deliveryState === CUSTOMERS_DELIVERY_STATUS.PLANNED;
  const delivered = deliveryState === ORDER_DELIVERY_STATUS.DELIVERED;

  return [
    {
      label: 'Order placed',
      state: 'done',
      meta: meta?.orderedAt,
    },
    {
      label: 'Confirmed',
      state: confirmed ? 'done' : 'current',
      meta: confirmed ? meta?.confirmedAt : undefined,
    },
    {
      label: 'Prepared and shipped',
      state: shipped ? 'done' : confirmed ? 'current' : 'upcoming',
      meta: shipped ? meta?.shippedAt : undefined,
    },
    {
      label: 'Delivered',
      state: delivered ? 'done' : shipped ? 'current' : 'upcoming',
      meta: delivered ? meta?.deliveredAt : undefined,
    },
  ];
}
