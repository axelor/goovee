'use client';

import type {UseFormReturn} from 'react-hook-form';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import type {ModelField} from '@/orm/model-fields';
import {PAYMENT_SOURCE} from '@/payment/domain/types';
import type {OfferedGateway} from '@/payment/offer';
import type {Cloned} from '@/types/util';
import {PaymentMethods} from '@/ui/components/payment/payment-methods';
import {useToast} from '@/ui/hooks';
import {scale} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import type {FullEvent} from '../../../orm/event';
import {mapParticipants} from '@/subapps/events/common/utils';
import {getCalculatedTotalPrice} from '@/subapps/events/common/utils/payments';

/**
 * The payment buttons of a paid registration. The form's values are read when
 * a button is pressed and sent as the intent; the server validates and prices
 * them. The outcome is shown by the payment page the gateway sends the browser
 * back to, which continues to the confirmation page.
 */
export function EventPayments({
  event,
  form,
  metaFields,
  metaFieldsFacilities,
  additionalFieldSet,
  gateways,
  checkoutToken,
}: {
  event: Pick<
    Cloned<FullEvent>,
    'id' | 'displayAti' | 'facilityList' | 'priceScale'
  >;
  form: UseFormReturn<Record<string, unknown>>;
  metaFields: ModelField[];
  metaFieldsFacilities: ModelField[];
  additionalFieldSet: ModelField[] | null | undefined;
  gateways: OfferedGateway[];
  checkoutToken: string;
}) {
  const isValid =
    form.formState.isValid && !Object.keys(form.formState.errors || {}).length;
  const {toast} = useToast();

  const mappedParticipants = () =>
    mapParticipants(
      form.getValues() as Parameters<typeof mapParticipants>[0],
      metaFields,
      metaFieldsFacilities,
      additionalFieldSet ?? [],
    );

  const validate = async (): Promise<boolean> => {
    const isEmailValid = await form.trigger('emailAddress');
    const isValidForm = await form.trigger();
    if (!isEmailValid || !isValidForm) {
      return false;
    }
    const {total} = getCalculatedTotalPrice(mappedParticipants(), event);
    if (Number(scale(total, event.priceScale)) <= 0) {
      toast({
        variant: 'destructive',
        title: i18n.t('The amount must be greater than zero.'),
      });
      return false;
    }
    return true;
  };

  return (
    <PaymentMethods
      gateways={gateways}
      source={PAYMENT_SOURCE.events}
      intent={() => ({eventId: event.id, values: mappedParticipants()})}
      checkoutToken={checkoutToken}
      disabled={!isValid}
      onValidate={validate}
    />
  );
}

export default EventPayments;
