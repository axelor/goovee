'use client';

import {MdArrowBack} from 'react-icons/md';
import React, {useCallback, useState} from 'react';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Separator,
} from '@/ui/components';
import {formatNumber} from '@/locale/formatters';
import {useSearchParams} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {PaymentOption} from '@/types';
import {isPaymentOptionAvailable} from '@/utils/payment';
import {cn} from '@/utils/css';
import {formatMoney} from '@/ui/components/payment/transfer-instructions';

// ---- LOCAL IMPORTS ---- //
import {TotalProps} from '@/subapps/invoices/common/types/invoices';
import {PendingTransfers} from '@/subapps/invoices/common/ui/components/pending-transfers';

// Parse a formatted currency string into a JS number, tolerating both
// FR/EU ("1 234,56 €") and US ("1,234.56") locales.
function parseFormattedNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value == null) return 0;
  let clean = String(value).replace(/[^\d.,-]/g, '');
  if (!clean) return 0;
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');
  if (lastComma > lastDot) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
    clean = clean.replace(/,/g, '');
  }
  const num = parseFloat(clean);
  return Number.isFinite(num) ? num : 0;
}
import {
  INVOICE,
  INVOICE_PAYMENT_OPTIONS,
} from '@/subapps/invoices/common/constants/invoices';
import {InvoicePayments} from '@/subapps/invoices/common/ui/components';

export function Total({
  isUnpaid,
  config,
  invoice,
  invoiceType,
  token,
  pendingTransfers,
  gateways,
  checkoutToken,
}: TotalProps) {
  const {
    inTaxTotal,
    exTaxTotal,
    amountRemaining,
    taxTotal,
    invoicePaymentList,
    currency,
  } = invoice;
  const {searchParams} = useSearchParams();
  const type = searchParams.get('type') as INVOICE_PAYMENT_OPTIONS;

  const [paymentType, setPaymentType] =
    useState<INVOICE_PAYMENT_OPTIONS | null>(type ?? null);

  const resetPaymentType = useCallback(() => {
    setPaymentType(null);
  }, []);

  const allowOnlinePayment = config.allowOnlinePaymentForInvoices;
  const canPayInvoice = config.canPayInvoice ?? INVOICE_PAYMENT_OPTIONS.NO;
  const paymentOptionSet = config.paymentOptionSet;

  /* The same rule a start is refused under: while a transfer has received
   * part of its amount, the payer completes it rather than paying again. */
  const partlyFundedTransfer = pendingTransfers.find(
    transfer => transfer.partlyFunded,
  );

  const allowInvoicePayment =
    isUnpaid &&
    allowOnlinePayment &&
    canPayInvoice !== INVOICE_PAYMENT_OPTIONS.NO &&
    Boolean(paymentOptionSet?.length) &&
    !partlyFundedTransfer;

  const {workspaceURL} = useWorkspace();
  /* The same conditions the withdrawal is refused under, so the action is not
   * offered where it would fail. */
  const cancelScope =
    allowOnlinePayment &&
    canPayInvoice !== INVOICE_PAYMENT_OPTIONS.NO &&
    isPaymentOptionAvailable(paymentOptionSet, PaymentOption.stripe)
      ? {invoiceId: invoice.id, workspaceURL, token}
      : null;

  const remainingAmountValue = parseFloat(amountRemaining?.value || '0');

  const formSchema = z.object({
    amount: z
      .string()
      .refine(val => val.trim() !== '', {
        message: i18n.t('Amount is required'),
      })
      .refine(val => /^\d+(\.\d{1,2})?$/.test(val), {
        message: i18n.t('Invalid amount format'),
      })
      .refine(val => parseFloat(val) > 0, {
        message: i18n.t('Amount must be greater than 0'),
      })
      .refine(val => parseFloat(val) <= remainingAmountValue, {
        message: i18n.t(
          `Amount cannot exceed {0}`,
          String(amountRemaining?.formattedValue ?? ''),
        ),
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '0',
    },
    mode: 'onChange',
  });

  const currentAmount = form.watch('amount') || '0';

  const resetForm = useCallback(() => {
    form.reset();
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      form.setValue('amount', value);
      form.trigger('amount');
    }
  };

  const onSubmit = (values: {amount: string}) => {
    const isTotalPayment = parseFloat(values.amount) === remainingAmountValue;
    setPaymentType(
      isTotalPayment
        ? INVOICE_PAYMENT_OPTIONS.TOTAL
        : INVOICE_PAYMENT_OPTIONS.PARTIAL,
    );
  };

  const hasPartialPayment = Boolean(invoicePaymentList?.length);
  const totalAti = parseFormattedNumber(inTaxTotal);
  const paidPct =
    hasPartialPayment && totalAti > 0
      ? Math.min(
          Math.max(((totalAti - remainingAmountValue) / totalAti) * 100, 0),
          100,
        )
      : 0;

  return (
    <div className="flex flex-col p-6 gap-5" style={{height: 'fit-content'}}>
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
          {i18n.t('Payment')}
        </p>
        <h2 className="text-lg font-bold text-ink-900">{i18n.t('Total')}</h2>
      </header>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-ink-500">{i18n.t('Total WT')}</dt>
          <dd className="whitespace-nowrap text-ink-900 tabular-nums">
            {exTaxTotal}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-500">{i18n.t('Taxes')}</dt>
          <dd className="whitespace-nowrap text-ink-900 tabular-nums">
            {taxTotal}
          </dd>
        </div>
      </dl>

      <div className="border-t border-ink-100 pt-4 flex items-baseline justify-between">
        <span className="font-semibold text-ink-700">
          {i18n.t('Total ATI')}
        </span>
        <span className="text-2xl font-bold text-ink-900 tabular-nums">
          {inTaxTotal}
        </span>
      </div>

      {!!invoicePaymentList?.length && (
        <ul className="flex flex-col gap-1.5 text-xs">
          {invoicePaymentList.map(list => (
            <li
              key={list.id}
              className="flex justify-between gap-2 text-ink-500">
              <span>
                {i18n.t('Paid on')}{' '}
                <span className="tabular-nums">{list.paymentDate}</span>
              </span>
              <span className="tabular-nums text-mint-700 font-semibold">
                {list.amount}
              </span>
            </li>
          ))}
        </ul>
      )}

      <PendingTransfers
        transfers={pendingTransfers}
        cancelScope={cancelScope}
      />

      {isUnpaid && (
        <div className="rounded-lg p-4 bg-status-overdue-bg/40 border border-status-overdue-bg flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-status-overdue-fg">
              {i18n.t('Amount remaining')}
            </span>
            <span className="text-xl font-bold text-status-overdue-fg tabular-nums">
              {amountRemaining?.formattedValue}
            </span>
          </div>
          {paidPct > 0 && (
            <div>
              <div className="flex items-center justify-between text-[11px] text-ink-500 mb-1">
                <span>{i18n.t('Paid')}</span>
                <span className="tabular-nums">{paidPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white overflow-hidden">
                <div
                  className="h-full bg-mint-500 rounded-full transition-all"
                  style={{width: `${paidPct}%`}}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {invoiceType !== INVOICE.PAID && (
        <>
          {isUnpaid && partlyFundedTransfer && (
            <p className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-3 text-sm text-ink-700">
              {i18n.t(
                'A bank transfer on this invoice has already received part of its amount. Send the remaining {0} using its bank details above; another payment can be made once it completes.',
                formatMoney(
                  partlyFundedTransfer.remaining,
                  partlyFundedTransfer.currencyCode,
                  partlyFundedTransfer.currencyScale,
                ),
              )}
            </p>
          )}
          {allowInvoicePayment && !paymentType && (
            <div className="flex flex-col gap-3">
              <Button
                variant="royal"
                className="w-full font-semibold"
                onClick={async () => {
                  form.setValue('amount', String(remainingAmountValue));
                  form.handleSubmit(onSubmit)();
                }}>
                {i18n.t('Pay')} {amountRemaining?.formattedValue}
              </Button>
              {canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL && (
                <>
                  <Form {...form}>
                    <form className="space-y-2">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({field}) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={i18n.t('Enter the amount to pay')}
                                value={field.value}
                                onChange={handleChange}
                                inputMode="decimal"
                                type="number"
                                step="0.1"
                                className="border-ink-150"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                  <Button
                    variant="royal-outline"
                    className="w-full font-semibold"
                    disabled={!form.formState.isValid}
                    onClick={async () => {
                      const isValid = await form.trigger('amount');
                      if (isValid) {
                        form.handleSubmit(onSubmit)();
                      }
                    }}>
                    {i18n.t('Partially pay')}
                  </Button>
                </>
              )}
            </div>
          )}

          <div
            className={cn('hidden flex-col gap-3', {
              ['flex']: allowInvoicePayment && paymentType,
            })}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-ink-500 hover:text-ink-700"
                onClick={resetPaymentType}
                aria-label={i18n.t('Back')}>
                <MdArrowBack className="w-5 h-5" />
              </button>
              <span className="text-base font-bold text-ink-900">
                {paymentType === INVOICE_PAYMENT_OPTIONS.TOTAL
                  ? i18n.t('Pay all')
                  : `${i18n.t('Pay partially')}: ${formatNumber(
                      currentAmount || 0,
                      {
                        currency: currency?.symbol,
                        type: 'DECIMAL',
                      },
                    )}`}
              </span>
            </div>
            <Separator className="bg-ink-100" />
            <InvoicePayments
              invoice={invoice}
              amount={currentAmount}
              token={token}
              gateways={gateways}
              checkoutToken={checkoutToken}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Total;
