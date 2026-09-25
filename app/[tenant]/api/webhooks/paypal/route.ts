import {headers} from 'next/headers';

import {TENANT_HEADER} from '@/proxy';
import {GATEWAY} from '@/payment/domain/types';
import {handleNotification} from '@/payment/notification';

/*
 * One PayPal webhook per tenant, registered in the PayPal developer dashboard;
 * its id goes in the tenant's `payments.paypal.webhookId`, which is what the
 * signature is checked against.
 */
export async function POST(request: Request) {
  return handleNotification({
    request,
    gateway: GATEWAY.paypal,
    tenantId: (await headers()).get(TENANT_HEADER),
  });
}
