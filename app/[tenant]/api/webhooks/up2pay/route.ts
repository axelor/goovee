import {NextResponse, after} from 'next/server';
import {headers} from 'next/headers';

import {TENANT_HEADER} from '@/proxy';
import {getTenantConfig} from '@/tenant/config';
import {GATEWAY} from '@/payment/domain/types';
import {handleNotification} from '@/payment/notification';
import {
  isOurUp2payNotification,
  isSignedByUp2pay,
} from '@/payment/adapters/up2pay';

/*
 * Up2Pay's IPN, registered once per merchant account. An account shared with
 * the legacy ERP delivers that system's confirmations here as well, so an IPN
 * whose reference is not one of ours is forwarded to the tenant's
 * `payments.up2pay.legacyForwardUrl` and answered 200 without touching our
 * database: that forward is the one answer that should survive the database
 * being down, which is why the configuration is read from the document rather
 * than by connecting the tenant. Only an IPN Verifone signed is forwarded, so
 * the legacy system is never sent a forged one in our name.
 */
export async function GET(request: Request) {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!isOurUp2payNotification(request)) {
    const legacyUrl = tenantId
      ? getTenantConfig(tenantId)?.payments?.up2pay?.legacyForwardUrl
      : undefined;
    if (!legacyUrl) {
      return new NextResponse('Bad Request', {status: 400});
    }
    let signed = false;
    try {
      signed = isSignedByUp2pay(new URL(request.url).search);
    } catch (error) {
      console.error('Up2Pay IPN not forwarded: it cannot be verified', error);
    }
    if (!signed) {
      return new NextResponse('Bad Request', {status: 400});
    }
    /* The raw search is forwarded untouched so the legacy ERP verifies the
     * same bytes Up2Pay signed. */
    const forwardUrl = `${legacyUrl}${new URL(request.url).search}`;
    after(async () => {
      try {
        const response = await fetch(forwardUrl, {method: 'GET'});
        console.log(
          `Up2Pay IPN forwarded to the legacy ERP (${response.status})`,
        );
      } catch (error) {
        console.error('Up2Pay IPN forward to the legacy ERP failed', error);
      }
    });
    return new NextResponse('OK', {status: 200});
  }

  return handleNotification({request, gateway: GATEWAY.up2pay, tenantId});
}
