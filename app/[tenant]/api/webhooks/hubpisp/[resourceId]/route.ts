import {headers} from 'next/headers';

import {TENANT_HEADER} from '@/proxy';
import {GATEWAY} from '@/payment/domain/types';
import {handleNotification} from '@/payment/notification';

/*
 * BPCE calls this address, registered per tenant, with the payment link's id
 * as the last segment and no body worth reading. The adapter reads the link
 * back over mTLS, which is where the trust comes from.
 */
export async function POST(request: Request) {
  return handleNotification({
    request,
    gateway: GATEWAY.hubpisp,
    tenantId: (await headers()).get(TENANT_HEADER),
  });
}
