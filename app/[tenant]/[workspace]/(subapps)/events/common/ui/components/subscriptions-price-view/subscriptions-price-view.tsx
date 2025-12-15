'use client';

import {useEffect, useMemo} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {formatNumber} from '@/locale/formatters';
import {Separator} from '@/ui/components';
import {DEFAULT_CURRENCY_SCALE, DEFAULT_CURRENCY_SYMBOL} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import {getCalculatedTotalPrice} from '@/subapps/events/common/utils/payments';
import type {EventPayments} from '@/subapps/events/common/types';

const getParticipantsNames = (participants: any[]): string =>
  participants.map((_p: any) => `${_p.name} ${_p.surname}`).join(', ');

export function SubscriptionsPriceView({
  form,
  list,
  currency,
  event,
  onTotalPriceChange,
}: {
  form: any;
  list: any[];
  currency: {
    symbol: string;
    numberOfDecimals: number;
  };
  event: EventPayments;
  onTotalPriceChange: (value: number) => void;
}) {
  const currencySymbol = currency?.symbol || DEFAULT_CURRENCY_SYMBOL;
  const scale = currency?.numberOfDecimals || DEFAULT_CURRENCY_SCALE;

  const otherPeople = form.watch('otherPeople') || [];
  const rootName = form.watch('name');
  const rootSurname = form.watch('surname');

  const subscriptionSet = useMemo(
    () => form.watch('subscriptionSet') || [],
    [form.watch('subscriptionSet')],
  );

  const selectedMainSubscriptions = useMemo(() => {
    return list.filter(subscription =>
      subscriptionSet.some((s: any) => s.id === subscription.id),
    );
  }, [subscriptionSet, list]);

  const secondaryParticipants = otherPeople.map((p: any) => ({
    ...p,
    subscriptionSet: p.subscriptionSet || [],
  }));

  const participants = useMemo(() => {
    const mainParticipant = {
      name: rootName || '',
      surname: rootSurname || '',
      subscriptionSet: selectedMainSubscriptions,
    };
    return [mainParticipant, ...secondaryParticipants];
  }, [selectedMainSubscriptions, rootName, rootSurname, secondaryParticipants]);

  const {total, subscriptionPrices} = useMemo(() => {
    const formValues = {
      name: rootName || '',
      surname: rootSurname || '',
      subscriptionSet: selectedMainSubscriptions,
      otherPeople: secondaryParticipants,
    };

    return getCalculatedTotalPrice(formValues, event);
  }, [
    selectedMainSubscriptions,
    rootName,
    rootSurname,
    secondaryParticipants,
    event,
  ]);

  const validParticipants = useMemo(() => {
    return participants.filter(
      (p: any) => p.name.trim() !== '' || p.surname.trim() !== '',
    );
  }, [participants]);

  const hasParticipants = validParticipants?.length > 0;

  useEffect(() => {
    onTotalPriceChange(total);
  }, [onTotalPriceChange, total]);

  return (
    <div className="flex flex-col gap-6">
      <Separator className="bg-zinc-200" />

      {hasParticipants ? (
        <div className="border p-4 rounded-lg flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-xl">
              {i18n.t('Total Price')}:{' '}
              <span className="text-success">
                {formatNumber(total, {
                  scale,
                  currency: currencySymbol,
                  type: 'DECIMAL',
                })}
              </span>
            </div>
            <div className="font-semibold text-normal">
              {i18n.t('No. of participants')}:{' '}
              <span className="font-normal">
                {validParticipants.length} (
                {getParticipantsNames(validParticipants)})
              </span>
            </div>
          </div>

          {subscriptionPrices?.length > 0 && (
            <div className="flex flex-col gap-4 pl-4 border-success border-l">
              {subscriptionPrices.map(({facility, price}) => {
                const subscriptionUsers = participants.filter((p: any) =>
                  p.subscriptionSet.some((f: any) => f.facility === facility),
                );

                return (
                  <div key={facility}>
                    <div className="font-semibold text-normal">
                      {facility}:{' '}
                      <span className="text-success">
                        {formatNumber(price, {
                          scale,
                          currency: currencySymbol,
                          type: 'DECIMAL',
                        })}
                      </span>
                      {subscriptionUsers?.length > 0 && (
                        <div className="text-slate-500">
                          {subscriptionUsers.length} (
                          {getParticipantsNames(subscriptionUsers)})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">
          {i18n.t(
            'Please enter participant details to see subscriptions and pricing.',
          )}
        </div>
      )}
    </div>
  );
}

export default SubscriptionsPriceView;
