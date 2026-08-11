'use client';

import {MdWarningAmber} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';

/* AOS prices each product through its web service, and when it cannot price one
 * for this customer the shop falls back to the catalogue price — a number the
 * customer would not actually be charged. Every surface that prints a price
 * says so, otherwise the fallback reads as the real price. */
export function PriceWarning({
  errorMessage,
  className,
}: {
  errorMessage?: string;
  className?: string;
}) {
  if (!errorMessage) return null;

  return (
    <p
      className={cn(
        'm-0 flex items-center gap-1 font-semibold text-status-pending-fg',
        className,
      )}>
      <MdWarningAmber className="shrink-0" />
      {i18n.t('Price may be incorrect')}
    </p>
  );
}
