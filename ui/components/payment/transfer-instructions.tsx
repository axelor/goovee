// ---- CORE IMPORTS ---- //
import {i18n, l10n} from '@/locale';
import type {AwaitingInstructions} from '@/payment/adapters/types';
import {cn} from '@/utils/css';

/**
 * An amount in minor units, in the payment's own currency and scale. Written
 * in the app's locale, as every other amount is, so the server and the browser
 * render the same string whatever their own defaults.
 */
export function formatMoney(
  minor: number,
  currencyCode: string,
  scale: number,
): string {
  const value = minor / 10 ** scale;
  const language = l10n.getLocale().split(/-|_/)[0];
  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: scale,
      maximumFractionDigits: scale,
    }).format(value);
  } catch {
    return `${value.toFixed(scale)} ${currencyCode}`;
  }
}

/**
 * Where and how the payer wires a transfer the provider is waiting for, as the
 * provider states it. Shown wherever a pending transfer is, so the payer reads
 * the same details on the payment's own page and on what it pays for.
 */
export function TransferInstructions({
  instructions,
  currencyCode,
  currencyScale,
  className,
}: {
  instructions: AwaitingInstructions;
  currencyCode: string;
  currencyScale: number;
  className?: string;
}) {
  const rows: [label: string, value: string | undefined, hint?: string][] = [
    [i18n.t('Account holder'), instructions.accountHolder],
    [i18n.t('IBAN'), instructions.iban],
    [i18n.t('BIC'), instructions.bic],
    [i18n.t('Bank'), instructions.bankName],
    [i18n.t('Routing number'), instructions.routingNumber],
    [i18n.t('Account number'), instructions.accountNumber],
    [
      i18n.t('Transfer reference'),
      instructions.reference,
      i18n.t('Enter this in the reference field of your bank transfer.'),
    ],
    [
      i18n.t('Amount remaining'),
      instructions.amountRemaining
        ? formatMoney(
            Math.round(
              Number(instructions.amountRemaining) * 10 ** currencyScale,
            ),
            currencyCode,
            currencyScale,
          )
        : undefined,
    ],
  ];
  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-2 rounded-md border border-ink-200 bg-white p-4 text-sm sm:grid-cols-2',
        className,
      )}>
      {rows
        .filter(([, value]) => Boolean(value))
        .map(([label, value, hint]) => (
          <div key={label}>
            <dt className="text-ink-500">{label}</dt>
            <dd className="font-mono break-words">{value}</dd>
            {hint && <dd className="text-xs text-ink-500">{hint}</dd>}
          </div>
        ))}
    </dl>
  );
}
