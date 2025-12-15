// ---- LOCAL IMPORTS ---- //
import {EventPayments} from '@/subapps/events/common/types';

export const getCalculatedTotalPrice = (
  data: Record<string, any>,
  event: EventPayments,
): {
  total: number;
  subscriptionPrices: {facility: string; price: number}[];
} => {
  if (!data || !event) return {total: 0, subscriptionPrices: []};

  const facilities = event.facilityList || [];
  const subscriptionPrices: {facility: string; price: number}[] = [];

  const getFacilityPrice = (facilityName: string) => {
    const facility = facilities.find(f => f.facility === facilityName);
    return facility ? Number(facility.displayAti) || 0 : 0;
  };

  const addToSubscriptionPrices = (facility: string, price: number) => {
    const existing = subscriptionPrices.find(s => s.facility === facility);
    if (existing) {
      existing.price += price;
    } else {
      subscriptionPrices.push({facility, price});
    }
  };

  const calculateSubscriptionsTotal = (subscriptions: any[]) => {
    return subscriptions?.reduce((sum, subscription) => {
      const price = getFacilityPrice(subscription.facility);
      addToSubscriptionPrices(subscription.facility, price);
      return sum + price;
    }, 0);
  };

  let total =
    (data.subscriptionSet
      ? calculateSubscriptionsTotal(data.subscriptionSet)
      : 0) + Number(event.displayAti);

  if (Array.isArray(data.otherPeople) && data.otherPeople.length) {
    data.otherPeople.forEach(person => {
      total +=
        calculateSubscriptionsTotal(person.subscriptionSet) +
        Number(event.displayAti);
    });
  }

  return {total: total || 0, subscriptionPrices};
};
