// ---- LOCAL IMPORTS ---- //
import {
  DAYS,
  HOURS,
  MINUTES,
  QUOTATION_STATUS,
  QUOTATION_TYPE,
  SECONDS,
} from '@/subapps/quotations/common/constants/quotations';

type Variant = 'blue' | 'yellow' | 'destructive' | 'default';

export function getStatus(statusSelect: any): {
  status: any;
  variant: Variant;
} {
  let status: any;
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

export const updateDocument = (date1: any, date2: any) => {
  let update;
  const diffInDays = Math.round(date1.diff(date2, DAYS, true));
  const diffInHours = date1.diff(date2, HOURS);
  const diffInMins = Math.round(date1.diff(date2, MINUTES, true));

  if (diffInDays === 0) {
    if (diffInHours === 0) {
      update = diffInMins === 0 ? SECONDS : `${diffInMins} ${MINUTES}`;
    } else {
      update = `${diffInHours} ${HOURS}`;
    }
  } else {
    update = `${Math.round(diffInDays)} ${DAYS}`;
  }

  return update;
};
