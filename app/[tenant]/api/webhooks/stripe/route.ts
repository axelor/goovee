import {headers} from 'next/headers';

import {TENANT_HEADER} from '@/proxy';
import {GATEWAY} from '@/payment/domain/types';
import {handleNotification} from '@/payment/notification';

/*
 * One Stripe endpoint per tenant, registered in the Stripe dashboard with the
 * tenant's own signing secret. Every Stripe payment method the tenant offers
 * delivers here; the adapter sorts the events by the gateway recorded on them.
 */
export async function POST(request: Request) {
  return handleNotification({
    request,
    gateway: GATEWAY.stripeCard,
    tenantId: (await headers()).get(TENANT_HEADER),
  });
}
