import {NextResponse} from 'next/server';
import {cookies, headers} from 'next/headers';

import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import {getSession} from '@/auth';
import {canViewPayment} from '@/payment/access';
import {parseReference} from '@/payment/domain/reference';
import {findPaymentView} from '@/payment/view';

/*
 * What the result page polls. Gated the way the page is: the return leg's
 * cookie or the signed-in payer. Answers 404 for anything else, so the
 * endpoint confirms nothing about references it is probed with.
 */
export async function GET(
  _request: Request,
  props: {params: Promise<{reference: string}>},
): Promise<NextResponse> {
  const {reference: referenceParam} = await props.params;
  const tenantId = (await headers()).get(TENANT_HEADER);
  const tenant = tenantId ? await manager.getTenant(tenantId) : null;
  const parsed = parseReference(referenceParam);
  if (!tenant || !parsed || parsed.tenantId !== tenant.id) {
    return new NextResponse('Not Found', {status: 404});
  }

  const view = await findPaymentView(tenant, parsed.reference);
  if (!view) {
    return new NextResponse('Not Found', {status: 404});
  }

  const [cookieStore, session] = await Promise.all([cookies(), getSession()]);
  const allowed = canViewPayment({
    cookies: cookieStore,
    tenant,
    reference: view.reference,
    payer: view.payer,
    userEmail: session?.user?.email,
  });
  if (!allowed) {
    return new NextResponse('Not Found', {status: 404});
  }

  return NextResponse.json(view, {headers: {'Cache-Control': 'no-store'}});
}
