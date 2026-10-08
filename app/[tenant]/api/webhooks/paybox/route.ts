import {headers} from 'next/headers';

import {TENANT_HEADER} from '@/proxy';
import {GATEWAY} from '@/payment/domain/types';
import {handleNotification} from '@/payment/notification';

/*
 * Paybox's server-to-server confirmation, the PBX_REPONDRE_A address sent with
 * every payment. Paybox cannot be asked what became of a payment afterwards,
 * so this is the one confirmation that arrives whether or not the buyer's
 * browser came back. Delivered by GET with the fields in the query, or by POST
 * with them in the body where the back office is set that way.
 */
async function handle(request: Request) {
  return handleNotification({
    request,
    gateway: GATEWAY.paybox,
    tenantId: (await headers()).get(TENANT_HEADER),
  });
}

export const GET = handle;
export const POST = handle;
