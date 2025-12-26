'use client';

import {MdArrowBack} from 'react-icons/md';
import React, {useCallback, useEffect, useState} from 'react';
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

// ---- LOCAL IMPORTS ---- //
import {TotalProps} from '@/subapps/invoices/common/types/invoices';
import {
  INVOICE,
  INVOICE_PAYMENT_OPTIONS,
} from '@/subapps/invoices/common/constants/invoices';
import {InvoicePayments} from '@/subapps/invoices/common/ui/components';
import {cn} from '@/utils/css';

export function Total({isUnpaid, workspace, invoice, invoiceType}: TotalProps) {
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

  const config = workspace?.config;
  const allowOnlinePayment = config?.allowOnlinePaymentForInvoices;
  const canPayInvoice = config?.canPayInvoice ?? INVOICE_PAYMENT_OPTIONS.NO;
  const paymentOptionSet = config?.paymentOptionSet;

  const allowInvoicePayment =
    isUnpaid &&
    allowOnlinePayment &&
    canPayInvoice !== INVOICE_PAYMENT_OPTIONS.NO &&
    Boolean(paymentOptionSet?.length);

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
          amountRemaining?.formattedValue,
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

  return (
    <div
      className="flex flex-col bg-card text-card-foreground px-6 py-4 rounded-lg"
      style={{height: 'fit-content'}}>
      <h4 className="text-xl font-medium mb-0">{i18n.t('Total')}</h4>
      <Separator className="my-2.5" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p>{i18n.t('Total WT')}:</p>
            <p className="whitespace-nowrap">{exTaxTotal}</p>
          </div>
          <div className="flex items-center justify-between">
            <p>{i18n.t('Taxes')}:</p>
            <p className="whitespace-nowrap">{taxTotal}</p>
          </div>
          <div className="flex items-center justify-between">
            <h6 className="font-medium">{i18n.t('Total ATI')}:</h6>
            <h6 className="font-medium whitespace-nowrap">{inTaxTotal}</h6>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-base">
          {invoicePaymentList?.map(list => (
            <div key={list.id} className="flex justify-between gap-2">
              <div>
                {i18n.t('Paid on')} {list.paymentDate}:{' '}
              </div>
              {list.amount}
            </div>
          ))}
        </div>
        {isUnpaid && (
          <div className="flex flex-col gap-4 font-medium text-xl">
            <div>{i18n.t('Remaining to pay')}:</div>
            <div className="ml-auto">{amountRemaining?.formattedValue}</div>
          </div>
        )}
      </div>
      {invoiceType !== INVOICE.PAID && (
        <>
          {allowInvoicePayment && !paymentType && (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-4">
                <Button
                  variant={'success'}
                  className="text-white font-medium"
                  onClick={async () => {
                    form.setValue('amount', String(remainingAmountValue));
                    form.handleSubmit(onSubmit)();
                  }}>
                  {i18n.t('Pay all')}
                </Button>
                {canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL && (
                  <Button
                    variant={'success'}
                    className="text-white font-medium"
                    disabled={!form.formState.isValid}
                    onClick={async () => {
                      const isValid = await form.trigger('amount');
                      if (isValid) {
                        form.handleSubmit(onSubmit)();
                      }
                    }}>
                    {i18n.t('Partially pay')}
                  </Button>
                )}
              </div>
              {canPayInvoice === INVOICE_PAYMENT_OPTIONS.PARTIAL && (
                <Form {...form}>
                  <form className="space-y-4">
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}
            </div>
          )}

          <div
            className={cn('hidden flex-col gap-2.5', {
              ['flex']: allowInvoicePayment && paymentType,
            })}>
            <div className="flex items-center gap-2.5">
              <MdArrowBack
                className="w-6 h-6 cursor-pointer"
                onClick={resetPaymentType}
              />
              <span className="text-xl font-medium">
                {paymentType === INVOICE_PAYMENT_OPTIONS.TOTAL
                  ? i18n.t('Pay all')
                  : `${i18n.t('Pay partially')}: ${formatNumber(
                      currentAmount || 0,
                      {
                        currency: currency.symbol,
                        type: 'DECIMAL',
                      },
                    )}`}
              </span>
            </div>
            <Separator />
            <InvoicePayments
              workspace={workspace}
              invoice={invoice}
              amount={currentAmount}
              paymentType={paymentType}
              resetPaymentType={resetPaymentType}
              resetForm={resetForm}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Total;
